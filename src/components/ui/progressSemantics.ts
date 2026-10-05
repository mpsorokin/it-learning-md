/** The `progressbar` attributes for a ratio that is already clamped to 0..1. */
export const progressSemantics = (ratio: number, label: string) =>
  ({
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(ratio * 100),
    "aria-label": label,
  }) as const;
