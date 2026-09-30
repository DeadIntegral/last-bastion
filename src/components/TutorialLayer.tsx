import { useEffect, useRef, useState } from 'react';
import { TUTORIAL_REPLAY_EVENT, tutorialEligible, tutorialIds, tutorials, type TutorialId } from '../data/tutorials';
import { useGameStore } from '../store/useGameStore';
import { GuidedTour, tourTarget } from './GuidedTour';

export function TutorialLayer({ screen }: { screen: string }) {
  const profile = useGameStore();
  const [active, setActive] = useState<TutorialId[] | null>(null);
  const shownThisVisit = useRef(false);
  const candidates = tutorialIds.filter((id) => tutorials[id].screen === screen && screen !== 'battle');
  const choose = (manual: boolean) => candidates.find((id) => (manual || !profile.seenTutorialIds.includes(id)) && tutorialEligible(id, profile, manual) && tutorials[id].steps.some((step) => tourTarget(step.target)));

  useEffect(() => {
    if (active || shownThisVisit.current || !candidates.length) return;
    let frame = 0;
    const attempt = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        const id = choose(false);
        if (id) { shownThisVisit.current = true; setActive([id]); }
      });
    };
    const observer = new MutationObserver(attempt);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });
    attempt();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });

  useEffect(() => {
    const replay = () => {
      const ids = candidates.filter((id) => tutorialEligible(id, profile, true) && tutorials[id].steps.some((step) => tourTarget(step.target)));
      if (ids.length) { shownThisVisit.current = true; setActive(ids); }
    };
    window.addEventListener(TUTORIAL_REPLAY_EVENT, replay);
    return () => window.removeEventListener(TUTORIAL_REPLAY_EVENT, replay);
  });

  if (!active) return null;
  const close = (seen: boolean) => {
    if (seen) profile.markTutorialsSeen(active);
    setActive(null);
  };
  return <GuidedTour key={active.join(',')} steps={active.flatMap((id) => [...tutorials[id].steps])} onComplete={() => close(true)} onSkip={() => close(true)} onUnavailable={() => close(false)} />;
}
