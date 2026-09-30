import { exclusiveEnemyDefinitions, exclusiveEnemyIds, exclusiveEnemyLore } from '../data/enemies';
import { attackPatternLabel } from '../game/rules';
import { useGameStore } from '../store/useGameStore';
import { Localized } from '../shared/i18n/Localized';
import { CharacterSprite } from './CharacterSprite';

export function ExclusiveEnemyCodex() {
  const discovered = useGameStore((state) => state.discoveredEnemies);
  const visible = exclusiveEnemyIds.filter((id) => discovered.includes(id));
  if (!visible.length) return null;
  return <Localized><section className="codex-section enemy-codex-section">
    <header><span>◈</span><div><small>챕터 2 · 영입 불가</small><h3>장막의 군세</h3></div><b>{visible.length}/{exclusiveEnemyIds.length}</b></header>
    <p>챕터 2의 전용 적 기록입니다. 챕터 1 사전 완성도와 별도로 수집합니다.</p>
    <div className="codex-grid">{visible.map((id) => <article className="codex-card enemy-entry" key={id}>
      <span className="codex-icon"><CharacterSprite id={id} /></span><div><small>장막 군세 · 영입 불가</small><h4>{exclusiveEnemyDefinitions[id].name}</h4><p>{exclusiveEnemyLore[id].description}</p><blockquote>{exclusiveEnemyLore[id].counter}</blockquote><p>{attackPatternLabel(exclusiveEnemyDefinitions[id])}</p></div>
    </article>)}</div>
  </section></Localized>;
}
