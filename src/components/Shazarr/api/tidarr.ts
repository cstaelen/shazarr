import {
  classifyFailure,
  MessageRule,
  parseErrorMessage,
  readJsonResponse,
  ServiceError,
  ServiceErrorKind,
} from "./errors";
import { normalize, titlesMatch } from "./utils";

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
  /** Absent from the search payload, which carries no track count. */
  numberOfTracks?: number;
  artists?: { id: number; name: string }[];
};

/** A track as the search returns it: its album is embedded, minus the count. */
type TidalSearchTrack = {
  id: number;
  title: string;
  artists?: { id: number; name: string }[];
  album?: { id: number; title: string; cover: string; releaseDate: string };
};

type TidalTrack = {
  id: number;
  title: string;
  url: string;
  artists: { id: number; name: string }[];
};

export type TidarrSearchResult = {
  albums: TidalAlbum[];
  /**
   * Set when the result holds the track but is not the release Shazam named,
   * so the dialog can say so rather than pass it off as the right one.
   */
  fromOtherAlbum?: boolean;
};

export type TidarrQueueResult =
  | { success: true; message?: string }
  | { success: false; message: string; kind?: ServiceErrorKind };

export function tidalCoverUrl(cover: string): string {
  return `https://resources.tidal.com/images/${cover.replace(/-/g, "/")}/320x320.jpg`;
}

/** Tidarr's own wording, matched before the generic status handling. */
const TIDARR_RULES: MessageRule[] = [
  { pattern: /log ?in to tidal|tidal.*(log ?in|credential)/i, kind: "tidal-logged-out" },
  { pattern: /invalid api key/i, kind: "bad-api-key" },
  { pattern: /jwt secret/i, kind: "misconfigured" },
  { pattern: /token required/i, kind: "auth-required" },
];

async function request<T>(
  config: TidarrConfig,
  path: string,
  options: RequestInit = {},
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
    throw new ServiceError("unreachable", "Could not reach Tidarr");
  }

  return (await readJsonResponse<T>(res, TIDARR_RULES)) as T;
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

type TidalAlbumPage = {
  rows?: {
    modules?: {
      type?: string;
      pagedList?: { items?: { item?: TidalTrack }[] };
    }[];
  }[];
};

/**
 * An album page carries several paged lists — recommended albums and artists
 * as ALBUM_LIST / ARTIST_LIST — and only ALBUM_ITEMS holds the tracks, which
 * are the only entries wrapped in `item`. This used to read
 * `rows[1].modules[0]` by position: any reordering silently yielded [], and an
 * empty track list reads as "the track is not on this album".
 */
async function fetchAlbumTracks(config: TidarrConfig, albumId: number): Promise<TidalTrack[]> {
  const data = await request<TidalAlbumPage>(
    config,
    `/proxy/tidal/v1/pages/album?${TIDAL_PARAMS}&albumId=${albumId}`,
  );

  const tracks: TidalTrack[] = [];
  for (const row of data?.rows ?? []) {
    for (const module of row?.modules ?? []) {
      if (module?.type !== "ALBUM_ITEMS") continue;
      // Collected rather than returned on the first hit: a multi-disc release
      // can spread its tracks over several ALBUM_ITEMS modules.
      for (const entry of module.pagedList?.items ?? []) {
        if (entry?.item?.title) tracks.push(entry.item);
      }
    }
  }
  return tracks;
}

async function findTrack(
  config: TidarrConfig,
  albumId: number,
  trackTitle: string,
): Promise<TidalTrack | null> {
  const tracks = await fetchAlbumTracks(config, albumId);
  return tracks.find((t) => titlesMatch(t.title, trackTitle)) ?? null;
}

/**
 * Tidal and Shazam disagree on leading articles often enough that strict
 * equality loses real matches — "The Jesus and Mary Chain" against "Jesus and
 * Mary Chain". Containment is only allowed on names long enough to mean
 * something.
 */
function sameArtist(a: string, b: string): boolean {
  if (titlesMatch(a, b)) return true;
  const left = normalize(a);
  const right = normalize(b);
  if (left.length < 4 || right.length < 4) return false;
  return left.includes(right) || right.includes(left);
}

function catchError(e: unknown, fallback: string): TidarrQueueResult {
  if (e instanceof ServiceError) return { success: false, message: e.message, kind: e.kind };
  return { success: false, message: e instanceof Error ? e.message : fallback };
}

export async function tidarrSearchAlbums(
  url: string,
  apiKey: string,
  artist: string,
  album: string,
  trackTitle: string,
): Promise<TidarrSearchResult> {
  const config: TidarrConfig = { url, apiKey };
  // Searched by track, not by album. Tidal returns each track with its album
  // embedded, so one request replaces opening every candidate album in turn,
  // and a release Shazam names differently is still found: for "Status Quo
  // Umleitung" the album section comes back empty while the track section
  // holds the three releases that carry it.
  const data = await request<{ tracks?: { items?: TidalSearchTrack[] } }>(
    config,
    `/proxy/tidal/v2/search?query=${encodeURIComponent(`${artist} ${trackTitle}`)}&${TIDAL_PARAMS}&limit=10`,
  );

  // The artist is checked too: a search for a common title otherwise returns
  // other people's songs — "Status Quo Umleitung" brings back a High School
  // Musical track.
  const matches = (data?.tracks?.items ?? []).filter(
    (t) =>
      !!t?.album?.id &&
      titlesMatch(t.title, trackTitle) &&
      (t.artists ?? []).some((a) => sameArtist(a.name, artist)),
  );
  if (matches.length === 0) return { albums: [] };

  const seen = new Set<number>();
  const albums: TidalAlbum[] = [];
  for (const track of matches) {
    const embedded = track.album;
    if (!embedded || seen.has(embedded.id)) continue;
    seen.add(embedded.id);
    albums.push({
      id: embedded.id,
      title: embedded.title,
      releaseDate: embedded.releaseDate,
      cover: embedded.cover,
      // The album carries no artist of its own here, but the track does.
      artists: track.artists,
    });
  }

  // The release Shazam identified comes first when Tidal has it. Sort is
  // stable, so the others keep their search ranking behind it.
  albums.sort((x, y) => Number(titlesMatch(y.title, album)) - Number(titlesMatch(x.title, album)));
  return { albums, fromOtherAlbum: !titlesMatch(albums[0].title, album) };
}

export async function tidarrFavoriteTrack(
  url: string,
  apiKey: string,
  albumId: number,
  trackTitle: string,
): Promise<TidarrQueueResult> {
  const config: TidarrConfig = { url, apiKey };
  try {
    const settings = await fetchSettings(config);
    if (!settings)
      return { success: false, message: "Could not get Tidal credentials from Tidarr settings" };
    const track = await findTrack(config, albumId, trackTitle);
    if (!track) return { success: false, message: "Track not found in album" };
    const res = await fetch(
      `${config.url.replace(/\/$/, "")}/proxy/tidal/v1/users/${settings.auth.user_id}/favorites/tracks?countryCode=${settings.auth.country_code}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Api-Key": config.apiKey,
        },
        body: `trackId=${track.id}`,
      },
    );
    if (!res.ok)
      throw classifyFailure(res.status, parseErrorMessage(await res.text()), TIDARR_RULES);
    return { success: true, message: "Added to Tidal favorites!" };
  } catch (e) {
    return catchError(e, "Favorite failed");
  }
}

export async function tidarrQueueAlbum(
  url: string,
  apiKey: string,
  album: TidalAlbum,
  artistName: string,
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
  trackTitle: string,
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
