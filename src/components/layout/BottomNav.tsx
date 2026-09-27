import { Books } from "@phosphor-icons/react/dist/csr/Books";
import { Cards } from "@phosphor-icons/react/dist/csr/Cards";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { UserCircle } from "@phosphor-icons/react/dist/csr/UserCircle";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { to: "/", labelKey: "nav.overview", icon: House, match: (path: string) => path === "/" },
  { to: "/library", labelKey: "nav.library", icon: Books, match: (path: string) => path.startsWith("/library") || path.startsWith("/search") || path.startsWith("/s/") || path.startsWith("/flows/") },
  { to: "/practice", labelKey: "nav.practice", icon: Cards, match: (path: string) => path.startsWith("/practice") },
  { to: "/profile", labelKey: "nav.profile", icon: UserCircle, match: (path: string) => path === "/profile" || path === "/settings" || path === "/stats" },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label={t("nav.main")}>
      {items.map(({ to, labelKey, icon: Icon, match }) => (
        // `match` rather than NavLink's own `isActive`: /s/:section and the
        // settings screen have to light up their tab too.
        <NavLink key={to} to={to} className={() => (match(pathname) ? "active" : undefined)}>
          <Icon size={22} weight="regular" aria-hidden="true" />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
