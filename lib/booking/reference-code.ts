const REFERENCE_PATTERN = /^GG-\d{4}$/i;

export function normalizeReferenceCode(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return REFERENCE_PATTERN.test(normalized) ? normalized : null;
}

export function isValidReferenceCode(value: string): boolean {
  return normalizeReferenceCode(value) !== null;
}

export function generateReferenceCode(
  existingReferences: ReadonlySet<string>,
  random: () => number = Math.random,
): string {
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const digits = Math.floor(random() * 10_000).toString().padStart(4, "0");
    const reference = `GG-${digits}`;
    if (!existingReferences.has(reference)) return reference;
  }
  throw new Error("No booking reference codes are available");
}
