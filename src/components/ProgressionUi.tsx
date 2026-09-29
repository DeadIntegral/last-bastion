import type { EquipmentSlot, UnitDefinition } from '../types/game';
import { formatGameNumber, roundGameNumber } from '../shared/number';

export const equipmentSlots: Array<{ id: EquipmentSlot; name: string; icon: string }> = [
  { id: 'weapon', name: '무기', icon: '⚔' },
  { id: 'armor', name: '갑옷', icon: '◆' },
  { id: 'boots', name: '군화', icon: '↟' },
];

export function equipmentEffect(unit: UnitDefinition, slot: EquipmentSlot): string {
  if (slot === 'weapon') return `공격력 +${formatGameNumber(unit.equipmentGrowth.attack)}`;
  if (slot === 'armor') return `체력 +${formatGameNumber(unit.equipmentGrowth.hp)} · 방어 +${formatGameNumber(unit.equipmentGrowth.defense)}`;
  return `이동 속도 +${formatGameNumber(unit.equipmentGrowth.moveSpeed)}`;
}

export function GrowthStat({ current, base }: { current: number; base: number }) {
  const delta = roundGameNumber(current - base, 1);
  const deltaLabel = delta > 0 ? `+${formatGameNumber(delta, 1)}` : delta < 0 ? formatGameNumber(delta, 1) : '+0';
  return <span className="growth-stat" title={`기본 ${formatGameNumber(base, 1)}`} aria-label={`현재 ${formatGameNumber(current, 1)}, 기본 대비 ${deltaLabel}`}><span>{formatGameNumber(current, 1)}</span><small>{deltaLabel}</small></span>;
}
