import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { openingSequences } from '../data/opening';
import { Localized } from '../shared/i18n/Localized';
import { useTranslation } from '../shared/i18n/i18n';
import { GameButton } from './GameButton';

export function Opening({ chapter = 1, onComplete }: { chapter?: 1 | 2; onComplete: () => void }) {
  const { t } = useTranslation();
  const { scenes, durationMs } = openingSequences[chapter];
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes[sceneIndex];
  const isLast = sceneIndex === scenes.length - 1;
  const advance = useCallback(() => {
    if (isLast) onComplete();
    else setSceneIndex((current) => current + 1);
  }, [isLast, onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(advance, durationMs);
    return () => window.clearTimeout(timer);
  }, [advance, sceneIndex, durationMs]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.code || event.key) === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  return <Localized>{(
    <main data-opening-chapter={chapter} className={`opening-screen opening-${scene.art}`} style={{ '--opening-duration': `${durationMs}ms` } as CSSProperties}>
      <img className="opening-visual" src={scene.image} style={{ objectPosition: scene.imagePosition }} alt="" aria-hidden="true" key={scene.image} />
      <div className="opening-atmosphere" aria-hidden="true" />
      <div className="opening-preload" aria-hidden="true">
        {scenes.map((entry) => <img src={entry.image} alt="" key={entry.image} />)}
      </div>
      <GameButton variant="ghost" className="opening-skip" onClick={onComplete}>오프닝 건너뛰기 <span>Esc</span></GameButton>
      <section className="opening-story" aria-live="polite" key={scene.title}>
        <span className="eyebrow">{scene.eyebrow}</span>
        <h1>{scene.title}</h1>
        <p>{scene.text}</p>
        <div className="opening-progress" aria-label={t('오프닝 {current}/{total}', { current: sceneIndex + 1, total: scenes.length })}>
          {scenes.map((entry, index) => <i className={index < sceneIndex ? 'complete' : index === sceneIndex ? 'active' : ''} key={entry.title} />)}
        </div>
        <small>{t('자동 재생')} · {sceneIndex + 1} / {scenes.length}</small>
      </section>
    </main>
  )}</Localized>;
}
