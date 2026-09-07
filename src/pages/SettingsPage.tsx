import { useRef } from "react";
import { DownloadSimple, Globe, Moon, Trash, UploadSimple } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import {
  createProgressBackup,
  downloadProgressBackup,
  parseProgressBackup,
} from "@/features/backup/progressBackup";
import { useReaderTheme } from "@/features/reading/ReaderThemeProvider";
import { READER_THEMES, type ReaderTheme } from "@/features/reading/readerTheme";
import { useProgressActions } from "@/features/progress/useProgress";
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/locale.types";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useReaderTheme();
  const { getProgressSnapshot, replaceProgress, resetAll } = useProgressActions();
  const fileInput = useRef<HTMLInputElement>(null);

  const currentLocale = i18n.language as AppLocale;

  const handleExport = () => {
    downloadProgressBackup(createProgressBackup(getProgressSnapshot()));
  };

  const handleImport = async (file: File) => {
    let backup: ReturnType<typeof parseProgressBackup> = null;
    try {
      backup = parseProgressBackup(JSON.parse(await file.text()) as unknown);
    } catch {
      backup = null;
    }
    if (!backup) {
      window.alert(t("settings.importInvalid"));
      return;
    }
    // Importing replaces rather than merges, so it needs an explicit yes.
    if (!window.confirm(t("settings.importConfirm"))) return;
    replaceProgress(backup.progress);
    window.alert(t("settings.importDone"));
  };

  const handleReset = () => {
    if (window.confirm(t("settings.resetConfirm"))) resetAll();
  };

  return (
    <AppShell title={t("common.settings")} backTo="/profile">
      <h2 className="section-heading">{t("settings.interface")}</h2>
      <div className="settings-card">
        <div className="settings-row">
          <span>
            <Globe size={17} aria-hidden="true" /> {t("settings.language")}
          </span>
          <div className="segmented" role="group" aria-label={t("settings.language")}>
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                className={currentLocale === locale ? "active" : undefined}
                onClick={() => void i18n.changeLanguage(locale)}
              >
                {t(locale === "en" ? "settings.languageEn" : "settings.languageRu")}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <span>
            <Moon size={17} aria-hidden="true" /> {t("settings.readerTheme")}
          </span>
          <div className="segmented" role="group" aria-label={t("settings.readerTheme")}>
            {READER_THEMES.map((option: ReaderTheme) => (
              <button
                key={option}
                type="button"
                className={theme === option ? "active" : undefined}
                onClick={() => setTheme(option)}
              >
                {t(option === "dark" ? "settings.themeDark" : "settings.themeLight")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="section-heading">{t("settings.data")}</h2>
      <p className="settings-note">{t("settings.dataNote")}</p>
      <div className="settings-card">
        <button className="settings-action" type="button" onClick={handleExport}>
          <DownloadSimple size={17} aria-hidden="true" />
          {t("settings.exportProgress")}
        </button>
        <button className="settings-action" type="button" onClick={() => fileInput.current?.click()}>
          <UploadSimple size={17} aria-hidden="true" />
          {t("settings.importProgress")}
        </button>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Cleared first, so picking the same file twice fires `change` again.
            event.target.value = "";
            if (file) void handleImport(file);
          }}
        />
        <button className="settings-action settings-action--danger" type="button" onClick={handleReset}>
          <Trash size={17} aria-hidden="true" />
          {t("settings.resetProgress")}
        </button>
      </div>
    </AppShell>
  );
}
