import { useState, type DragEvent, type ReactNode } from 'react';
import { FORTRESS_ITEM_SLOT_COUNT, itemDefinitions, itemOrder, itemRecipes, MAX_ITEM_STACK } from '../data/items';
import { troopDefinitions } from '../data/units';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';
import { useGameStore } from '../store/useGameStore';
import type { ItemId } from '../types/game';
import { GameButton } from './GameButton';

const ITEM_DRAG_TYPE = 'application/x-last-bastion-item';

export function ItemVault({ header }: { header: ReactNode }) {
  const itemInventory = useGameStore((state) => state.itemInventory);
  const clearedStages = useGameStore((state) => state.clearedStages);
  const formationSlots = useGameStore((state) => state.formationSlots);
  const formationItemSlots = useGameStore((state) => state.formationItemSlots);
  const fortressItemSlots = useGameStore((state) => state.fortressItemSlots);
  const assignFormationItem = useGameStore((state) => state.assignFormationItem);
  const assignFortressItem = useGameStore((state) => state.assignFortressItem);
  const unequipFormationItem = useGameStore((state) => state.unequipFormationItem);
  const unequipFortressItem = useGameStore((state) => state.unequipFortressItem);
  const craftItem = useGameStore((state) => state.craftItem);
  const firstOwnedItem = itemOrder.find((id) => (itemInventory[id] ?? 0) > 0) ?? null;
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(firstOwnedItem);
  const [notice, setNotice] = useState('');

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1_800);
  };

  const startDrag = (event: DragEvent<HTMLElement>, id: ItemId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(ITEM_DRAG_TYPE, id);
    event.dataTransfer.setData('text/plain', id);
  };

  const droppedItem = (event: DragEvent<HTMLElement>): ItemId | undefined => {
    event.preventDefault();
    const id = event.dataTransfer.getData(ITEM_DRAG_TYPE) || event.dataTransfer.getData('text/plain');
    return itemOrder.includes(id as ItemId) ? id as ItemId : undefined;
  };

  const equipFormation = (id: ItemId, index: number) => {
    notify(assignFormationItem(id, index)
      ? t('{name}을(를) {slot}번 편성 슬롯에 장착했습니다.', { name: t(itemDefinitions[id].name), slot: index + 1 })
      : '편성 슬롯에는 편성 아이템만 장착할 수 있습니다.');
  };

  const equipFortress = (id: ItemId, index: number) => {
    notify(assignFortressItem(id, index)
      ? t('{name}을(를) 성채 {slot}번 슬롯에 장착했습니다.', { name: t(itemDefinitions[id].name), slot: index + 1 })
      : '성채 슬롯에는 성채 아이템만 장착할 수 있습니다.');
  };

  return <Localized><main className="panel-screen item-vault-screen">
    {header}
    <section className="armory-intro">
      <div><span className="eyebrow">원정 유물</span><h2>원정 장비고</h2></div>
      <p>편성 아이템은 번호 슬롯에 남아 그 자리에 배치되는 병종을 강화합니다. 성채 아이템은 두 칸만 선택해 모든 전투에 적용합니다.</p>
    </section>

    <section className="item-loadout-grid">
      <div className="item-socket-panel">
        <header><span className="eyebrow">편성 장착</span><h3>편성 슬롯 아이템</h3><p>아이템을 드래그하거나 선택한 뒤 슬롯을 누르세요.</p></header>
        <div className="item-formation-sockets">
          {formationSlots.map((unitId, index) => {
            const itemId = formationItemSlots[index];
            return <div
              className={`item-socket ${itemId ? 'equipped' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { const id = droppedItem(event); if (id) equipFormation(id, index); }}
              key={index}
            >
              <GameButton variant="ghost" onClick={() => selectedItem && equipFormation(selectedItem, index)} aria-label={t('{slot}번 편성 아이템 슬롯', { slot: index + 1 })}>
                <i>{index + 1}</i><span>{itemId ? itemDefinitions[itemId].icon : '◇'}</span><b>{itemId ? itemDefinitions[itemId].name : '빈 아이템 슬롯'}</b><small>{unitId ? troopDefinitions[unitId].name : '빈 편성 위치'}</small>
              </GameButton>
              {itemId && <GameButton variant="ghost" size="small" className="item-unequip" onClick={() => unequipFormationItem(index)} aria-label={t('{name} 장착 해제', { name: t(itemDefinitions[itemId].name) })}>×</GameButton>}
            </div>;
          })}
        </div>
      </div>

      <div className="item-socket-panel fortress-item-panel">
        <header><span className="eyebrow">성채 장착</span><h3>성채 아이템</h3><p>{FORTRESS_ITEM_SLOT_COUNT}개만 활성화할 수 있습니다.</p></header>
        <div className="fortress-item-sockets">
          {fortressItemSlots.map((itemId, index) => <div
            className={`item-socket fortress-socket ${itemId ? 'equipped' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { const id = droppedItem(event); if (id) equipFortress(id, index); }}
            key={index}
          >
            <GameButton variant="ghost" onClick={() => selectedItem && equipFortress(selectedItem, index)} aria-label={t('{slot}번 성채 아이템 슬롯', { slot: index + 1 })}>
              <i>{index + 1}</i><span>{itemId ? itemDefinitions[itemId].icon : '⬢'}</span><b>{itemId ? itemDefinitions[itemId].name : '빈 성채 슬롯'}</b><small>왕국 성채 전체 적용</small>
            </GameButton>
            {itemId && <GameButton variant="ghost" size="small" className="item-unequip" onClick={() => unequipFortressItem(index)} aria-label={t('{name} 장착 해제', { name: t(itemDefinitions[itemId].name) })}>×</GameButton>}
          </div>)}
        </div>
      </div>
    </section>

    <section className="item-inventory-section">
      <header><span className="eyebrow">보유 목록</span><h3>{t('보유 아이템 {current}/{total}', { current: itemOrder.filter((id) => (itemInventory[id] ?? 0) > 0).length, total: itemOrder.length })}</h3></header>
      <div className="item-inventory-grid">
        {itemOrder.map((id) => {
          const item = itemDefinitions[id];
          const count = itemInventory[id] ?? 0;
          const owned = count > 0;
          const equipped = formationItemSlots.includes(id) || fortressItemSlots.includes(id);
          return <GameButton
            variant="filter"
            active={selectedItem === id}
            className={`item-inventory-card rarity-${item.rarity} ${owned ? '' : 'locked'}`}
            disabled={!owned}
            draggable={owned}
            onDragStart={(event) => startDrag(event, id)}
            onClick={() => setSelectedItem(id)}
            key={id}
          >
            <span className="item-icon">{owned ? item.icon : '?'}</span>
            <span className="item-copy"><small>{item.target === 'formation' ? '편성 아이템' : '성채 아이템'} · {item.rarity}성</small><b>{owned ? item.name : item.dropRegion ? '전투 아이템 드롭' : '아이템 조합 전용'}</b><p>{owned ? item.description : '획득 전에는 효과가 공개되지 않습니다.'}</p></span>
            <span className="item-count">×{count}</span>{equipped && <em>장착 중</em>}
          </GameButton>;
        })}
      </div>
    </section>
    <section className="item-crafting-section">
      <header><span className="eyebrow">연금 공방</span><h3>아이템 조합</h3><p>장착하지 않은 재료 두 개를 소비해 더 강한 복합 아이템을 만듭니다.</p></header>
      <div className="item-recipe-grid">{itemRecipes.map((recipe) => {
        const unlocked = clearedStages.includes(recipe.requiredStage);
        const ingredients = recipe.ingredients.map((ingredient) => `${t(itemDefinitions[ingredient.id].name)} ×${ingredient.count}`).join(' + ');
        const equippedCount = (id: ItemId) => formationItemSlots.filter((current) => current === id).length + fortressItemSlots.filter((current) => current === id).length;
        const resultStackFull = (itemInventory[recipe.result] ?? 0) >= MAX_ITEM_STACK;
        const craftable = unlocked
          && !resultStackFull
          && recipe.ingredients.every((ingredient) => (itemInventory[ingredient.id] ?? 0) - equippedCount(ingredient.id) >= ingredient.count);
        const result = itemDefinitions[recipe.result];
        return <article className={`item-recipe-card rarity-${result.rarity} ${unlocked ? '' : 'locked'}`} key={recipe.id}>
          <span className="item-icon">{result.icon}</span><div><small>{t('{stage}장 조합 해금', { stage: recipe.requiredStage })}</small><h4>{result.name}</h4><p>{result.description}</p><em>{ingredients}</em></div>
          <GameButton disabled={!craftable} onClick={() => notify(craftItem(recipe.id) ? t('{name} 조합에 성공했습니다.', { name: t(result.name) }) : t('재료 아이템을 장착 해제하고 수량을 확인하세요.'))}>{!unlocked ? t('{stage}장 클리어 필요', { stage: recipe.requiredStage }) : resultStackFull ? '보유 한도 도달' : craftable ? '아이템 조합' : '재료 부족 또는 장착 중'}</GameButton>
        </article>;
      })}</div>
    </section>
    {notice && <div className="toast" role="status">{notice}</div>}
  </main></Localized>;
}
