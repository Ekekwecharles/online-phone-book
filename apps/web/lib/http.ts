import { ZodError } from "zod";
import { authFromRequest, type Auth } from "./session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store, max-age=0", ...headers },
  });
}

/**
 * CSRF guard for browser (cookie) requests that change data.
 * Cookies are SameSite=Lax, the body must be JSON, and the request must come from our own site.
 */
export function checkSameSite(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  if (req.headers.get("authorization")?.startsWith("Bearer ")) return; // phone app: no cookies, no CSRF
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin");
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === host;
    } catch {}
    if (!ok) throw new ApiError(403, "Something is not right. Please reload the page.");
  } else if (req.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "Something is not right. Please reload the page.");
  }
  // Only a request that carries a body must say it is JSON. A DELETE with no body sends no length at all.
  const ct = req.headers.get("content-type") ?? "";
  const length = req.headers.get("content-length");
  const hasBody = (length !== null && length !== "0") || req.headers.has("transfer-encoding");
  if (hasBody && !ct.includes("application/json")) {
    throw new ApiError(415, "Something is not right. Please reload the page.");
  }
}

export type Ctx = { req: Request; auth: Auth | null; body: <T>(schema: { parse(v: unknown): T }) => Promise<T> };

export function route(opts: { auth: boolean }, fn: (c: Ctx & { auth: Auth }) => Promise<Response>): (req: Request) => Promise<Response>;
export function route(opts: { auth: false }, fn: (c: Ctx) => Promise<Response>): (req: Request) => Promise<Response>;
export function route(opts: { auth: boolean }, fn: (c: any) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      checkSameSite(req);
      const auth = await authFromRequest(req);
      if (opts.auth && !auth) throw new ApiError(401, "Please log in again.");
      const body = async (schema: { parse(v: unknown): unknown }) => {
        let raw: unknown = {};
        try {
          raw = await req.json();
        } catch {
          throw new ApiError(400, "We could not read that. Please try again.");
        }
        return schema.parse(raw);
      };
      return await fn({ req, auth, body });
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message }, e.status, e.headers);
      if (e instanceof ZodError) return json({ error: e.issues[0]?.message ?? "Please check what you typed." }, 400);
      // Never log request data. Only the error name.
      console.error("API error:", e instanceof Error ? e.name + ": " + e.message.slice(0, 120) : "unknown");
      return json({ error: "Something went wrong. Please try again." }, 503);
    }
  };
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export function deviceType(ua: string): string {
  const os = /Android/i.test(ua)
    ? "Android phone"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iPhone"
      : /Windows/i.test(ua)
        ? "Windows computer"
        : /Mac OS X|Macintosh/i.test(ua)
          ? "Mac computer"
          : /Linux/i.test(ua)
            ? "Linux computer"
            : "Unknown device";
  const br = /OPR|Opera/i.test(ua) ? "Opera" : /Edg/i.test(ua) ? "Edge" : /Firefox/i.test(ua) ? "Firefox" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "";
  return br ? `${os} (${br})` : os;
}

export function roughPlace(req: Request): string {
  const city = req.headers.get("x-vercel-ip-city");
  const country = req.headers.get("x-vercel-ip-country");
  let c = "";
  try {
    c = city ? decodeURIComponent(city) : "";
  } catch {}
  const place = [c, country].filter(Boolean).join(", ");
  return place || "Unknown place";
}
