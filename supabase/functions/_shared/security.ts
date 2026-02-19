export function getAllowedOrigins(): Set<string> {
  const runtime = globalThis as unknown as {
    Deno?: {
      env?: {
        get: (key: string) => string | undefined;
      };
    };
  };

  const raw = runtime.Deno?.env?.get("ALLOWED_ORIGINS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  );
}

export function assertAllowedOrigin(req: Request): void {
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.size === 0) {
    return;
  }

  const origin = req.headers.get("origin");
  if (!origin) {
    return;
  }

  if (!allowedOrigins.has(origin)) {
    throw new Error("Origin is not allowed");
  }
}

export function ensureJsonRequest(req: Request, maxBytes = 65536): void {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const contentLength = req.headers.get("content-length");
  if (!contentLength) {
    return;
  }

  const parsed = Number(contentLength);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid Content-Length header");
  }

  if (parsed > maxBytes) {
    throw new Error(`Payload too large. Maximum allowed is ${maxBytes} bytes`);
  }
}

export async function readJsonObject(req: Request, maxBytes = 65536): Promise<Record<string, unknown>> {
  ensureJsonRequest(req, maxBytes);

  const body = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }

  return body as Record<string, unknown>;
}

export function assertHoneypot(body: Record<string, unknown>, field = "website"): void {
  const value = body[field];
  if (typeof value === "string" && value.trim().length > 0) {
    throw new Error("Spam detected");
  }
}

export function getClientIp(req: Request): string | null {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("fly-client-ip"),
    req.headers.get("x-forwarded-for"),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const ip = raw.split(",")[0].trim();
    if (ip) return ip;
  }

  return null;
}

export async function hashIdentifier(rawValue: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(rawValue);
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
