import { useEffect, useRef, useState, type ReactNode } from "react";
import { registerSW } from "virtual:pwa-register";
import { useTranslation } from "react-i18next";

type OfflineMessage = "ready" | "update";

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<OfflineMessage | null>(null);
  const updateSW = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    updateSW.current = registerSW({
      onOfflineReady: () => setMessage((current) => current === "update" ? current : "ready"),
      onNeedRefresh: () => setMessage("update"),
    });
  }, []);

  return (
    <>
      {message && (
        <div className="offline-notice" role="status">
          <span>{t(message === "update" ? "offline.updateAvailable" : "offline.ready")}</span>
          {message === "update" && (
            <button type="button" onClick={() => void updateSW.current?.(true)}>{t("offline.installUpdate")}</button>
          )}
          <button type="button" aria-label={t("offline.dismiss")} onClick={() => setMessage(null)}>{t("offline.dismiss")}</button>
        </div>
      )}
      {children}
    </>
  );
}
