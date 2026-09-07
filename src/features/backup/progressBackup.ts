import { isRecord } from "@/lib/storage";
import { parseProgressState } from "@/features/progress/progress.storage";
import type { ProgressState } from "@/features/progress/progress.types";

export const PROGRESS_BACKUP_KIND = "ittheory-progress";
export const PROGRESS_BACKUP_VERSION = 1;

export interface ProgressBackup {
  kind: typeof PROGRESS_BACKUP_KIND;
  version: typeof PROGRESS_BACKUP_VERSION;
  exportedAt: string;
  progress: ProgressState;
}

export function createProgressBackup(progress: ProgressState): ProgressBackup {
  return {
    kind: PROGRESS_BACKUP_KIND,
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    progress,
  };
}

/**
 * The imported payload goes through the same parser as a stored blob, so a file
 * from a newer version — or from a different app entirely — is rejected rather
 * than half-applied.
 */
export function parseProgressBackup(value: unknown): ProgressBackup | null {
  if (!isRecord(value)) return null;
  if (value.kind !== PROGRESS_BACKUP_KIND) return null;
  if (value.version !== PROGRESS_BACKUP_VERSION) return null;
  if (typeof value.exportedAt !== "string" || value.exportedAt.length === 0) return null;

  const progress = parseProgressState(value.progress);
  if (!progress) return null;

  return {
    kind: PROGRESS_BACKUP_KIND,
    version: PROGRESS_BACKUP_VERSION,
    exportedAt: value.exportedAt,
    progress,
  };
}

export function progressBackupFilename(date = new Date()): string {
  return `ittheory-progress-${date.toISOString().slice(0, 10)}.json`;
}

/**
 * The anchor has to live in the document and the blob URL has to outlive the
 * click: Firefox and Safari cancel a download whose object URL is revoked in the
 * same tick, which silently loses the only backup the learner can make.
 */
export function downloadProgressBackup(backup: ProgressBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = progressBackupFilename();
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
