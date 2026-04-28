import { cleanAlbumTitle, normalize } from "./utils";

type LidarrConfig = {
  url: string;
  apiKey: string;
};

type LidarrAlbum = {
  id: number;
  title: string;
  artistId: number;
  monitored: boolean;
  statistics?: { percentOfTracks: number };
};

type LidarrArtist = {
  id: number;
  artistName: string;
  foreignArtistId: string;
};

type LidarrArtistLookup = {
  artistName: string;
  foreignArtistId: string;
  artistType?: string;
  disambiguation?: string;
  overview?: string;
  images?: unknown[];
  genres?: string[];
  ratings?: unknown;
  status?: string;
};

type LidarrSearchResult = {
  foreignId: string;
  album?: {
    id: number;
    title: string;
    foreignAlbumId: string;
    artistId: number;
    monitored: boolean;
    statistics?: { percentOfTracks: number };
    artist?: { foreignArtistId: string; artistName: string };
  };
};

export type LidarrAutoSearchResult =
  | { success: true; status?: "queued" | "wanted" | "available" }
  | { success: false; message: string };

async function request<T>(config: LidarrConfig, path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = `${config.url.replace(/\/$/, "")}/api/v1`;
  // Build URL via URL object — Capacitor double-encodes string concatenation
  const [pathname, search] = path.split("?");
  const url = new URL(`${baseUrl}${pathname}`);
  if (search) {
    for (const part of search.split("&")) {
      const eq = part.indexOf("=");
      url.searchParams.set(eq === -1 ? part : part.slice(0, eq), eq === -1 ? "" : part.slice(eq + 1));
    }
  }
  const res = await fetch(url.toString(), {
    ...options,
    headers: { "Content-Type": "application/json", "X-Api-Key": config.apiKey, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lidarr API error (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

async function getAllArtists(config: LidarrConfig): Promise<LidarrArtist[]> {
  return request<LidarrArtist[]>(config, "/artist");
}

async function getAlbumsByArtist(config: LidarrConfig, artistId: number): Promise<LidarrAlbum[]> {
  return request<LidarrAlbum[]>(config, `/album?artistId=${artistId}`);
}

async function lookupArtist(config: LidarrConfig, term: string): Promise<LidarrArtistLookup[]> {
  if (!term?.trim()) return [];
  return request<LidarrArtistLookup[]>(config, `/artist/lookup?term=${term}`);
}

async function ensureArtist(
  config: LidarrConfig,
  artist: LidarrArtistLookup
): Promise<{ success: true; artistId: number; created: boolean } | { success: false; message: string }> {
  if (!artist?.foreignArtistId) return { success: false, message: "Invalid artist: missing foreignArtistId" };

  const existing = await getAllArtists(config);
  const found = existing.find((a) => a.foreignArtistId === artist.foreignArtistId);
  if (found?.id) return { success: true, artistId: found.id, created: false };

  const [rootFolders, qualityProfiles, metadataProfiles] = await Promise.all([
    request<{ path: string }[]>(config, "/rootfolder"),
    request<{ id: number }[]>(config, "/qualityprofile"),
    request<{ id: number; name: string }[]>(config, "/metadataprofile"),
  ]);

  if (!rootFolders?.length) return { success: false, message: "No Lidarr root folders configured" };
  if (!qualityProfiles?.length) return { success: false, message: "No Lidarr quality profiles found" };
  if (!metadataProfiles?.length) return { success: false, message: "No Lidarr metadata profiles found" };

  // Prefer a profile that includes all release types (singles, live, etc.)
  const inclusiveProfile = metadataProfiles.find((p) => /^(none|all|standard)$/i.test(p.name));
  const metadataProfileId = (inclusiveProfile ?? metadataProfiles[0]).id;

  const created = await request<{ id?: number }>(config, "/artist", {
    method: "POST",
    body: JSON.stringify({
      artistName: artist.artistName,
      foreignArtistId: artist.foreignArtistId,
      artistType: artist.artistType || "Person",
      disambiguation: artist.disambiguation || "",
      overview: artist.overview || "",
      images: artist.images || [],
      genres: artist.genres || [],
      ratings: artist.ratings || {},
      status: artist.status || "active",
      qualityProfileId: qualityProfiles[0].id,
      metadataProfileId,
      rootFolderPath: rootFolders[0].path,
      monitored: false,
      addOptions: { searchForMissingAlbums: false },
    }),
  });

  if (!created?.id) return { success: false, message: "Artist added but no id returned" };
  return { success: true, artistId: created.id, created: true };
}

async function deleteArtist(config: LidarrConfig, artistId: number): Promise<void> {
  try {
    await request(config, `/artist/${artistId}?deleteFiles=false`, { method: "DELETE" });
  } catch {
    // best effort
  }
}

async function triggerAlbumSearch(config: LidarrConfig, albumId: number): Promise<void> {
  await request(config, "/command", {
    method: "POST",
    body: JSON.stringify({ name: "AlbumSearch", albumIds: [albumId] }),
  });
}

function getAlbumStatus(album: LidarrAlbum): "available" | "wanted" | "queued" {
  const pct = album.statistics?.percentOfTracks ?? 0;
  if (pct === 100) return "available";
  if (album.monitored) return "wanted";
  return "queued";
}

async function waitForAlbum(
  config: LidarrConfig,
  artistId: number,
  normalizedAlbum: string,
  timeoutMs = 90_000,
  pollIntervalMs = 2_500
): Promise<LidarrAlbum | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const albums = await getAlbumsByArtist(config, artistId);
    if (albums.length > 0) {
      return albums.find((a) => normalize(a.title) === normalizedAlbum) ?? null;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return null;
}

async function findAndAddAlbum(
  config: LidarrConfig,
  albumTitle: string,
  artistName: string,
  normalizedAlbum: string,
  normalizedArtist: string,
  addedArtistIds: number[]
): Promise<LidarrAlbum | null> {
  const results = await request<LidarrSearchResult[]>(config, `/search?term=${albumTitle} ${artistName}`);

  const matched = results?.find(
    (r) =>
      r.album &&
      normalize(r.album.title) === normalizedAlbum &&
      r.album.artist &&
      normalize(r.album.artist.artistName) === normalizedArtist
  );
  if (!matched?.album) return null;

  if (matched.album.id) return matched.album as LidarrAlbum;

  // Artist not yet in Lidarr — ensure it exists
  const artistLookupResults = await lookupArtist(config, artistName);
  const artistCandidate =
    artistLookupResults.find((a) => normalize(a.artistName) === normalizedArtist) ?? artistLookupResults[0];
  if (!artistCandidate) return null;

  const ensured = await ensureArtist(config, artistCandidate);
  if (!ensured.success) return null;
  if (!addedArtistIds.includes(ensured.artistId)) addedArtistIds.push(ensured.artistId);

  const artists = await getAllArtists(config);
  const fullArtist = artists.find((a) => a.id === ensured.artistId);
  if (!fullArtist) return null;

  const added = await request<LidarrAlbum>(config, "/album", {
    method: "POST",
    body: JSON.stringify({
      foreignAlbumId: matched.album.foreignAlbumId,
      monitored: true,
      anyReleaseOk: true,
      images: [],
      artist: fullArtist,
      addOptions: { searchForNewAlbum: true, monitored: true },
    }),
  });

  return added?.id ? added : null;
}

async function triggerOrAddAlbum(
  config: LidarrConfig,
  album: LidarrAlbum
): Promise<LidarrAutoSearchResult> {
  const status = getAlbumStatus(album);
  if (status === "available") return { success: true, status: "available" };
  await triggerAlbumSearch(config, album.id);
  return { success: true, status };
}

export async function lidarrAutoSearch(
  url: string,
  apiKey: string,
  albumTitle: string,
  artistName: string
): Promise<LidarrAutoSearchResult> {
  if (!albumTitle || !artistName) return { success: false, message: "Missing album or artist name" };

  const config: LidarrConfig = { url, apiKey };
  const normalizedAlbum = normalize(cleanAlbumTitle(albumTitle));
  const normalizedArtist = normalize(artistName);

  try {
    const localArtists = await getAllArtists(config);
    const matchedArtist = localArtists.find((a) => normalize(a.artistName) === normalizedArtist);

    if (matchedArtist) {
      const albums = await getAlbumsByArtist(config, matchedArtist.id);
      if (albums.length > 0) {
        const album = albums.find((a) => normalize(a.title) === normalizedAlbum);
        if (album) return triggerOrAddAlbum(config, album);

        // Album not in local list — try search+add (e.g. excluded by metadata profile)
        const found = await findAndAddAlbum(config, albumTitle, artistName, normalizedAlbum, normalizedArtist, []);
        if (found) return triggerOrAddAlbum(config, found);
        return { success: false, message: "Album not found" };
      }
      // Artist exists but 0 albums — try search+add directly
      const found = await findAndAddAlbum(config, albumTitle, artistName, normalizedAlbum, normalizedArtist, []);
      if (found) return triggerOrAddAlbum(config, found);
      return { success: false, message: "Album not found" };
    }

    const lookupResults = await lookupArtist(config, artistName);
    if (!lookupResults?.length) return { success: false, message: "Artist not found in lookup" };

    const exactMatch = lookupResults.filter((a) => normalize(a.artistName) === normalizedArtist);
    const candidate = exactMatch[0] ?? lookupResults[0];

    const preExistingIds = new Set(localArtists.map((a) => a.id));
    const addedArtistIds: number[] = [];

    const ensured = await ensureArtist(config, candidate);
    if (!ensured.success) return { success: false, message: ensured.message };

    if (!preExistingIds.has(ensured.artistId)) addedArtistIds.push(ensured.artistId);

    let album = await waitForAlbum(config, ensured.artistId, normalizedAlbum);

    if (!album) {
      album = await findAndAddAlbum(config, albumTitle, artistName, normalizedAlbum, normalizedArtist, addedArtistIds);
    }

    if (album) return triggerOrAddAlbum(config, album);

    await Promise.all(addedArtistIds.map((id) => deleteArtist(config, id)));
    return { success: false, message: "Album not found" };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : "Album download failed" };
  }
}
