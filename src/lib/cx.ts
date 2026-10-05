/** Joins class names, dropping the falsy ones a condition leaves behind. */
export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(" ");
