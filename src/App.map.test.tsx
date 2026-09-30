import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignMap } from './components/CampaignMap';
import { monumentBuildings } from './data/endgame';
import { mapLocationArt } from './data/campaignMapArt';
import { useGameStore } from './store/useGameStore';

const pointerEvent = (type: string, clientX: number, pointerId = 1, clientY = 0): MouseEvent => {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
};

describe('campaign map pointer controls', () => {
  let host: HTMLDivElement;
  let root: Root;
  const setPointerCapture = vi.fn();
  const releasePointerCapture = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
    useGameStore.setState({ unlockedStage: 7, clearedStages: [1, 2, 3, 4, 5, 6] });
    Object.defineProperties(HTMLElement.prototype, {
      scrollTo: { configurable: true, value: vi.fn() },
      setPointerCapture: { configurable: true, value: setPointerCapture },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
      hasPointerCapture: { configurable: true, value: () => true },
    });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<CampaignMap header={null} operations={null} onSelect={vi.fn()} onMonuments={vi.fn()} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    setPointerCapture.mockReset();
    releasePointerCapture.mockReset();
  });

  it('keeps a cleared western stage clickable after the eastern map unlocks', () => {
    const map = host.querySelector<HTMLElement>('.campaign-map')!;
    const stageOne = host.querySelector<HTMLButtonElement>('[aria-label^="1장"]')!;

    act(() => stageOne.dispatchEvent(pointerEvent('pointerdown', 100)));
    expect(setPointerCapture).not.toHaveBeenCalled();

    act(() => stageOne.dispatchEvent(pointerEvent('pointerup', 100)));
    act(() => stageOne.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(map).toBeDefined();
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('국경의 불씨');
    expect(host.querySelector('.difficulty')?.textContent).toContain('전투 평가 낮음');
    expect(host.querySelector('.difficulty')?.textContent).not.toContain('1/30');
    expect(host.querySelectorAll('.map-region-zone.liberated')).toHaveLength(1);
    expect(host.querySelectorAll('.map-region-zone.frontline')).toHaveLength(1);
    expect(host.querySelectorAll('.liberation-flag')).toHaveLength(6);
    expect(host.querySelectorAll('.road-segment.liberated')).toHaveLength(6);
    expect(host.querySelector('.map-heading')?.textContent).toContain('해방 1/5');
    expect(stageOne.getAttribute('aria-label')).toContain('해방 완료');
    expect(host.querySelectorAll('.continent-painting')).toHaveLength(1);
    expect(host.querySelectorAll('.fortress-beacon img')).toHaveLength(12);
    expect(host.querySelectorAll('.challenge-portrait')).toHaveLength(1);
    expect(host.querySelector('.challenge-portrait')?.getAttribute('data-boss-id')).toBe('brute');
    expect(host.querySelector('.challenge-portrait .character-sprite')?.getAttribute('style')).toContain('roster-atlas.png');
    expect(host.querySelector('.challenge-map-node .node-beacon')).toBeNull();
    const regionButtons = [...host.querySelectorAll<HTMLButtonElement>('.map-region-nav button')];
    expect(regionButtons.map((button) => button.textContent)).toEqual(['01서부 변경해방 완료', '02점령 왕도교전 중']);
    act(() => regionButtons[1].click());
    expect(map.scrollTo).toHaveBeenCalledWith({ left: 620, top: 470, behavior: 'smooth' });
    expect(host.querySelector('.campaign-map-world')?.getAttribute('style')).toContain('height: 1700px');
    expect(host.querySelector<HTMLImageElement>('.fortress-beacon img')?.src).toContain('/assets/campaign-map/markers/liberated-keep.png');
    expect(host.querySelectorAll('.map-landmark').length).toBeGreaterThan(0);

    expect(host.querySelector('.map-treasure-node')).toBeNull();
    const guardian = host.querySelector<HTMLButtonElement>('.treasure-guardian-node')!;
    expect(guardian.textContent).toContain('봉화대 매복전');
    act(() => guardian.click());
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('봉화대 매복전');
    expect(host.querySelector('.treasure-gimmick-preview')?.textContent).toContain('교차 사격 매복');
    expect(useGameStore.getState().gold).toBe(100);
    expect(useGameStore.getState().claimedMapTreasureIds).toEqual([]);
    act(() => { useGameStore.getState().completeTreasureMission(201); });
    const treasure = host.querySelector<HTMLButtonElement>('.map-treasure-node')!;
    expect(treasure.textContent).toContain('변경 수복 궤짝');
    expect(treasure.querySelector('img')?.getAttribute('src')).toBe(mapLocationArt.treasureClosed);
    act(() => treasure.click());
    expect(useGameStore.getState().gold).toBe(700);
    expect(treasure.querySelector('img')?.getAttribute('src')).toBe(mapLocationArt.treasureOpen);
  });

  it('uses the supplied last battle as its initial selection instead of the furthest unlocked stage', () => {
    act(() => root.render(<CampaignMap key="last-battle" initialStageId={3} header={null} operations={null} onSelect={vi.fn()} onMonuments={vi.fn()} />));

    expect(host.querySelector('.map-mission h2')?.textContent).toBe('붉은 화살비');
    expect(host.querySelector<HTMLButtonElement>('[aria-label^="3장"]')?.classList.contains('selected')).toBe(true);
    expect(host.querySelector<HTMLElement>('.campaign-map')?.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });

  it('captures the pointer only after horizontal movement becomes a drag', () => {
    const map = host.querySelector<HTMLElement>('.campaign-map')!;
    act(() => map.dispatchEvent(pointerEvent('pointerdown', 100, 2)));
    act(() => map.dispatchEvent(pointerEvent('pointermove', 96, 2)));
    expect(setPointerCapture).not.toHaveBeenCalled();

    act(() => map.dispatchEvent(pointerEvent('pointermove', 80, 2)));
    expect(setPointerCapture).toHaveBeenCalledWith(2);
  });

  it('pans the map vertically as well as horizontally for mouse and pen drags', () => {
    const map = host.querySelector<HTMLElement>('.campaign-map')!;
    act(() => map.dispatchEvent(pointerEvent('pointerdown', 100, 3, 100)));
    act(() => map.dispatchEvent(pointerEvent('pointermove', 80, 3, 60)));
    expect(map.scrollLeft).toBe(20);
    expect(map.scrollTop).toBe(40);
  });

  it('reveals repeatable farming nodes at their campaign milestones', () => {
    act(() => useGameStore.setState({ unlockedStage: 13, clearedStages: Array.from({ length: 12 }, (_, index) => index + 1) }));
    const goldFarm = host.querySelector<HTMLButtonElement>('.farming-map-node.farming-gold')!;
    expect(goldFarm).toBeTruthy();
    expect(goldFarm.querySelector('img')?.getAttribute('src')).toBe(mapLocationArt.supplyCaravan);
    expect(host.querySelector('.farming-map-node.farming-mastery')).toBeNull();
    act(() => goldFarm.click());
    expect(host.querySelector('.map-mission.farming-gold')?.textContent).toContain('기본 2,000골드');
    expect(host.querySelector('.map-mission.farming-gold')?.textContent).toContain('파밍 출정');
  });

  it('extends the same map into Chapter 2 only after discovery and retains Chapter 1 selection', () => {
    expect(host.querySelector('.veil-campaign-node')).toBeNull();
    act(() => useGameStore.setState({ unlockedStage: 30, clearedStages: Array.from({ length: 30 }, (_, i) => i + 1), builtMonumentIds: monumentBuildings.map((building) => building.id) }));
    expect(host.querySelectorAll('.campaign-map')).toHaveLength(1);
    expect(host.querySelectorAll('.veil-campaign-node')).toHaveLength(6);
    expect(host.querySelectorAll('.challenge-portrait')).toHaveLength(7);
    expect(host.querySelector('.challenge-portrait[data-boss-id="dragon"] .character-sprite')?.getAttribute('style')).toContain('transcendent-atlas.png');
    expect(host.querySelector('.campaign-map-world')?.getAttribute('style')).toContain('width: 2800px');
    const nodes = host.querySelectorAll<HTMLButtonElement>('.veil-campaign-node');
    act(() => nodes[1].click());
    expect(host.querySelector('.veil-mission-detail h2')?.textContent).toBe('미확인 전장');
    expect(host.querySelector<HTMLButtonElement>('.veil-mission-detail button')?.disabled).toBe(true);
    act(() => nodes[0].click());
    expect(host.querySelector('.veil-mission-detail h2')?.textContent).toBe('장막의 문턱');
    expect(host.querySelector<HTMLButtonElement>('.veil-mission-detail button')?.disabled).toBe(false);
    act(() => host.querySelector<HTMLButtonElement>('[aria-label^="1장"]')!.click());
    expect(host.querySelector('.map-mission h2')?.textContent).toBe('국경의 불씨');
    act(() => root.render(<CampaignMap key="chapter-two-return" initialStageId={401} header={null} operations={null} onSelect={vi.fn()} onMonuments={vi.fn()} />));
    expect(host.querySelector('.veil-mission-detail h2')?.textContent).toBe('장막의 문턱');
  });
});
