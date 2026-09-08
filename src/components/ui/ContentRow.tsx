import { CaretRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ContentRowProps {
  to: string;
  title: string;
  /** Already-translated "n / m done"; the caller owns the phrasing. */
  count: string;
  ratio: number;
  /** Already-translated secondary line — folder count, lesson count. */
  meta: string;
}

/**
 * One row of the catalogue: a section on the overview and library screens, a
 * folder on the section screen. Hook-free for the same reason as `ProgressBar` —
 * the caller has a `t` in hand anyway, and every row would otherwise subscribe
 * to language changes on its own.
 */
export function ContentRow({ to, title, count, ratio, meta }: ContentRowProps) {
  return (
    <Link className="content-row" to={to}>
      <div className="content-row__head">
        <strong>{title}</strong>
        <span className="content-row__count">{count}</span>
      </div>
      <ProgressBar value={ratio} />
      <span className="content-row__meta">{meta}</span>
      <CaretRight className="content-row__caret" size={15} aria-hidden="true" />
    </Link>
  );
}
