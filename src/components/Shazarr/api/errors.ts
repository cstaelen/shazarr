/**
 * Shared failure classification for the service clients (Tidarr, Lidarr, SoulSync).
 *
 * Each client used to flatten failures into a string and let its button
 * re-derive the cause with regexes. That threw the status code away and matched
 * bare digits, so `/401/` hit any id containing 401 and `/5\d\d/` hit an album
 * id like 1500 — and an auth failure could surface as a missing track.
 * Classification now happens once, in the client, while the response is still
 * in hand. Buttons only map a kind to their own wording.
 */

export type ServiceErrorKind =
  | "unreachable"
  | "non-json"
  | "auth-required"
  | "bad-api-key"
  | "forbidden"
  | "not-found"
  | "server-error"
  | "misconfigured"
  | "tidal-logged-out"
  | "unknown";

export class ServiceError extends Error {
  readonly kind: ServiceErrorKind;
  readonly status?: number;

  constructor(kind: ServiceErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ServiceError";
    this.kind = kind;
    this.status = status;
  }
}

/** Maps a service's own wording to a kind, checked before the status code. */
export type MessageRule = { pattern: RegExp; kind: ServiceErrorKind };

/**
 * Error bodies seen in practice: Tidarr `{ message }`, its proxies
 * `{ userMessage }`, SoulSync `{ error: { message } }`, Lidarr plain text.
 */
export function parseErrorMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      userMessage?: string;
      error?: { message?: string } | string;
    };
    if (typeof parsed?.error === "string") return parsed.error;
    return parsed?.message ?? parsed?.userMessage ?? parsed?.error?.message;
  } catch {
    return undefined;
  }
}

export function classifyFailure(
  status: number,
  serverMessage?: string,
  rules: MessageRule[] = [],
): ServiceError {
  const detail = serverMessage ?? `HTTP ${status}`;

  if (serverMessage) {
    for (const { pattern, kind } of rules) {
      if (pattern.test(serverMessage)) return new ServiceError(kind, detail, status);
    }
  }

  if (status === 401) return new ServiceError("bad-api-key", detail, status);
  if (status === 403) return new ServiceError("forbidden", detail, status);
  if (status === 404) return new ServiceError("not-found", detail, status);
  if (status >= 500) return new ServiceError("server-error", detail, status);
  return new ServiceError("unknown", detail, status);
}

/**
 * Reads a response body once and returns data or throws a classified error.
 * A 2xx with an empty body yields undefined: several endpoints answer that way.
 */
export async function readJsonResponse<T>(
  res: Response,
  rules: MessageRule[] = [],
): Promise<T | undefined> {
  const text = await res.text();

  if (!res.ok) throw classifyFailure(res.status, parseErrorMessage(text), rules);
  if (!text) return undefined;

  try {
    return JSON.parse(text) as T;
  } catch {
    // Never collapsed into an empty result: a login page or a proxy error would
    // then read as "nothing found".
    throw new ServiceError("non-json", "Response was not JSON", res.status);
  }
}

/**
 * Normalizes anything thrown — by fetch, by JSON.parse, by us — into a
 * ServiceError, so callers never have to guess from a message again.
 */
export function toServiceError(e: unknown): ServiceError {
  if (e instanceof ServiceError) return e;
  const message = e instanceof Error ? e.message : "";
  // "Load failed" is how WebKit words a network failure.
  if (/failed to fetch|load failed|network/i.test(message))
    return new ServiceError("unreachable", message || "Network error");
  if (e instanceof SyntaxError) return new ServiceError("non-json", "Response was not JSON");
  return new ServiceError("unknown", message);
}

/**
 * Per-service wording. An empty string means "fall back to the detail or to a
 * service-specific text rule".
 */
export function serviceErrorLabels(service: string): Record<ServiceErrorKind, string> {
  return {
    unreachable: `${service} unreachable`,
    "non-json": `Unexpected response from ${service}`,
    "auth-required": `${service} API key required`,
    "bad-api-key": `Invalid ${service} API key`,
    forbidden: "Access denied",
    "not-found": `${service} not found — check URL`,
    "server-error": `${service} unreachable`,
    misconfigured: `${service} misconfigured — check its logs`,
    "tidal-logged-out": `${service} is not logged in to Tidal`,
    unknown: "",
  };
}
