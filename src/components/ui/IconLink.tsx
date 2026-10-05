import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface IconLinkProps {
  to: string;
  /** Accessible name — the icon inside is decorative. */
  label: string;
  children: ReactNode;
}

/** A round header link that shows only an icon: back, settings, search. */
export function IconLink({ to, label, children }: IconLinkProps) {
  return (
    <Link className="icon-button" to={to} aria-label={label}>
      {children}
    </Link>
  );
}
