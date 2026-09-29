import { describe, expect, it } from 'vitest';
import { formatGameNumber, roundGameNumber } from './number';

describe('game number formatting', () => {
  it('removes floating-point noise and negative zero', () => {
    expect(roundGameNumber(0.00000000004)).toBe(0);
    expect(roundGameNumber(-0.00000000004)).toBe(0);
    expect(roundGameNumber(4.50000000004, 1)).toBe(4.5);
    expect(Object.is(roundGameNumber(-0), -0)).toBe(false);
  });

  it('keeps meaningful decimals while dropping redundant zeroes', () => {
    expect(formatGameNumber(1_234.50000000004, 1)).toBe((1_234.5).toLocaleString());
    expect(formatGameNumber(12, 2)).toBe('12');
  });
});
