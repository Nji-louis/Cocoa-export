import { getAllowedOrigins } from "./security.ts";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = allowedOrigins.size === 0 || !origin || allowedOrigins.has(origin);

    return new Response(isAllowed ? "ok" : "forbidden", {
      status: isAllowed ? 200 : 403,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Origin":
          allowedOrigins.size === 0 ? "*" : isAllowed ? (origin ?? "null") : "null",
      },
    });
  }
  return null;
}
