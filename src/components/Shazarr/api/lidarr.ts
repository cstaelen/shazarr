import { normalize } from "./utils";

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

type LidarrArtist = {
  id: number;
  artistName: string;
  foreignArtistId: string;
};

export type LidarrAutoSearchResult =
  | { success: true; status?: "queued" | "wanted" | "available" }
  | { success: false; message: string };

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  config: LidarrConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = `${config.url.replace(/\/$/, "")}/api/v1`;
  console.log("[lidarr] fetch", options.method ?? "GET", `${baseUrl}${path}`, options.body ?? "");
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": config.apiKey,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lidarr API error (${res.status}): ${text}`);
  }
  return res.json();
}

async function getQualityProfileId(config: LidarrConfig): Promise<number> {
  const profiles = await request<{ id: number }[]>(config, "/qualityprofile");
  if (!profiles?.length) throw new Error("No Lidarr quality profiles found");
  return profiles[0].id;
}

async function getMetadataProfileId(config: LidarrConfig): Promise<number> {
  const profiles = await request<{ id: number }[]>(config, "/metadataprofile");
  if (!profiles?.length) throw new Error("No Lidarr metadata profiles found");
  return profiles[0].id;
}

async function getRootFolderPath(config: LidarrConfig): Promise<string> {
  const folders = await request<{ path: string }[]>(config, "/rootfolder");
  if (!folders?.length) throw new Error("No Lidarr root folders configured");
  return folders[0].path;
}

async function lookupArtist(
  config: LidarrConfig,
  term: string
): Promise<LidarrArtistLookup[]> {
  if (!term?.trim()) return [];
  return request<LidarrArtistLookup[]>(
    config,
    `/artist/lookup?term=${encodeURIComponent(term)}`
  );
}

async function ensureArtist(
  config: LidarrConfig,
  artist: LidarrArtistLookup,
  existingArtists: LidarrArtist[]
): Promise<
  | { success: true; artistId: number; created: boolean }
  | { success: false; message: string }
> {
  const found = existingArtists.find(
    (a) => a.foreignArtistId === artist.foreignArtistId
  );
  if (found?.id) {
    return { success: true, artistId: found.id, created: false };
  }

  const [rootFolderPath, qualityProfileId, metadataProfileId] =
    await Promise.all([
      getRootFolderPath(config),
      getQualityProfileId(config),
      getMetadataProfileId(config),
    ]);

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
      qualityProfileId,
      metadataProfileId,
      rootFolderPath,
      monitored: false,
      addOptions: { searchForMissingAlbums: true },
    }),
  });

  if (!created?.id) {
    return { success: false, message: "Artist added but no id returned" };
  }
  return { success: true, artistId: created.id, created: true };
}

function getAlbumStatus(album: LidarrAlbum): "available" | "wanted" | "queued" {
  const pct = album.statistics?.percentOfTracks ?? 0;
  if (pct === 100) return "available";
  if (album.monitored) return "wanted";
  return "queued";
}


async function getAlbumsByArtist(
  config: LidarrConfig,
  artistId: number
): Promise<LidarrAlbum[]> {
  return request<LidarrAlbum[]>(config, `/album?artistId=${artistId}`);
}

async function waitForAlbum(
  config: LidarrConfig,
  artistId: number,
  normalizedAlbum: string,
  timeoutMs = 60_000,
  pollIntervalMs = 2_500
): Promise<LidarrAlbum | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const albums = await getAlbumsByArtist(config, artistId);
    if (albums.length > 0) {
      return albums.find((a) => normalize(a.title) === normalizedAlbum) ?? null;
    }
    await delay(pollIntervalMs);
  }
  return null;
}

async function triggerAlbumSearch(
  config: LidarrConfig,
  albumId: number
): Promise<void> {
  await request(config, "/command", {
    method: "POST",
    body: JSON.stringify({ name: "AlbumSearch", albumIds: [albumId] }),
  });
}

async function deleteArtist(
  config: LidarrConfig,
  artistId: number
): Promise<void> {
  await request(config, `/artist/${artistId}?deleteFiles=false`, {
    method: "DELETE",
  });
}

export async function lidarrAutoSearch(
  url: string,
  apiKey: string,
  albumTitle: string,
  artistName: string
): Promise<LidarrAutoSearchResult> {
  if (!albumTitle || !artistName) {
    return { success: false, message: "Missing album or artist name" };
  }

  const config: LidarrConfig = { url, apiKey };
  const normalizedAlbum = normalize(albumTitle);
  const normalizedArtist = normalize(artistName);

  try {
    const allArtists = await request<LidarrArtist[]>(config, "/artist");

    const matchedLocal = allArtists.find(
      (a) => normalize(a.artistName) === normalizedArtist
    );
    if (matchedLocal) {
      const albums = await getAlbumsByArtist(config, matchedLocal.id);
      const album = albums.find((a) => normalize(a.title) === normalizedAlbum);
      if (album) {
        const albumStatus = getAlbumStatus(album);
        if (albumStatus === "available") return { success: true, status: "available" };
        await triggerAlbumSearch(config, album.id);
        return { success: true, status: albumStatus };
      }
      return { success: false, message: "Album not found" };
    }

    const lookupResults = await lookupArtist(config, artistName);
    if (!lookupResults?.length) {
      return { success: false, message: "Artist not found in lookup" };
    }

    const candidates = lookupResults
      .filter((a) => normalize(a.artistName) === normalizedArtist)
      .slice(0, 3);

    const fallbackCandidates = candidates.length
      ? candidates
      : lookupResults.slice(0, 1);

    for (const candidate of fallbackCandidates) {
      const ensured = await ensureArtist(config, candidate, allArtists);
      if (!ensured.success) continue;

      const album = await waitForAlbum(
        config,
        ensured.artistId,
        normalizedAlbum
      );

      if (album) {
        const albumStatus = getAlbumStatus(album);
        if (albumStatus === "available") return { success: true, status: "available" };
        await triggerAlbumSearch(config, album.id);
        return { success: true, status: albumStatus };
      }

      if (ensured.created) {
        await deleteArtist(config, ensured.artistId);
      }
    }

    return { success: false, message: "Album not found" };
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Album download failed",
    };
  }
}
