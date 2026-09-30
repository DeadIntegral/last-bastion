import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tutorialEligible, tutorialIds, tutorials, type TutorialId } from '../data/tutorials';
import { BattleEvent, battleEvents } from '../game/EventBus';
import { useGameStore } from '../store/useGameStore';
import { GuidedTour } from './GuidedTour';

export function BattleTutorial({ ready, paused, replayRequest, enabled, onActiveChange }: { ready: boolean; paused: boolean; replayRequest: number; enabled: boolean; onActiveChange: (active: boolean) => void }) {
  const profile = useGameStore();
  const [active, setActive] = useState<TutorialId[] | null>(null);
  const shown = useRef(false);
  const lastReplay = useRef(0);
  const ownsPause = useRef(false);
  useLayoutEffect(() => { onActiveChange(active !== null); }, [active, onActiveChange]);

  useEffect(() => {
    if (!ready || !enabled || active) return;
    const manual = replayRequest !== lastReplay.current;
    lastReplay.current = replayRequest;
    if (!manual && (shown.current || paused)) return;
    const candidates = tutorialIds.filter((id) => tutorials[id].screen === 'battle' && tutorialEligible(id, profile, manual) && (manual || !profile.seenTutorialIds.includes(id)));
    if (!candidates.length) return;
    shown.current = true;
    ownsPause.current = !paused;
    if (ownsPause.current) battleEvents.emit(BattleEvent.PAUSE);
    setActive(manual ? candidates : candidates.slice(0, 1));
  }, [ready, enabled, active, replayRequest, paused, profile]);

  if (!active) return null;
  const close = (seen: boolean) => {
    if (seen) profile.markTutorialsSeen(active);
    setActive(null);
    if (ownsPause.current && paused && enabled) battleEvents.emit(BattleEvent.PAUSE);
    ownsPause.current = false;
  };
  return <GuidedTour steps={active.flatMap((id) => [...tutorials[id].steps])} onComplete={() => close(true)} onSkip={() => close(true)} onUnavailable={() => close(false)} />;
}
