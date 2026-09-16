import type { AchievementDefinition, PlayerStats } from '../types/game';
import { CODEX_TOTAL } from './codex';

export const achievements: AchievementDefinition[] = [
  { id: 'first_blood', name: '첫 번째 피', description: '적 1명을 처치하세요.', metric: 'kills', target: 1, goldReward: 40, gemReward: 2, icon: '⚔', category: 'combat' },
  { id: 'hunter', name: '전장의 사냥꾼', description: '적 25명을 처치하세요.', metric: 'kills', target: 25, goldReward: 100, gemReward: 5, icon: '➶', category: 'combat' },
  { id: 'reaper', name: '백인대의 종말', description: '적 100명을 처치하세요.', metric: 'kills', target: 100, goldReward: 280, gemReward: 15, icon: '☠', category: 'combat' },
  { id: 'quarter_thousand_fallen', name: '검붉은 전장', description: '적 250명을 처치하세요.', metric: 'kills', target: 250, goldReward: 500, gemReward: 20, icon: '☠', category: 'combat' },
  { id: 'five_hundred_fallen', name: '오백의 그림자', description: '적 500명을 처치하세요.', metric: 'kills', target: 500, goldReward: 750, gemReward: 25, icon: '☠', category: 'combat' },
  { id: 'thousand_bane', name: '천인대의 재앙', description: '적 1,000명을 처치하세요.', metric: 'kills', target: 1000, goldReward: 1500, gemReward: 50, icon: '☠', category: 'combat' },
  { id: 'legion_bane', name: '군단의 종언', description: '적 2,500명을 처치하세요.', metric: 'kills', target: 2500, goldReward: 2500, gemReward: 75, icon: '☠', category: 'combat' },
  { id: 'five_thousand_bane', name: '마왕군의 악몽', description: '적 5,000명을 처치하세요.', metric: 'kills', target: 5000, goldReward: 5000, gemReward: 120, icon: '☠', category: 'combat' },
  { id: 'first_victory', name: '깃발을 세우다', description: '전투에서 처음 승리하세요.', metric: 'victories', target: 1, goldReward: 80, gemReward: 3, icon: '⚑', category: 'campaign' },
  { id: 'conqueror', name: '정복자의 발걸음', description: '전투에서 5번 승리하세요.', metric: 'victories', target: 5, goldReward: 250, gemReward: 12, icon: '♜', category: 'campaign' },
  { id: 'ten_victories', name: '열 개의 승전보', description: '전투에서 10번 승리하세요.', metric: 'victories', target: 10, goldReward: 500, gemReward: 18, icon: '⚑', category: 'campaign' },
  { id: 'kingdom_conqueror', name: '왕국의 정복자', description: '전투에서 25번 승리하세요.', metric: 'victories', target: 25, goldReward: 1000, gemReward: 35, icon: '♜', category: 'campaign' },
  { id: 'fifty_victories', name: '쉰 번의 개선', description: '전투에서 50번 승리하세요.', metric: 'victories', target: 50, goldReward: 1500, gemReward: 50, icon: '♜', category: 'campaign' },
  { id: 'hundred_victories', name: '백전의 정복자', description: '전투에서 100번 승리하세요.', metric: 'victories', target: 100, goldReward: 2500, gemReward: 80, icon: '♜', category: 'campaign' },
  { id: 'eternal_victor', name: '끝없는 개선가', description: '전투에서 250번 승리하세요.', metric: 'victories', target: 250, goldReward: 5000, gemReward: 150, icon: '♜', category: 'campaign' },
  { id: 'giant_slayer', name: '마수 사냥의 시작', description: '마왕군의 마수를 처음 처치하세요.', metric: 'bossWins', target: 1, goldReward: 400, gemReward: 25, icon: '◉', category: 'campaign' },
  { id: 'beast_tracker', name: '마수의 흔적', description: '마수를 3번 처치하세요.', metric: 'bossWins', target: 3, goldReward: 800, gemReward: 35, icon: '◉', category: 'campaign' },
  { id: 'beast_hunter', name: '마수 전문 사냥꾼', description: '마수를 5번 처치하세요.', metric: 'bossWins', target: 5, goldReward: 1200, gemReward: 50, icon: '◉', category: 'campaign' },
  { id: 'beast_legend', name: '마수가 두려워하는 자', description: '마수를 10번 처치하세요.', metric: 'bossWins', target: 10, goldReward: 2500, gemReward: 90, icon: '◉', category: 'campaign' },
  { id: 'unbroken', name: '꺾이지 않는 전열', description: '3연승을 달성하세요.', metric: 'maxWinStreak', target: 3, goldReward: 220, gemReward: 8, icon: '✦', category: 'campaign' },
  { id: 'five_win_streak', name: '승리의 물결', description: '5연승을 달성하세요.', metric: 'maxWinStreak', target: 5, goldReward: 400, gemReward: 15, icon: '✦', category: 'campaign' },
  { id: 'ten_win_streak', name: '멈추지 않는 진군', description: '10연승을 달성하세요.', metric: 'maxWinStreak', target: 10, goldReward: 900, gemReward: 30, icon: '✦', category: 'campaign' },
  { id: 'twenty_win_streak', name: '불패의 군기', description: '20연승을 달성하세요.', metric: 'maxWinStreak', target: 20, goldReward: 2000, gemReward: 70, icon: '✦', category: 'campaign' },
  { id: 'hard_lessons', name: '패배에서 배우다', description: '3번 패배하세요.', metric: 'defeats', target: 3, goldReward: 100, gemReward: 3, icon: '♞', category: 'endurance' },
  { id: 'ten_defeats', name: '쓰러져도 전진', description: '10번 패배하세요.', metric: 'defeats', target: 10, goldReward: 250, gemReward: 8, icon: '♞', category: 'endurance' },
  { id: 'twenty_five_defeats', name: '패배를 새긴 방패', description: '25번 패배하세요.', metric: 'defeats', target: 25, goldReward: 500, gemReward: 15, icon: '♞', category: 'endurance' },
  { id: 'fifty_defeats', name: '결코 꺾이지 않는 자', description: '50번 패배하세요.', metric: 'defeats', target: 50, goldReward: 1000, gemReward: 30, icon: '♞', category: 'endurance' },
  { id: 'sacrifice', name: '피로 지킨 성벽', description: '병사 25명을 잃으세요.', metric: 'unitDeaths', target: 25, goldReward: 140, gemReward: 4, icon: '◆', category: 'endurance' },
  { id: 'hundred_sacrifices', name: '백 개의 이름', description: '병사 100명을 잃으세요.', metric: 'unitDeaths', target: 100, goldReward: 350, gemReward: 12, icon: '◆', category: 'endurance' },
  { id: 'five_hundred_sacrifices', name: '성벽에 새긴 명부', description: '병사 500명을 잃으세요.', metric: 'unitDeaths', target: 500, goldReward: 900, gemReward: 30, icon: '◆', category: 'endurance' },
  { id: 'thousand_sacrifices', name: '천 개의 횃불', description: '병사 1,000명을 잃으세요.', metric: 'unitDeaths', target: 1000, goldReward: 1800, gemReward: 55, icon: '◆', category: 'endurance' },
  { id: 'returning_hero', name: '다시 일어선 영웅', description: '영웅이 쓰러진 뒤 3번 다시 전장에 나서게 하세요.', metric: 'heroDeaths', target: 3, goldReward: 130, gemReward: 5, icon: '♛', category: 'endurance' },
  { id: 'ten_hero_returns', name: '열 번째 귀환', description: '영웅이 쓰러진 뒤 10번 다시 전장에 나서게 하세요.', metric: 'heroDeaths', target: 10, goldReward: 350, gemReward: 12, icon: '♛', category: 'endurance' },
  { id: 'twenty_five_hero_returns', name: '죽음을 거스르는 깃발', description: '영웅이 쓰러진 뒤 25번 다시 전장에 나서게 하세요.', metric: 'heroDeaths', target: 25, goldReward: 750, gemReward: 25, icon: '♛', category: 'endurance' },
  { id: 'fifty_hero_returns', name: '불멸의 귀환', description: '영웅이 쓰러진 뒤 50번 다시 전장에 나서게 하세요.', metric: 'heroDeaths', target: 50, goldReward: 1500, gemReward: 45, icon: '♛', category: 'endurance' },
  { id: 'first_muster', name: '첫 집결', description: '병사를 10번 소환하세요.', metric: 'summons', target: 10, goldReward: 80, gemReward: 3, icon: '♟', category: 'command' },
  { id: 'field_commander', name: '야전 지휘관', description: '병사를 50번 소환하세요.', metric: 'summons', target: 50, goldReward: 180, gemReward: 7, icon: '♟', category: 'command' },
  { id: 'hundred_muster', name: '백부장의 호령', description: '병사를 100번 소환하세요.', metric: 'summons', target: 100, goldReward: 300, gemReward: 10, icon: '♟', category: 'command' },
  { id: 'formation_master', name: '대열을 이루다', description: '병사를 250번 소환하세요.', metric: 'summons', target: 250, goldReward: 500, gemReward: 18, icon: '♟', category: 'command' },
  { id: 'five_hundred_muster', name: '왕국의 대소집', description: '병사를 500번 소환하세요.', metric: 'summons', target: 500, goldReward: 800, gemReward: 28, icon: '♟', category: 'command' },
  { id: 'thousand_command', name: '천군의 호령', description: '병사를 1,000번 소환하세요.', metric: 'summons', target: 1000, goldReward: 1200, gemReward: 40, icon: '♟', category: 'command' },
  { id: 'grand_muster', name: '대륙의 총동원', description: '병사를 2,500번 소환하세요.', metric: 'summons', target: 2500, goldReward: 2500, gemReward: 80, icon: '♟', category: 'command' },
  { id: 'first_heroic_call', name: '전장의 외침', description: '영웅 스킬을 5번 사용하세요.', metric: 'heroSkillUses', target: 5, goldReward: 90, gemReward: 4, icon: '✹', category: 'command' },
  { id: 'heroic_signal', name: '영웅의 신호', description: '영웅 스킬을 15번 사용하세요.', metric: 'heroSkillUses', target: 15, goldReward: 180, gemReward: 8, icon: '✹', category: 'command' },
  { id: 'heroic_banner', name: '영웅의 기치', description: '영웅 스킬을 50번 사용하세요.', metric: 'heroSkillUses', target: 50, goldReward: 400, gemReward: 15, icon: '✹', category: 'command' },
  { id: 'hundred_heroic_calls', name: '백 번 울린 전령', description: '영웅 스킬을 100번 사용하세요.', metric: 'heroSkillUses', target: 100, goldReward: 650, gemReward: 22, icon: '✹', category: 'command' },
  { id: 'legendary_call', name: '전설의 부름', description: '영웅 스킬을 200번 사용하세요.', metric: 'heroSkillUses', target: 200, goldReward: 900, gemReward: 30, icon: '✹', category: 'command' },
  { id: 'eternal_heroic_call', name: '영웅들의 합창', description: '영웅 스킬을 500번 사용하세요.', metric: 'heroSkillUses', target: 500, goldReward: 2000, gemReward: 65, icon: '✹', category: 'command' },
  { id: 'first_bombardment', name: '첫 포성', description: '성채 포격을 처음 사용하세요.', metric: 'castleSkillUses', target: 1, goldReward: 60, gemReward: 2, icon: '♜', category: 'command' },
  { id: 'royal_artillery', name: '왕실 포병대', description: '성채 포격을 10번 사용하세요.', metric: 'castleSkillUses', target: 10, goldReward: 160, gemReward: 7, icon: '♜', category: 'command' },
  { id: 'barrage_master', name: '포화의 지배자', description: '성채 포격을 50번 사용하세요.', metric: 'castleSkillUses', target: 50, goldReward: 400, gemReward: 15, icon: '♜', category: 'command' },
  { id: 'hundred_bombardments', name: '백 번의 포성', description: '성채 포격을 100번 사용하세요.', metric: 'castleSkillUses', target: 100, goldReward: 650, gemReward: 22, icon: '♜', category: 'command' },
  { id: 'thunder_fortress', name: '천둥의 성채', description: '성채 포격을 200번 사용하세요.', metric: 'castleSkillUses', target: 200, goldReward: 900, gemReward: 30, icon: '♜', category: 'command' },
  { id: 'eternal_bombardment', name: '대륙을 울리는 포성', description: '성채 포격을 500번 사용하세요.', metric: 'castleSkillUses', target: 500, goldReward: 2000, gemReward: 65, icon: '♜', category: 'command' },
  { id: 'first_battle', name: '첫 원정', description: '전투에 처음 참여하세요.', metric: 'battles', target: 1, goldReward: 50, gemReward: 2, icon: '☗', category: 'endurance' },
  { id: 'veteran', name: '오래된 군기', description: '전투에 10번 참여하세요.', metric: 'battles', target: 10, goldReward: 220, gemReward: 10, icon: '☗', category: 'endurance' },
  { id: 'seasoned_banner', name: '전장의 숙련자', description: '전투에 25번 참여하세요.', metric: 'battles', target: 25, goldReward: 500, gemReward: 18, icon: '☗', category: 'endurance' },
  { id: 'undying_banner', name: '불멸의 군기', description: '전투에 50번 참여하세요.', metric: 'battles', target: 50, goldReward: 900, gemReward: 30, icon: '☗', category: 'endurance' },
  { id: 'hundred_battles', name: '백전의 군기', description: '전투에 100번 참여하세요.', metric: 'battles', target: 100, goldReward: 1800, gemReward: 55, icon: '☗', category: 'endurance' },
  { id: 'two_fifty_battles', name: '시대를 건넌 군기', description: '전투에 250번 참여하세요.', metric: 'battles', target: 250, goldReward: 4000, gemReward: 110, icon: '☗', category: 'endurance' },
  { id: 'first_archive', name: '연대기의 첫 장', description: '전쟁 사전에 10종을 기록하세요.', metric: 'codexEntries', target: 10, goldReward: 100, gemReward: 6, icon: '▤', category: 'command' },
  { id: 'half_archive', name: '왕국의 기록관', description: '전쟁 사전을 50% 이상 완성하세요.', metric: 'codexEntries', target: Math.ceil(CODEX_TOTAL / 2), goldReward: 180, gemReward: 12, icon: '▤', category: 'command' },
  { id: 'three_quarter_archive', name: '대륙의 박물지', description: '전쟁 사전을 75% 이상 완성하세요.', metric: 'codexEntries', target: Math.ceil(CODEX_TOTAL * 0.75), goldReward: 350, gemReward: 24, icon: '▤', category: 'command' },
  { id: 'complete_archive', name: '살아 있는 연대기', description: '전쟁 사전을 모두 완성하세요.', metric: 'codexEntries', target: CODEX_TOTAL, goldReward: 600, gemReward: 40, icon: '▣', category: 'command' },
];

export const achievementById = Object.fromEntries(achievements.map((achievement) => [achievement.id, achievement])) as Record<string, AchievementDefinition>;

export interface AchievementGroup {
  metric: AchievementDefinition['metric'];
  label: string;
  achievements: AchievementDefinition[];
}

const achievementMetricLabels: Partial<Record<AchievementDefinition['metric'], string>> = {
  kills: '적 처치',
  victories: '전투 승리',
  bossWins: '마수 격파',
  maxWinStreak: '연승',
  defeats: '전투 패배',
  unitDeaths: '병사 희생',
  heroDeaths: '영웅 부활',
  summons: '병력 소환',
  heroSkillUses: '영웅 스킬',
  castleSkillUses: '성채 포격',
  battles: '전투 참전',
  codexEntries: '사전 완성',
};

export const achievementGroups: AchievementGroup[] = [...new Set(achievements.map((achievement) => achievement.metric))].map((metric) => ({
  metric,
  label: achievementMetricLabels[metric] ?? metric,
  achievements: achievements.filter((achievement) => achievement.metric === metric).sort((left, right) => left.target - right.target),
}));

export function featuredAchievement(group: AchievementGroup, unlockedIds: string[], claimedIds: string[]): AchievementDefinition {
  return group.achievements.find((achievement) => unlockedIds.includes(achievement.id) && !claimedIds.includes(achievement.id))
    ?? group.achievements.find((achievement) => !unlockedIds.includes(achievement.id))
    ?? group.achievements[group.achievements.length - 1];
}

export function achievementProgress(achievement: AchievementDefinition, stats: PlayerStats): number {
  return stats[achievement.metric];
}

export function unlockedAchievements(stats: PlayerStats): string[] {
  return achievements.filter((achievement) => achievementProgress(achievement, stats) >= achievement.target).map((achievement) => achievement.id);
}
