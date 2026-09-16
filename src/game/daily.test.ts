import { describe, expect, it } from 'vitest';
import { canClaimDailyReward, localDateKey } from './daily';

describe('daily reward', () => {
  it('uses the browser-local calendar date as a stable key', () => {
    expect(localDateKey(new Date(2026, 8, 12, 23, 59))).toBe('2026-09-12');
  });

  it('allows exactly one claim for each date key', () => {
    expect(canClaimDailyReward(null, '2026-09-12')).toBe(true);
    expect(canClaimDailyReward('2026-09-12', '2026-09-12')).toBe(false);
    expect(canClaimDailyReward('2026-09-12', '2026-09-13')).toBe(true);
  });
});
