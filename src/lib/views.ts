/**
 * Per-post view counts, kept in any Upstash-compatible Redis over REST.
 *
 * "Today" is the day in Seoul, fixed, for everyone: the author's day and the
 * reader's number agree, every reader sees the same value, and the result can
 * be cached. The basis is printed next to the number rather than hidden.
 *
 * One person counts once per day. The visitor key is a salted hash of address
 * and user agent that expires at KST midnight — nothing identifying is stored.
 */

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const viewsConfigured = Boolean(url && token);

export type ViewCounts = { total: number; today: number };

type Command = (string | number)[];

async function pipeline(commands: Command[]): Promise<unknown[]> {
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`[views] store answered ${res.status}`);
  const rows = (await res.json()) as { result?: unknown; error?: string }[];
  return rows.map((row) => {
    if (row.error) throw new Error(`[views] ${row.error}`);
    return row.result;
  });
}

const KST_OFFSET = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** The date in Seoul, YYYY-MM-DD. */
export function kstDay(now = Date.now()): string {
  return new Date(now + KST_OFFSET).toISOString().slice(0, 10);
}

/** Seconds until the next Seoul midnight — the visitor key's lifetime. */
function secondsToKstMidnight(now = Date.now()): number {
  const shifted = now + KST_OFFSET;
  const next = (Math.floor(shifted / DAY) + 1) * DAY;
  return Math.max(60, Math.round((next - shifted) / 1000));
}

/** A visitor key that cannot be turned back into an address. */
export async function hashVisitor(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode([...parts, token].join('|'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getViews(slug: string): Promise<ViewCounts> {
  const day = kstDay();
  const [total, today] = await pipeline([
    ['GET', `views:${slug}:total`],
    ['GET', `views:${slug}:day:${day}`],
  ]);
  return { total: Number(total ?? 0), today: Number(today ?? 0) };
}

/** Count one view — once per visitor per Seoul day — and return the counts after. */
export async function recordView(slug: string, visitor: string): Promise<ViewCounts> {
  const day = kstDay();
  const seen = `views:${slug}:seen:${day}:${visitor}`;
  const [fresh] = await pipeline([['SET', seen, '1', 'NX', 'EX', secondsToKstMidnight()]]);
  if (fresh !== 'OK') return getViews(slug);

  const dayKey = `views:${slug}:day:${day}`;
  const [total, today] = await pipeline([
    ['INCR', `views:${slug}:total`],
    ['INCR', dayKey],
    ['EXPIRE', dayKey, 2 * 24 * 60 * 60],
  ]);
  return { total: Number(total), today: Number(today) };
}
