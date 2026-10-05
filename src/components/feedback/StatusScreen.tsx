import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

/** Either a link somewhere useful, or an in-place recovery button. */
export type StatusScreenAction = { label: string; to: string } | { label: string; onClick: () => void };

interface StatusScreenProps {
  title: string;
  description: ReactNode;
  action: StatusScreenAction;
  eyebrow?: string;
  /** Extra technical text below the action; the error boundary shows the message here. */
  detail?: ReactNode;
}

/** The single empty / missing / crashed state, entirely prop-driven. */
export function StatusScreen({ title, description, action, eyebrow, detail }: StatusScreenProps) {
  const { t } = useTranslation();

  return (
    <AppShell className="status-screen-shell">
      <div className="status-screen">
        <p className="eyebrow">{eyebrow ?? t("common.error")}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        {"to" in action ? (
          <Link className="primary-button" to={action.to}>
            {action.label}
          </Link>
        ) : (
          <button className="primary-button" type="button" onClick={action.onClick}>
            {action.label}
          </button>
        )}
        {detail}
      </div>
    </AppShell>
  );
}
