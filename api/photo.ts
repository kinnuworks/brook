// GET /api/photo?id=… — a shared stream photo (already shrunk and stripped of
// location data on the citizen's phone before upload).

import { rpc } from "./_lib/db.js";
import { fail } from "./_lib/http.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fail(400, "bad-id");
  try {
    const b64 = await rpc<string | null>("brook_get_photo", { p_id: id });
    if (!b64) return fail(404, "not-found");
    return new Response(Buffer.from(b64, "base64"), {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400, immutable" },
    });
  } catch {
    return fail(502, "storage-unavailable");
  }
}
