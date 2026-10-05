import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { Gear } from "@phosphor-icons/react/dist/csr/Gear";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { IconLink } from "@/components/ui/IconLink";
import { cx } from "@/lib/cx";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  /** Renders a back link in the header slot; there is always a route to go to. */
  backTo?: string;
  right?: ReactNode;
  className?: string;
}

/** The standard screen: header, scrolling body and the bottom navigation. */
export function AppShell({ children, title, backTo, right, className }: AppShellProps) {
  const { t } = useTranslation();
  const isHome = !title && !backTo;

  return (
    <div className="app-background">
      <div className={cx("app-shell", className)}>
        <header className={cx("app-header", title && "app-header--titled")}>
          {backTo ? (
            <IconLink to={backTo} label={t("common.back")}>
              <ArrowLeft size={20} aria-hidden="true" />
            </IconLink>
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
              <IconLink to="/settings" label={t("common.settings")}>
                <Gear size={20} aria-hidden="true" />
              </IconLink>
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
