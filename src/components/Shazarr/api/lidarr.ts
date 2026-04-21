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

type LidarrSearchResult = {
  foreignId: string;
  album: {
    title: string;
    foreignAlbumId: string;
    artistId: number;
  };
};

export type LidarrAutoSearchResult =
  | { success: true; status?: "queued" | "wanted" | "available" }
  | { success: false; message: string };

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
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as unknown as T);
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

async function searchAlbum(
  config: LidarrConfig,
  term: string
): Promise<LidarrSearchResult[]> {
  if (!term?.trim()) return [];
  return request<LidarrSearchResult[]>(config, `/search?term=${encodeURIComponent(term)}`);
}

async function getAlbumByForeignId(
  config: LidarrConfig,
  foreignAlbumId: string
): Promise<LidarrAlbum[]> {
  return request<LidarrAlbum[]>(config, `/album?foreignAlbumId=${encodeURIComponent(foreignAlbumId)}`);
}

async function getAlbumsByArtist(
  config: LidarrConfig,
  artistId: number
): Promise<LidarrAlbum[]> {
  return request<LidarrAlbum[]>(config, `/album?artistId=${artistId}`);
}

async function ensureArtist(
  config: LidarrConfig,
  artist: LidarrArtistLookup,
  existingArtists: LidarrArtist[]
): Promise<{ success: true; artistId: number } | { success: false; message: string }> {
  const found = existingArtists.find((a) => a.foreignArtistId === artist.foreignArtistId);
  if (found?.id) return { success: true, artistId: found.id };

  const [rootFolderPath, qualityProfileId, metadataProfileId] = await Promise.all([
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
      addOptions: { searchForMissingAlbums: false },
    }),
  });

  if (!created?.id) return { success: false, message: "Artist added but no id returned" };
  return { success: true, artistId: created.id };
}

async function lookupArtist(
  config: LidarrConfig,
  term: string
): Promise<LidarrArtistLookup[]> {
  if (!term?.trim()) return [];
  return request<LidarrArtistLookup[]>(config, `/artist/lookup?term=${encodeURIComponent(term)}`);
}

function findAlbumInList(albums: LidarrAlbum[], normalizedAlbum: string): LidarrAlbum | null {
  const exact = albums.find((a) => normalize(a.title) === normalizedAlbum);
  if (exact) return exact;
  return albums.find((a) => normalize(a.title).includes(normalizedAlbum)) ?? null;
}

function getAlbumStatus(album: LidarrAlbum): "available" | "wanted" | "queued" {
  const pct = album.statistics?.percentOfTracks ?? 0;
  if (pct === 100) return "available";
  if (album.monitored) return "wanted";
  return "queued";
}

async function triggerAlbumSearch(config: LidarrConfig, albumId: number): Promise<void> {
  await request(config, "/command", {
    method: "POST",
    body: JSON.stringify({ name: "AlbumSearch", albumIds: [albumId] }),
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
  const cleanedAlbum = cleanAlbumTitle(albumTitle);
  const normalizedAlbum = normalize(cleanedAlbum);
  const normalizedArtist = normalize(artistName);

  try {
    const allArtists = await request<LidarrArtist[]>(config, "/artist");

    // Check if album already exists locally
    const matchedLocal = allArtists.find((a) => normalize(a.artistName) === normalizedArtist);
    if (matchedLocal) {
      const albums = await getAlbumsByArtist(config, matchedLocal.id);
      const album = findAlbumInList(albums, normalizedAlbum);
      if (album) {
        const albumStatus = getAlbumStatus(album);
        if (albumStatus === "available") return { success: true, status: "available" };
        await triggerAlbumSearch(config, album.id);
        return { success: true, status: albumStatus };
      }
    }

    // Find album via /search (same as websearch — queries MusicBrainz directly)
    const searchResults = await searchAlbum(config, `${cleanedAlbum} ${artistName}`);
    const matched = searchResults.find((r) => normalize(r.album.title).includes(normalizedAlbum));
    if (!matched) return { success: false, message: "Album not found" };

    // Ensure artist exists in Lidarr
    const artistLookup = await lookupArtist(config, artistName);
    if (!artistLookup?.length) return { success: false, message: "Artist not found in lookup" };

    const candidates = artistLookup.filter((a) => normalize(a.artistName) === normalizedArtist).slice(0, 3);
    const fallbackCandidates = candidates.length ? candidates : artistLookup.slice(0, 3);

    for (const candidate of fallbackCandidates) {
      const ensured = await ensureArtist(config, candidate, allArtists);
      if (!ensured.success) continue;

      // Fetch album by foreignAlbumId — now that artist is added, Lidarr knows this album
      const albums = await getAlbumByForeignId(config, matched.foreignId);
      const album = findAlbumInList(albums, normalizedAlbum);
      if (!album) continue;

      const albumStatus = getAlbumStatus(album);
      if (albumStatus === "available") return { success: true, status: "available" };
      await triggerAlbumSearch(config, album.id);
      return { success: true, status: albumStatus };
    }

    return { success: false, message: "Album not found" };
  } catch (e: unknown) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Album download failed",
    };
  }
}
