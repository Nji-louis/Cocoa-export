const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function asString(value: unknown, field: string, maxLen = 1000): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  if (trimmed.length > maxLen) {
    throw new Error(`${field} is too long`);
  }
  return trimmed;
}

export function asOptionalString(value: unknown, maxLen = 1000): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export function asEmail(value: unknown, field = "email"): string {
  const email = asString(value, field, 320).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`${field} is invalid`);
  }
  return email;
}

export function asOptionalEmail(value: unknown, field = "email"): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new Error(`${field} is invalid`);
  }
  return trimmed;
}

export function asOptionalPositiveNumber(value: unknown, field: string): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`${field} must be a positive number`);
  }
  return n;
}
