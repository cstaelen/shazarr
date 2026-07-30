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
  monitored: boolean;
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

  const created = await request<LidarrArtist>(config, "/artist", {
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
      monitored: true,
      addOptions: { monitor: "none", searchForMissingAlbums: false },
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

// After ensureArtist creates a new artist, Lidarr populates its albums
// asynchronously — poll only until the discography shows up at all (a few
// albums means the initial sync is done), then look up the identified album
// once. If it's not there, it never will be — no point polling further.
async function waitForAlbum(
  config: LidarrConfig,
  artistId: number,
  normalizedAlbum: string,
  timeoutMs = 20_000,
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

// Lidarr can silently revert monitored flags while it's still syncing metadata
// right after an artist is added (cover downloads, album info updates) — a PUT
// sent during that window gets overwritten once the sync finishes. Verify with
// a fresh GET after each attempt and retry until it actually sticks.
async function ensureMonitored<T extends { monitored: boolean }>(
  config: LidarrConfig,
  resource: "artist" | "album",
  id: number,
  attempts = 4,
  delayMs = 2_000
): Promise<T> {
  let entity = await request<T>(config, `/${resource}/${id}`);
  for (let i = 0; i < attempts && !entity.monitored; i++) {
    await request(config, `/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...entity, monitored: true }),
    });
    await new Promise((r) => setTimeout(r, delayMs));
    entity = await request<T>(config, `/${resource}/${id}`);
  }
  return entity;
}

async function triggerOrAddAlbum(
  config: LidarrConfig,
  album: LidarrAlbum,
  wasAlreadyMonitored: boolean
): Promise<LidarrAutoSearchResult> {
  const status = getAlbumStatus(album);
  if (status === "available") return { success: true, status };
  await triggerAlbumSearch(config, album.id);
  // "wanted" means the album was already monitored before this call (nothing
  // changed) — anything we just monitored ourselves is reported as "queued"
  // regardless of Lidarr's raw monitored flag, so the UI can tell them apart.
  return { success: true, status: wasAlreadyMonitored ? status : "queued" };
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
    // Step 1: ensure the artist exists (reuse if already there, else create it).
    const lookupResults = await lookupArtist(config, artistName);
    const exactMatch = lookupResults.filter((a) => normalize(a.artistName) === normalizedArtist);
    const candidate = exactMatch[0] ?? lookupResults[0];
    if (!candidate) return { success: false, message: "Artist not found in lookup" };

    const ensured = await ensureArtist(config, candidate);
    if (!ensured.success) return { success: false, message: ensured.message };

    // Step 2: look up the identified album within the artist's albums. A newly
    // created artist gets its albums populated by Lidarr asynchronously.
    const album = ensured.created
      ? await waitForAlbum(config, ensured.artistId, normalizedAlbum)
      : (await getAlbumsByArtist(config, ensured.artistId)).find((a) => normalize(a.title) === normalizedAlbum) ??
        null;

    // Step 3: no match — roll back the artist if we just created it for nothing.
    if (!album) {
      if (ensured.created) await deleteArtist(config, ensured.artistId);
      return { success: false, message: "Album not found" };
    }

    // Step 4: monitor it (artist-level monitoring is on, but ensureArtist keeps
    // individual albums unmonitored on artist add). For a freshly created artist,
    // Lidarr's background metadata sync can still revert monitored flags, so
    // verify/retry rather than trusting a single PUT.
    const wasAlreadyMonitored = album.monitored;
    const monitoredAlbum = await ensureMonitored<LidarrAlbum>(config, "album", album.id);
    if (ensured.created) await ensureMonitored<LidarrArtist>(config, "artist", ensured.artistId);

    return triggerOrAddAlbum(config, monitoredAlbum, wasAlreadyMonitored);
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : "Album download failed" };
  }
}
