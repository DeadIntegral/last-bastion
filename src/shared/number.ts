export function roundGameNumber(value: number, maximumFractionDigits = 2): number {
  if (!Number.isFinite(value)) return 0;
  const digits = Math.max(0, Math.min(6, Math.floor(maximumFractionDigits)));
  const factor = 10 ** digits;
  const rounded = Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) || Math.abs(rounded) < 1 / factor / 2 ? 0 : rounded;
}

export function formatGameNumber(value: number, maximumFractionDigits = 2): string {
  return roundGameNumber(value, maximumFractionDigits).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, Math.min(6, Math.floor(maximumFractionDigits))),
  });
}
