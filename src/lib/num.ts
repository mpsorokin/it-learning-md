/** Clamps a 0..1 ratio, so a caller may pass an unnormalised fraction. */
export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
