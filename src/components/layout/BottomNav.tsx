import { Books } from "@phosphor-icons/react/dist/csr/Books";
import { Cards } from "@phosphor-icons/react/dist/csr/Cards";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { UserCircle } from "@phosphor-icons/react/dist/csr/UserCircle";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

const LIBRARY_PREFIXES = ["/library", "/search", "/s/", "/flows/"];
const PROFILE_PATHS = ["/profile", "/settings", "/stats"];

const isOverview = (path: string) => path === "/";
const isLibrary = (path: string) => LIBRARY_PREFIXES.some((prefix) => path.startsWith(prefix));
const isPractice = (path: string) => path.startsWith("/practice");
const isProfile = (path: string) => PROFILE_PATHS.includes(path);

const items = [
  { to: "/", labelKey: "nav.overview", icon: House, match: isOverview },
  { to: "/library", labelKey: "nav.library", icon: Books, match: isLibrary },
  { to: "/practice", labelKey: "nav.practice", icon: Cards, match: isPractice },
  { to: "/profile", labelKey: "nav.profile", icon: UserCircle, match: isProfile },
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
