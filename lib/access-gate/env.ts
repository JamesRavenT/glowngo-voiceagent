const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const rawAccessProjectId = process.env.NEXT_PUBLIC_ACCESS_PROJECT_ID;
export const rawAccessVerifyUrl = process.env.NEXT_PUBLIC_ACCESS_VERIFY_URL;

export function parseAccessProjectId(raw: string | undefined): string {
  const projectId = raw?.trim();

  if (!projectId || !UUID_PATTERN.test(projectId)) {
    throw new Error(
      "NEXT_PUBLIC_ACCESS_PROJECT_ID must be set to a valid UUID. If it is absent or invalid, every access key will be rejected and appear to be an invalid key.",
    );
  }

  return projectId;
}

export function parseAccessVerifyUrl(raw: string | undefined): string {
  const verifyUrl = raw?.trim();

  if (!verifyUrl) {
    throw new Error("NEXT_PUBLIC_ACCESS_VERIFY_URL must be set to an absolute HTTPS URL.");
  }

  try {
    const parsedUrl = new URL(verifyUrl);
    if (parsedUrl.protocol !== "https:") throw new Error("invalid protocol");
    return parsedUrl.href;
  } catch {
    throw new Error("NEXT_PUBLIC_ACCESS_VERIFY_URL must be set to an absolute HTTPS URL.");
  }
}
