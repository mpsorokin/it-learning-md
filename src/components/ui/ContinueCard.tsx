import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/lib/cx";

interface ContinueCardProps {
  to: string;
  /** Already-translated "Start" / "Continue". */
  eyebrow: string;
  title: string;
  /** Where the lesson sits — section and folder, or folder and position. */
  path: ReactNode;
  className?: string;
}

/**
 * The "pick up where you left off" card on the overview and flow screens.
 * Hook-free for the same reason as `ContentRow`.
 */
export function ContinueCard({ to, eyebrow, title, path, className }: ContinueCardProps) {
  return (
    <Link className={cx("continue-card", className)} to={to}>
      <p className="eyebrow">{eyebrow}</p>
      <strong>{title}</strong>
      <span className="continue-card__path">{path}</span>
      <ArrowRight className="continue-card__arrow" size={18} aria-hidden="true" />
    </Link>
  );
}
