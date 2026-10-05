import { describe, expect, it } from "vitest";
import { emptyPractice } from "@/features/practice/practice.types";
import { emptyProgress } from "@/features/progress/progress.types";
import {
  createProgressBackup,
  parseProgressBackup,
  PROGRESS_BACKUP_KIND,
  PROGRESS_BACKUP_VERSION,
} from "@/features/progress/progressBackup";
import { emptyStudy } from "@/features/study/study.types";

describe("progress backup compatibility", () => {
  const exportedAt = "2026-09-25T10:00:00.000Z";

  it("exports and imports all three local stores", () => {
    const backup = createProgressBackup(emptyProgress(), emptyPractice(), emptyStudy());
    expect(backup.version).toBe(3);
    expect(parseProgressBackup(backup)).toMatchObject({ version: 3, study: emptyStudy() });
  });

  it("imports legacy backups without deleting compatibility", () => {
    const common = { kind: PROGRESS_BACKUP_KIND, exportedAt, progress: emptyProgress() };
    expect(parseProgressBackup({ ...common, version: 1 })?.practice).toEqual(emptyPractice());
    expect(
      parseProgressBackup({ ...common, version: 2, practice: emptyPractice() })?.study,
    ).toEqual(emptyStudy());
    expect(
      parseProgressBackup({
        ...common,
        version: 4,
        practice: emptyPractice(),
        study: emptyStudy(),
      }),
    ).toBeNull();
    expect(PROGRESS_BACKUP_VERSION).toBe(3);
  });
});
