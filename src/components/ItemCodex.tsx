import { itemDefinitions, itemDropRegionStartStage, itemOrder, itemRecipes } from '../data/items';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';

export function ItemCodex() {
  return <Localized><section className="codex-section item-codex">
    <div className="item-reference-grid">{itemOrder.map((id) => {
      const item = itemDefinitions[id];
      const recipe = itemRecipes.find((entry) => entry.result === id);
      return <details className={`item-reference rarity-${item.rarity}`} key={id}>
        <summary><span className="item-reference-icon" aria-hidden="true">{item.icon}</span><span><small>{item.target === 'formation' ? '편성 아이템' : '성채 아이템'} · {item.rarity}성</small><strong>{item.name}</strong></span></summary>
        <div className="item-reference-body"><p>{item.description}</p>
          {item.dropRegion && <p>{t('{stage}장부터 전투 드롭', { stage: itemDropRegionStartStage[item.dropRegion] })}</p>}
          {recipe && <dl><div><dt>조합 재료</dt><dd>{recipe.ingredients.map(({ id: ingredientId, count }) => `${t(itemDefinitions[ingredientId].name)} ×${count}`).join(' + ')}</dd></div><div><dt>조합 조건</dt><dd>{t('{stage}장 클리어 필요', { stage: recipe.requiredStage })}</dd></div></dl>}
        </div>
      </details>;
    })}</div>
  </section></Localized>;
}
