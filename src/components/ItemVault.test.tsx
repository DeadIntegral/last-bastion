import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ItemVault } from './ItemVault';
import { ItemCodex } from './ItemCodex';
import { itemDefinitions, itemOrder } from '../data/items';
import { useGameStore } from '../store/useGameStore';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useGameStore.getState().resetProgress();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.clearAllTimers(); vi.useRealTimers(); });

it('keeps unknown inventory and unavailable recipes out of the vault', () => {
  act(() => root.render(<ItemVault header={null} />));
  expect(host.querySelectorAll('.item-inventory-card')).toHaveLength(0);
  expect(host.querySelector('.item-crafting-section')).toBeNull();
  expect(host.textContent).toContain('보유한 아이템이 없습니다.');
  expect(host.textContent).not.toContain('획득 전에는');
  act(() => useGameStore.setState({ itemInventory: { 'veteran-standard': 1, 'runed-whetstone': 1 } }));
  expect(host.querySelectorAll('.item-inventory-card')).toHaveLength(2);
  expect(host.textContent).not.toContain(itemDefinitions['war-standard'].name);
  act(() => useGameStore.setState({ clearedStages: [12], formationItemSlots: ['veteran-standard', null, null, null] }));
  expect(host.querySelector('.item-crafting-section')).toBeNull();
  act(() => useGameStore.setState({ itemInventory: { 'veteran-standard': 2, 'runed-whetstone': 1 } }));
  expect(host.querySelectorAll('.item-recipe-card')).toHaveLength(1);
  expect(host.textContent).not.toContain(itemDefinitions['royal-siege-core'].name);
  act(() => useGameStore.setState({ itemInventory: { 'veteran-standard': 2, 'runed-whetstone': 1, 'war-standard': 99 } }));
  expect(host.querySelector('.item-crafting-section')).toBeNull();
});

it('refreshes inventory, craftable recipes and selection after consuming the selected material', () => {
  useGameStore.setState({ clearedStages: [12], itemInventory: { 'veteran-standard': 1, 'runed-whetstone': 1 } });
  act(() => root.render(<ItemVault header={null} />));
  act(() => host.querySelector<HTMLButtonElement>('.item-recipe-card button')!.click());
  expect(host.querySelector('.item-crafting-section')).toBeNull();
  expect(host.querySelectorAll('.item-inventory-card')).toHaveLength(1);
  expect(host.querySelector('.item-inventory-card')?.textContent).toContain(itemDefinitions['war-standard'].name);
  act(() => host.querySelector<HTMLButtonElement>('.item-formation-sockets .item-socket button')!.click());
  expect(useGameStore.getState().formationItemSlots[0]).toBe('war-standard');
});

it('provides the complete optional item reference separately from combatant discovery', () => {
  const before = useGameStore.getState().stats.codexEntries;
  act(() => root.render(<ItemCodex />));
  expect(host.querySelectorAll('.item-reference')).toHaveLength(itemOrder.length);
  expect(host.querySelectorAll('.item-reference[open]')).toHaveLength(0);
  expect(host.textContent).toContain(itemDefinitions['royal-siege-core'].name);
  expect(host.textContent).toContain('30장 클리어 필요');
  expect(useGameStore.getState().stats.codexEntries).toBe(before);
});
