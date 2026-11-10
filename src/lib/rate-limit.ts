import "server-only";

/**
 * Minimal fixed-window rate limiter, keyed by client IP.
 *
 * It protects the OMDb quota from a single noisy client. State is
 * per server instance, which is enough as a first line of defence; for
 * strict global limits put a shared store (e.g. Upstash) behind this API.
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(request: Request, scope: string, max: number): Response | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    const retry = Math.ceil((bucket.reset - now) / 1000);
    return Response.json(
      { error: "Too many requests. Give it a moment.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }
  return null;
}
