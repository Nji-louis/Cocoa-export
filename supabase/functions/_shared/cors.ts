import { getAllowedOrigins } from "./security.ts";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = allowedOrigins.size === 0 || !origin || allowedOrigins.has(origin);

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin":
      allowedOrigins.size === 0 ? "*" : isAllowed ? (origin ?? "null") : "null",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const headers = buildCorsHeaders(req);
    const isAllowed = headers["Access-Control-Allow-Origin"] !== "null";

    return new Response(isAllowed ? "ok" : "forbidden", {
      status: isAllowed ? 200 : 403,
      headers,
    });
  }
  return null;
}
