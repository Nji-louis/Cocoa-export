type RequestHandler = (req: Request) => Response | Promise<Response>;

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

  serve(handler);
}
