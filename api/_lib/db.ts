// Calls Brook's database functions on Supabase. Every function checks a
// server-only secret, so the public key alone can read or write nothing.

const url = () => process.env.SUPABASE_URL;
const key = () => process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = () => process.env.BROOK_SERVER_SECRET;

export const dbConfigured = () => Boolean(url() && key() && secret());

export async function rpc<T>(fn: string, args: Record<string, unknown>, timeoutMs = 8000): Promise<T> {
  if (!dbConfigured()) throw new Error("database not configured");
  const res = await fetch(`${url()}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key()!, authorization: `Bearer ${key()}`, "content-type": "application/json" },
    body: JSON.stringify({ p_secret: secret(), ...args }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`rpc ${fn} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
