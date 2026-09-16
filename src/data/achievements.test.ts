import { describe, expect, it } from 'vitest';
import { achievementGroups, achievements, featuredAchievement, unlockedAchievements } from './achievements';
import type { PlayerStats } from '../types/game';
import { CODEX_TOTAL } from './codex';

const emptyStats = (): PlayerStats => ({
  battles: 0, victories: 0, defeats: 0, kills: 0, unitDeaths: 0, heroDeaths: 0,
  summons: 0, heroSkillUses: 0, castleSkillUses: 0, bossWins: 0,
  currentWinStreak: 0, maxWinStreak: 0, codexEntries: 0,
});

describe('achievements', () => {
  it('keeps identifiers unique', () => {
    expect(new Set(achievements.map((achievement) => achievement.id)).size).toBe(achievements.length);
    expect(achievements).toHaveLength(64);
  });

  it('groups milestone chains by their tracked statistic and prioritizes claimable steps', () => {
    const killGroup = achievementGroups.find((group) => group.metric === 'kills')!;
    expect(killGroup.label).toBe('적 처치');
    expect(killGroup.achievements.map((achievement) => achievement.target)).toEqual([1, 25, 100, 250, 500, 1000, 2500, 5000]);
    expect(featuredAchievement(killGroup, ['first_blood', 'hunter'], ['first_blood']).id).toBe('hunter');
    expect(featuredAchievement(killGroup, ['first_blood', 'hunter'], ['first_blood', 'hunter']).id).toBe('reaper');
  });

  it('defines both gold and non-purchasable gem rewards', () => {
    for (const achievement of achievements) {
      expect(achievement.goldReward).toBeGreaterThan(0);
      expect(achievement.gemReward).toBeGreaterThan(0);
    }
  });

  it('unlocks all kill milestones from cumulative kills', () => {
    const stats = emptyStats();
    stats.kills = 499;
    expect(unlockedAchievements(stats)).toEqual(expect.arrayContaining(['first_blood', 'hunter', 'reaper']));
    expect(unlockedAchievements(stats)).not.toContain('five_hundred_fallen');

    stats.kills = 5000;
    expect(unlockedAchievements(stats)).toEqual(expect.arrayContaining([
      'first_blood', 'hunter', 'reaper', 'quarter_thousand_fallen', 'five_hundred_fallen', 'thousand_bane', 'legion_bane', 'five_thousand_bane',
    ]));
  });

  it('adds progressive long-term milestones for recurring actions', () => {
    const stats = emptyStats();
    stats.victories = 250;
    stats.battles = 250;
    stats.summons = 2500;
    stats.heroSkillUses = 500;
    stats.castleSkillUses = 500;

    expect(unlockedAchievements(stats)).toEqual(expect.arrayContaining([
      'eternal_victor', 'two_fifty_battles', 'grand_muster', 'eternal_heroic_call', 'eternal_bombardment',
    ]));
  });

  it('does not unlock achievements before their threshold', () => {
    expect(unlockedAchievements(emptyStats())).toHaveLength(0);
  });

  it('unlocks codex achievements at 50% and 100% completion', () => {
    const halfComplete = emptyStats();
    halfComplete.codexEntries = Math.ceil(CODEX_TOTAL / 2);
    expect(unlockedAchievements(halfComplete)).toContain('half_archive');
    expect(unlockedAchievements(halfComplete)).not.toContain('complete_archive');

    halfComplete.codexEntries = CODEX_TOTAL;
    expect(unlockedAchievements(halfComplete)).toEqual(expect.arrayContaining(['half_archive', 'complete_archive']));
  });
});
