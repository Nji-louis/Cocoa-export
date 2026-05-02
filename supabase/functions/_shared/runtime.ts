import { buildCorsHeaders } from "./cors.ts";

type RequestHandler = (req: Request) => Response | Promise<Response>;

function withCorsHeaders(req: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(req);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function serveHttp(handler: RequestHandler): void {
  const runtime = globalThis as unknown as {
    Deno?: {
      serve?: (fn: RequestHandler) => void;
    };
  };

  const serve = runtime.Deno?.serve;
  if (!serve) {
    throw new Error("Deno.serve is unavailable. Run this code in the Supabase Edge Runtime.");
  }

  serve(async (req: Request) => withCorsHeaders(req, await handler(req)));
}
