// Small helpers shared by the API functions.

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  json({ error, ...extra }, status);

/** Reads a JSON body, refusing anything bigger than `maxBytes`. */
export async function readJson<T = unknown>(request: Request, maxBytes: number): Promise<T | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * An anonymous, per-day bucket for rate limiting: a hash of the caller's IP
 * and the date. The IP itself is never stored.
 */
export async function callerBucket(request: Request): Promise<string> {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${day}|${process.env.BROOK_SERVER_SECRET ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Only accept requests from our own pages (blocks other sites using our API). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers, and curl in tests
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  try {
    const o = new URL(origin);
    return o.host === host || o.hostname === "localhost" || o.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
