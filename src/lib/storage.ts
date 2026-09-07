/**
 * Shared `localStorage` plumbing for the persisted stores (lesson progress, UI
 * locale, reader theme).
 *
 * Every read is defensive: the browser is the only place this data lives, so a
 * blob we cannot recognise is *preserved* under `<key>.bak` before the app
 * starts writing over it. Without that, the first save after a schema bump —
 * or after a stray write by another tab — would destroy the learner's history
 * with no way back.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** ISO timestamps are only ever compared and re-serialised, so presence is enough. */
export const isDate = (value: unknown): value is string => typeof value === "string" && value.length > 0;

export const backupKeyFor = (key: string): string => `${key}.bak`;

/** Keeps the first unrecognised blob; a later one must not overwrite the original. */
function preserveUnreadable(key: string, raw: string): void {
  try {
    const backupKey = backupKeyFor(key);
    if (window.localStorage.getItem(backupKey) === null) {
      window.localStorage.setItem(backupKey, raw);
    }
  } catch {
    // A full or disabled storage must not stop the app from starting.
  }
}

/**
 * Reads and validates one store. `parse` returns `null` for anything it does not
 * recognise — including a future schema version — which triggers the backup.
 */
export function readStored<T>(key: string, parse: (value: unknown) => T | null, fallback: () => T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback();
  }
  if (raw === null) return fallback();

  try {
    const parsed = parse(JSON.parse(raw) as unknown);
    if (parsed) return parsed;
  } catch {
    // Fall through: unparseable JSON is preserved just like an unknown schema.
  }

  preserveUnreadable(key, raw);
  return fallback();
}

export function writeStored(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota must not break the current session.
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Resetting in-memory state still has to work.
  }
}

/** Plain string slot (locale, theme) — no JSON envelope, no backup to make. */
export function readStoredString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Same reasoning as writeStored.
  }
}

/**
 * Newest-wins reconciliation for two snapshots of the same keyed store.
 *
 * `incoming` decides which entries exist — otherwise a reset in one tab would be
 * undone by the other resurrecting the entry it still remembers. Where both know
 * an entry, the newer `updatedAt` wins.
 */
export function mergeRecords<T extends { updatedAt: string }>(
  local: Record<string, T>,
  incoming: Record<string, T>,
): Record<string, T> {
  const merged: Record<string, T> = { ...incoming };
  for (const [id, entry] of Object.entries(local)) {
    const other = merged[id];
    if (other && entry.updatedAt > other.updatedAt) merged[id] = entry;
  }
  return merged;
}

/**
 * Calls `onChange` when another tab rewrites `key`. The `storage` event only
 * fires in *other* tabs, so this never reacts to our own writes.
 */
export function subscribeToStorage(key: string, onChange: (raw: string | null) => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    // `event.key === null` means the whole store was cleared.
    onChange(event.key === null ? null : event.newValue);
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
