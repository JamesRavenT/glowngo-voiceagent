const DEFAULT_RETRY_AFTER_SECONDS = 60;

export const ACCESS_KEY_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{3}$/;

export type VerifyOutcome =
  | { status: "valid" }
  | { status: "invalid" }
  | { status: "malformed" }
  | { status: "unavailable" }
  | { status: "rate-limited"; retryAfterSeconds: number }
  | { status: "client-error" };

export function parseRetryAfterSeconds(header: string | null, now = Date.now()): number {
  if (header === null) return DEFAULT_RETRY_AFTER_SECONDS;

  if (/^\d+$/.test(header)) {
    const seconds = Number(header);
    return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
  }

  if (/^[+-]?\d+(?:\.\d+)?$/.test(header)) return DEFAULT_RETRY_AFTER_SECONDS;

  const retryAt = Date.parse(header);
  if (Number.isNaN(retryAt)) return DEFAULT_RETRY_AFTER_SECONDS;

  const seconds = Math.ceil((retryAt - now) / 1_000);
  return seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
}

export async function verifyAccessKey(key: string, projectId: string, endpoint: string): Promise<VerifyOutcome> {
  const normalisedKey = key.trim().toUpperCase();
  if (!ACCESS_KEY_PATTERN.test(normalisedKey)) return { status: "malformed" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: normalisedKey, project: projectId }),
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 429) {
      return {
        status: "rate-limited",
        retryAfterSeconds: parseRetryAfterSeconds(response.headers.get("Retry-After")),
      };
    }

    if (response.status === 400 || response.status === 405) return { status: "client-error" };
    if (response.status !== 200) return { status: "unavailable" };

    const body: unknown = await response.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return { status: "unavailable" };
    }

    if ("valid" in body && body.valid === true) return { status: "valid" };
    if ("valid" in body && body.valid === false) return { status: "invalid" };

    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}


