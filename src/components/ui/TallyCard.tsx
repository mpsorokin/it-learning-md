import { ProgressBar } from "@/components/ui/ProgressBar";

interface TallyProps {
  label: string;
  /** Already-translated "n / m done". */
  value: string;
}

/** The label/value line of a progress card, without the card around it. */
export function TallyRow({ label, value }: TallyProps) {
  return (
    <div className="stat-card__row">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
    </div>
  );
}

/**
 * The standalone progress card at the top of the overview, section and folder
 * screens. The profile lists the same line inside its own `<li>`, so it uses
 * `TallyRow` directly rather than nesting a second card.
 */
export function TallyCard({ label, value, ratio }: TallyProps & { ratio: number }) {
  return (
    <section className="stat-card">
      <TallyRow label={label} value={value} />
      <ProgressBar value={ratio} />
    </section>
  );
}
