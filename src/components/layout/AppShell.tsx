import { ArrowLeft, Gear } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

/** The standard screen: header, scrolling body and the bottom navigation. */
export function AppShell({
  children,
  title,
  backTo,
  right,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  /** Renders a back link in the header slot; there is always a route to go to. */
  backTo?: string;
  right?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const isHome = !title && !backTo;

  return (
    <div className="app-background">
      <div className={`app-shell ${className}`}>
        <header className={`app-header ${title ? "app-header--titled" : ""}`}>
          {backTo ? (
            <Link className="icon-button" to={backTo} aria-label={t("common.back")}>
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
          ) : isHome ? (
            <Link to="/" className="brand-mark">
              <span className="brand-mark__caret">&gt;_</span>
            </Link>
          ) : (
            <span />
          )}
          {title && <h1>{title}</h1>}
          {right ??
            (isHome ? (
              <Link className="icon-button" to="/settings" aria-label={t("common.settings")}>
                <Gear size={20} aria-hidden="true" />
              </Link>
            ) : (
              <span />
            ))}
        </header>
        <main className="shell-main">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
