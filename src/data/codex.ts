import type { CodexEntry, CodexEnemyId, HeroId, UnitId } from '../types/game';
import { allTroopOrder, troopDefinitions } from './units';

const authoredTroopCodex: Partial<Record<UnitId, CodexEntry>> = {
  militia: { id: 'militia', kind: 'unit', title: '푸른 깃발 민병대', role: '3인 저비용 근접 분대', description: '한 번에 셋이 집결해 전선을 넓게 만들지만 개별 병사는 약합니다.', lore: '왕국의 부름에 농기구를 내려놓고 모인 변경의 주민들입니다.' },
  guardian: { id: 'guardian', kind: 'unit', title: '왕실 방패병', role: '2인 중갑 방어 분대', description: '둘이 함께 배치되어 높은 체력과 방어 장비로 후방 병사를 보호합니다.', lore: '무너진 수도의 마지막 방패를 나누어 든 왕실 근위대입니다.' },
  archer: { id: 'archer', kind: 'unit', title: '녹림 궁수단', role: '장거리 2인 집중사격', description: '석궁병보다 훨씬 먼 거리에서 둘이 한 대상을 집중 사격하지만 개별 체력이 낮아 근접전에 취약합니다.', lore: '서부 숲의 길을 지키던 파수꾼들이 원정대에 합류했습니다.' },
  lancer: { id: 'lancer', kind: 'unit', title: '황금 창병대', role: '2명 관통 대형 대응병', description: '한 번의 찌르기로 최대 2명을 관통하며 대형 적과 보스에게 75% 추가 피해를 줍니다.', lore: '거인의 갑주 틈을 찌르는 기술을 세대에 걸쳐 전승했습니다.' },
  raider: { id: 'raider', kind: 'unit', title: '고블린 약탈병', role: '3인 고속 근접 분대', description: '한 번에 셋이 배치되어 빠르게 빈틈을 파고들지만 개별 전투력은 낮습니다.', lore: '마왕군의 식량 약속에 이끌려 국경 마을을 습격하기 시작한 고블린 무리입니다.' },
  bulwark: { id: 'bulwark', kind: 'unit', title: '오크 철갑병', role: '근접 범위 중갑병', description: '느리고 단단하며 무거운 공격으로 사거리 안의 전열 전체를 휩씁니다.', lore: '쇠사슬 부족의 대장장이들이 성문을 뜯어 갑옷으로 두른 전사입니다.' },
  cavalry: { id: 'cavalry', kind: 'unit', title: '왕립 기마병', role: '2명 관통 돌격병', description: '빠르게 전열을 가르고 첫 공격에 60% 추가 피해를 주며 최대 2명을 관통합니다.', lore: '왕립 마구간의 마지막 군마들은 성채가 다시 일어서기만을 기다렸습니다.' },
  crossbow: { id: 'crossbow', kind: 'unit', title: '붉은 석궁병', role: '중거리 2명 관통 중사수', description: '궁수보다 짧은 거리에서 느리게 사격하지만 높은 위력의 볼트가 일렬로 선 적을 최대 2명까지 관통합니다.', lore: '한때 왕국의 병기창을 지키던 사수들이 적의 깃발을 들었습니다.' },
  brute: { id: 'brute', kind: 'unit', title: '오우거 파쇄자', role: '근접 범위 돌격병', description: '높은 체력으로 버티며 한 번의 휘두르기로 사거리 안의 전열 전체를 공격합니다.', lore: '마왕군의 쇠사슬에서 풀려난 뒤에도 전장을 떠나지 못한 오우거입니다.' },
  griffin: { id: 'griffin', kind: 'unit', title: '그리폰 기수', role: '최상위 공중 강습병', description: '높은 체력과 방어력으로 원거리 화망을 견디며 강력한 착지 공격으로 전열 전체를 덮칩니다.', lore: '구름 봉우리의 알을 지켜낸 기수에게만 하늘의 맹수가 등을 허락합니다.' },
  spirit: { id: 'spirit', kind: 'unit', title: '폭풍 정령', role: '공중 관통 마법병', description: '원거리 병종만 맞설 수 있으며 번개가 일렬로 선 두 대상을 관통합니다.', lore: '마왕군이 폭풍의 눈을 봉인해 병기로 삼았지만 계약이 끊기면 스스로 주인을 선택합니다.' },
  hellhound: { id: 'hellhound', kind: 'unit', title: '심연의 마염견', role: '고속 근접 악마수', description: '빠른 돌진과 화염을 두른 범위 공격으로 후열을 흔듭니다.', lore: '마계 균열에서 태어난 사냥개입니다. 힘을 인정한 지휘관의 명령만 따릅니다.' },
};

const generatedRole = (id: UnitId): string => {
  const unit = troopDefinitions[id];
  const domain = unit.tags.includes('flying') ? '공중' : unit.tags.includes('mounted') ? '기동' : '지상';
  const attack = unit.tags.includes('ranged') ? '원거리' : unit.attackPattern.kind === 'cleave' ? '범위 근접' : unit.attackPattern.kind === 'pierce' ? '관통' : '근접';
  return `${domain} ${attack} 병종`;
};

const generatedLore = (id: UnitId): string => {
  if (['swordsman', 'pikeman', 'scout', 'priest', 'mage', 'archmage', 'assassin'].includes(id)) return '점령지에서 살아남았거나 적의 깃발을 버린 인간 전투원입니다.';
  if (id.startsWith('goblin') || id === 'wolfRider') return '마왕군의 약속을 믿고 전쟁에 뛰어든 고블린 부족에서 시작되었습니다.';
  if (id.startsWith('orc')) return '쇠사슬 부족의 전통과 마왕군의 병기가 결합된 오크 전사입니다.';
  if (id.toLowerCase().includes('spirit')) return '마왕군의 봉인에서 풀려난 뒤 원정대와 새로운 계약을 맺은 정령입니다.';
  if (['imp', 'succubus', 'demonGuard', 'demonMage', 'gargoyle', 'cerberus', 'ifrit', 'reaper', 'abyssKnight'].includes(id)) return '마계 균열을 넘어온 존재로, 패배한 뒤에도 강한 지휘관의 힘에는 복종합니다.';
  return '마왕군이 전쟁에 끌어들인 마물이며, 굴복시키면 같은 기본 능력으로 아군에 합류할 수 있습니다.';
};

export const troopCodex = Object.fromEntries(allTroopOrder.map((id) => {
  const unit = troopDefinitions[id];
  return [id, authoredTroopCodex[id] ?? {
    id,
    kind: 'unit',
    title: unit.name,
    role: generatedRole(id),
    description: `${unit.squadSize > 1 ? `${unit.squadSize}명이 함께 출전하며` : '한 개체가 출전하며'} ${unit.attackRange} 사거리에서 ${unit.attackDamage}의 기본 공격력을 발휘합니다.`,
    lore: generatedLore(id),
  }];
})) as Record<UnitId, CodexEntry>;

export const heroCodex: Record<HeroId, CodexEntry> = {
  warden: { id: 'warden', kind: 'hero', title: '에드릭 · 철벽의 기사', role: '전열 지원 영웅', description: '주변 아군의 피해를 줄이고 보호막을 부여합니다.', lore: '모두가 퇴각한 날에도 혼자 성문을 닫지 않았던 왕실 기사입니다.' },
  pyromancer: { id: 'pyromancer', kind: 'hero', title: '셀레네 · 잿불 마녀', role: '광역 마법 영웅', description: '공격이 번지고 적진에 거대한 유성을 떨어뜨립니다.', lore: '불탄 마도원에서 살아남아 재가 된 지식을 불꽃으로 되살렸습니다.' },
  huntress: { id: 'huntress', kind: 'hero', title: '리아 · 마수 사냥꾼', role: '보스 특화 영웅', description: '대형 적의 약점을 노리고 전장 전체에 화살비를 내립니다.', lore: '잿빛 산맥에서 돌아온 유일한 사냥꾼이며 마수의 심장 박동을 기억합니다.' },
  saint: { id: 'saint', kind: 'hero', title: '미레나 · 새벽의 성녀', role: '치유 지원 영웅', description: '부상자를 우선 치유하고 기도로 아군과 성채를 함께 회복합니다.', lore: '함락된 성당의 마지막 등불을 들고 피난민을 최후의 성채까지 이끌었습니다.' },
  marshal: { id: 'marshal', kind: 'hero', title: '브란 · 해방군 기수', role: '기동 지휘 영웅', description: '돌격으로 전열을 열고 각성 오라로 주변 병사의 진군을 가속합니다.', lore: '빼앗긴 도시마다 왕국의 깃발을 다시 세우겠다고 맹세한 야전 지휘관입니다.' },
};

export const bossCodex: Record<'boss', CodexEntry> = {
  boss: { id: 'boss', kind: 'enemy', title: '마왕군의 봉인 마수', role: '공성 마수', description: '첫 공격에 각성하고 체력 절반에서 흉폭해집니다.', lore: '마왕군은 정복한 땅의 생명과 원소를 뒤틀어 성채 앞을 지키는 거대한 마수로 만들었습니다.' },
};

export const CODEX_TOTAL = Object.keys(troopCodex).length + Object.keys(heroCodex).length + Object.keys(bossCodex).length;

export function codexEntryCount(unlockedUnits: UnitId[], unlockedHeroes: HeroId[], encountered: CodexEnemyId[]): number {
  const visibleTroops = new Set<UnitId>(unlockedUnits);
  for (const id of encountered) if (id !== 'boss') visibleTroops.add(id);
  return visibleTroops.size + unlockedHeroes.length + (encountered.includes('boss') ? 1 : 0);
}
