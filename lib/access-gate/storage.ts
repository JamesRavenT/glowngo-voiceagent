export const STORAGE_KEY = "glow-and-go.accessKey";

export function readStoredKey(): string | null {
  try {
    const key = window.localStorage.getItem(STORAGE_KEY);
    return key?.trim() || null;
  } catch {
    return null;
  }
}

export function writeStoredKey(key: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    return;
  }
}

export function clearStoredKey(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}



