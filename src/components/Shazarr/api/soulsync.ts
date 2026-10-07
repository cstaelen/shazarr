import { normalize } from "./utils";

type SoulsyncConfig = {
  url: string;
  apiKey?: string;
  profileId?: number;
};

export type SoulsyncQueueResult =
  | { success: true; message?: string }
  | { success: false; message: string };

/**
 * Generic request for SoulSync API v1
 * Handles auth via Bearer header or api_key query param
 */
async function request<T>(
  config: SoulsyncConfig,
  path: string,
  options: RequestInit = {}
): Promise<{
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  pagination?: unknown;
}> {
  const baseUrl = config.url.replace(/\/$/, "");
  const url = new URL(`${baseUrl}${path}`);

  if (config.apiKey && !url.searchParams.has("api_key")) {
    url.searchParams.set("api_key", config.apiKey);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }
  if (config.profileId) {
    headers["X-Profile-Id"] = String(config.profileId);
  }

  try {
    const res = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(
          `SoulSync API error (${res.status}): ${errorData.error?.message || text}`
        );
      } catch {
        throw new Error(`SoulSync API error (${res.status}): ${text}`);
      }
    }

    const content = await res.text();
    if (!content) return { success: true } as const;
    return JSON.parse(content);
  } catch (e) {
    throw new Error(
      `SoulSync unreachable: ${e instanceof Error ? e.message : "Unknown error"}`,
      { cause: e }
    );
  }
}

/**
 * Search tracks via SoulSync external search (Spotify/iTunes/Hydrabase)
 */
export async function soulsyncSearchTracks(
  url: string,
  query: string,
  apiKey?: string,
  profileId?: number,
  limit: number = 5
): Promise<{
  success: boolean;
  tracks?: Array<{
    id: string;
    name: string;
    artists: string[];
    album: string;
    duration_ms?: number;
    image_url?: string;
    source: string;
  }>;
  error?: string;
}> {
  const config: SoulsyncConfig = { url, apiKey, profileId };

  try {
    const result = await request<{
      tracks?: Array<{
        id: string;
        name: string;
        artists: string[];
        album: string;
        duration_ms?: number;
        image_url?: string;
        source: string;
      }>;
    }>(config, "/api/v1/search/tracks", {
      method: "POST",
      body: JSON.stringify({ query, source: "auto", limit }),
    });

    if (result.success && result.data?.tracks) {
      return { success: true, tracks: result.data.tracks };
    }
    return { success: false, error: result.error?.message || "No tracks found" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Search failed" };
  }
}

/**
 * Add a track to SoulSync wishlist (official API: POST /api/v1/wishlist)
 * This triggers automatic download processing
 */
export async function soulsyncAddTrackToWishlist(
  url: string,
  trackTitle: string,
  artistName: string,
  apiKey?: string,
  profileId?: number
): Promise<SoulsyncQueueResult> {
  const config: SoulsyncConfig = { url, apiKey, profileId };

  try {
    // Step 1: Search for track to get Spotify data
    const searchResult = await soulsyncSearchTracks(
      url,
      `${artistName} - ${trackTitle}`,
      apiKey,
      profileId,
      1
    );

    if (!searchResult.success || !searchResult.tracks?.length) {
      return {
        success: false,
        message: `Track not found: ${searchResult.error || "No match"}`,
      };
    }

    const track = searchResult.tracks[0];

    // Step 2: Add to wishlist with required Spotify track data
    const result = await request(config, "/api/v1/wishlist", {
      method: "POST",
      body: JSON.stringify({
        spotify_track_data: {
          id: track.id,
          name: track.name,
          artists: track.artists.map((name) => ({ name })),
          album: { name: track.album, album_type: "album" },
          duration_ms: track.duration_ms,
          image_url: track.image_url,
        },
        failure_reason: null,
        source_type: "api",
      }),
    });

    if (result.success) {
      return { success: true, message: "Track added to SoulSync wishlist!" };
    }
    return { success: false, message: result.error?.message || "Add failed" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to add track",
    };
  }
}

/**
 * Add an album to SoulSync wishlist (adds all album tracks)
 * This triggers automatic download processing for all tracks
 */
export async function soulsyncAddAlbumToWishlist(
  url: string,
  albumTitle: string,
  artistName: string,
  apiKey?: string,
  profileId?: number
): Promise<SoulsyncQueueResult> {
  const config: SoulsyncConfig = { url, apiKey, profileId };

  try {
    // Search for tracks from this album
    const searchResult = await soulsyncSearchTracks(
      url,
      `${artistName} - ${albumTitle}`,
      apiKey,
      profileId,
      25
    );

    if (!searchResult.success || !searchResult.tracks?.length) {
      return {
        success: false,
        message: `Album not found: ${searchResult.error || "No match"}`,
      };
    }

    // Filter tracks from this album
    const albumTracks = searchResult.tracks.filter(
      (t) =>
        normalize(t.album) === normalize(albumTitle) &&
        t.artists.some((a) => normalize(a) === normalize(artistName))
    );

    if (albumTracks.length === 0) {
      // Fallback: try with first result
      const firstTrack = searchResult.tracks[0];
      const result = await request(config, "/api/v1/wishlist", {
        method: "POST",
        body: JSON.stringify({
          spotify_track_data: {
            id: firstTrack.id,
            name: firstTrack.name,
            artists: firstTrack.artists.map((n) => ({ name: n })),
            album: { name: firstTrack.album, album_type: "album" },
            image_url: firstTrack.image_url,
          },
          failure_reason: null,
          source_type: "api",
        }),
      });
      if (result.success) {
        return { success: true, message: `Added 1 track from "${albumTitle}"` };
      }
      return { success: false, message: result.error?.message || "Failed" };
    }

    // Add all album tracks
    let addedCount = 0;
    for (const track of albumTracks) {
      const result = await request(config, "/api/v1/wishlist", {
        method: "POST",
        body: JSON.stringify({
          spotify_track_data: {
            id: track.id,
            name: track.name,
            artists: track.artists.map((n) => ({ name: n })),
            album: { name: track.album, album_type: "album" },
            duration_ms: track.duration_ms,
            image_url: track.image_url,
          },
          failure_reason: null,
          source_type: "api",
        }),
      });
      if (result.success) addedCount++;
    }

    return {
      success: addedCount > 0,
      message: `Added ${addedCount} tracks to wishlist`,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to add album",
    };
  }
}
