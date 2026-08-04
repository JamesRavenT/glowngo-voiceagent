const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const rawAccessProjectId = process.env.NEXT_PUBLIC_ACCESS_PROJECT_ID;

export function parseAccessProjectId(raw: string | undefined): string {
  const projectId = raw?.trim();

  if (!projectId || !UUID_PATTERN.test(projectId)) {
    throw new Error(
      "NEXT_PUBLIC_ACCESS_PROJECT_ID must be set to a valid UUID. If it is absent or invalid, every access key will be rejected and appear to be an invalid key.",
    );
  }

  return projectId;
}
