import { normalize } from "./utils";

type TidarrConfig = {
  url: string;
  apiKey: string;
};

type TidarrSettings = {
  auth: { country_code: string; user_id: string };
  quality: string;
};

export type TidalAlbum = {
  id: number;
  title: string;
  releaseDate: string;
  cover: string;
  numberOfTracks: number;
  artists?: { id: number; name: string }[];
};

type TidalTrack = {
  id: number;
  title: string;
  url: string;
  artists: { id: number; name: string }[];
};

export type TidarrQueueResult =
  | { success: true; message?: string }
  | { success: false; message: string };

export function tidalCoverUrl(cover: string): string {
  return `https://resources.tidal.com/images/${cover.replace(/-/g, "/")}/320x320.jpg`;
}

async function request<T>(
  config: TidarrConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${config.url.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": config.apiKey,
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Tidarr unreachable");
  }
  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) throw new Error("Tidarr unreachable");
    const body = await res.text();
    throw new Error(`Tidarr API error (${res.status})${body ? `: ${body}` : ""}`);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text);
  } catch {
    return undefined as T;
  }
}

async function fetchSettings(config: TidarrConfig): Promise<TidarrSettings | null> {
  const data = await request<{
    tiddl_config?: {
      auth?: { country_code?: string; user_id?: string };
      download?: { track_quality?: string };
    };
  }>(config, "/api/settings");
  const auth = data?.tiddl_config?.auth;
  if (!auth?.country_code || !auth?.user_id) return null;
  return {
    auth: { country_code: auth.country_code, user_id: auth.user_id },
    quality: data?.tiddl_config?.download?.track_quality ?? "high",
  };
}

const TIDAL_PARAMS = "countryCode=US&deviceType=BROWSER&locale=en_US";

async function fetchAlbumTracks(config: TidarrConfig, albumId: number): Promise<TidalTrack[]> {
  const data = await request<{
    rows: { modules: { pagedList: { items: { item: TidalTrack }[] } }[] }[];
  }>(config, `/proxy/tidal/v1/pages/album?${TIDAL_PARAMS}&albumId=${albumId}`);
  return data?.rows?.[1]?.modules?.[0]?.pagedList?.items?.map((t) => t.item) ?? [];
}

async function findTrack(config: TidarrConfig, albumId: number, trackTitle: string): Promise<TidalTrack | null> {
  const tracks = await fetchAlbumTracks(config, albumId);
  return tracks.find((t) => normalize(t.title) === normalize(trackTitle)) ?? null;
}

function catchError(e: unknown, fallback: string): TidarrQueueResult {
  return { success: false, message: e instanceof Error ? e.message : fallback };
}

export async function tidarrSearchAlbums(
  url: string,
  apiKey: string,
  artist: string,
  album: string,
  trackTitle: string
): Promise<TidalAlbum[]> {
  const config: TidarrConfig = { url, apiKey };
  const data = await request<{ albums?: { items: TidalAlbum[] } }>(
    config,
    `/proxy/tidal/v2/search?query=${encodeURIComponent(`${artist} ${album}`)}&${TIDAL_PARAMS}&limit=10`
  );
  const normalizedAlbum = normalize(album);
  const normalizedTrack = normalize(trackTitle);
  const candidates = (data?.albums?.items ?? []).filter((a) => normalize(a.title) === normalizedAlbum);
  const results = await Promise.all(
    candidates.map(async (a) => {
      const tracks = await fetchAlbumTracks(config, a.id);
      return tracks.some((t) => normalize(t.title) === normalizedTrack) ? a : null;
    })
  );
  return results.filter((a): a is TidalAlbum => a !== null);
}

export async function tidarrFavoriteTrack(
  url: string,
  apiKey: string,
  albumId: number,
  trackTitle: string
): Promise<TidarrQueueResult> {
  const config: TidarrConfig = { url, apiKey };
  try {
    const settings = await fetchSettings(config);
    if (!settings) return { success: false, message: "Could not get Tidal credentials from Tidarr settings" };
    const track = await findTrack(config, albumId, trackTitle);
    if (!track) return { success: false, message: "Track not found in album" };
    const res = await fetch(
      `${config.url.replace(/\/$/, "")}/proxy/tidal/v1/users/${settings.auth.user_id}/favorites/tracks?countryCode=${settings.auth.country_code}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Api-Key": config.apiKey },
        body: `trackId=${track.id}`,
      }
    );
    if (!res.ok) return { success: false, message: `Tidal error (${res.status}): ${await res.text()}` };
    return { success: true, message: "Added to Tidal favorites!" };
  } catch (e) {
    return catchError(e, "Favorite failed");
  }
}

export async function tidarrQueueAlbum(
  url: string,
  apiKey: string,
  album: TidalAlbum,
  artistName: string
): Promise<TidarrQueueResult> {
  const config: TidarrConfig = { url, apiKey };
  try {
    const settings = await fetchSettings(config);
    await request(config, "/api/save", {
      method: "POST",
      body: JSON.stringify({
        item: {
          id: String(album.id),
          url: `https://listen.tidal.com/album/${album.id}`,
          type: "album",
          status: "queue_download",
          title: album.title,
          artist: artistName,
          quality: settings?.quality,
        },
      }),
    });
    return { success: true };
  } catch (e) {
    return catchError(e, "Queue failed");
  }
}

export async function tidarrQueueTrack(
  url: string,
  apiKey: string,
  albumId: number,
  trackTitle: string
): Promise<TidarrQueueResult> {
  const config: TidarrConfig = { url, apiKey };
  try {
    const [settings, track] = await Promise.all([
      fetchSettings(config),
      findTrack(config, albumId, trackTitle),
    ]);
    if (!track) return { success: false, message: "Track not found in album" };
    await request(config, "/api/save", {
      method: "POST",
      body: JSON.stringify({
        item: {
          id: String(track.id),
          url: `https://listen.tidal.com/track/${track.id}`,
          type: "track",
          status: "queue_download",
          title: track.title,
          artist: track.artists?.[0]?.name ?? "",
          quality: settings?.quality,
        },
      }),
    });
    return { success: true };
  } catch (e) {
    return catchError(e, "Queue failed");
  }
}
