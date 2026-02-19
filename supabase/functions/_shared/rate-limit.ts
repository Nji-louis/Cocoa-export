import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { getClientIp, hashIdentifier } from "./security.ts";

type RateLimitRpcRow = {
  allowed: boolean;
  hit_count: number;
  remaining: number;
  retry_after_seconds: number;
};

type RateLimitInput = {
  functionName: string;
  identifier: string;
  maxHits: number;
  windowSeconds: number;
};

export class RateLimitExceededError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests. Please try again later.");
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getPepper(): string {
  const runtime = globalThis as unknown as {
    Deno?: {
      env?: {
        get: (key: string) => string | undefined;
      };
    };
  };
  return runtime.Deno?.env?.get("RATE_LIMIT_PEPPER") ?? "";
}

async function runRateLimit(
  client: SupabaseClient,
  input: RateLimitInput,
): Promise<RateLimitRpcRow> {
  const hashedIdentifier = await hashIdentifier(`${input.identifier}|${getPepper()}`);
  const { data, error } = await client.rpc("consume_edge_rate_limit", {
    p_function_name: input.functionName,
    p_identifier_hash: hashedIdentifier,
    p_window_seconds: input.windowSeconds,
    p_max_hits: input.maxHits,
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRpcRow | null;
  if (!row) {
    throw new Error("Rate limit check failed: empty response");
  }

  return row;
}

export async function enforceRateLimit(
  client: SupabaseClient,
  input: RateLimitInput,
): Promise<void> {
  const result = await runRateLimit(client, input);
  if (!result.allowed) {
    throw new RateLimitExceededError(result.retry_after_seconds);
  }
}

export async function enforceIpRateLimit(
  client: SupabaseClient,
  req: Request,
  functionName: string,
  maxHits: number,
  windowSeconds: number,
): Promise<void> {
  const userAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 120);
  const ip = getClientIp(req) ?? "unknown";
  await enforceRateLimit(client, {
    functionName,
    identifier: `ip:${ip}|ua:${userAgent}`,
    maxHits,
    windowSeconds,
  });
}
