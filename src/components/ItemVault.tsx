import { useState, type DragEvent, type ReactNode } from 'react';
import { FORTRESS_ITEM_SLOT_COUNT, itemDefinitions, itemOrder } from '../data/items';
import { troopDefinitions } from '../data/units';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';
import { useGameStore } from '../store/useGameStore';
import type { ItemId } from '../types/game';
import { GameButton } from './GameButton';

const ITEM_DRAG_TYPE = 'application/x-last-bastion-item';

export function ItemVault({ header }: { header: ReactNode }) {
  const ownedItems = useGameStore((state) => state.ownedItems);
  const formationSlots = useGameStore((state) => state.formationSlots);
  const formationItemSlots = useGameStore((state) => state.formationItemSlots);
  const fortressItemSlots = useGameStore((state) => state.fortressItemSlots);
  const assignFormationItem = useGameStore((state) => state.assignFormationItem);
  const assignFortressItem = useGameStore((state) => state.assignFortressItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(ownedItems[0] ?? null);
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
      <div><span className="eyebrow">EXPEDITION RELICS</span><h2>원정 장비고</h2></div>
      <p>편성 아이템은 번호 슬롯에 남아 그 자리에 배치되는 병종을 강화합니다. 성채 아이템은 두 칸만 선택해 모든 전투에 적용합니다.</p>
    </section>

    <section className="item-loadout-grid">
      <div className="item-socket-panel">
        <header><span className="eyebrow">FORMATION SLOTS</span><h3>편성 슬롯 아이템</h3><p>아이템을 드래그하거나 선택한 뒤 슬롯을 누르세요.</p></header>
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
              {itemId && <GameButton variant="ghost" size="small" className="item-unequip" onClick={() => unequipItem(itemId)} aria-label={t('{name} 장착 해제', { name: t(itemDefinitions[itemId].name) })}>×</GameButton>}
            </div>;
          })}
        </div>
      </div>

      <div className="item-socket-panel fortress-item-panel">
        <header><span className="eyebrow">FORTRESS SLOTS</span><h3>성채 아이템</h3><p>{FORTRESS_ITEM_SLOT_COUNT}개만 활성화할 수 있습니다.</p></header>
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
            {itemId && <GameButton variant="ghost" size="small" className="item-unequip" onClick={() => unequipItem(itemId)} aria-label={t('{name} 장착 해제', { name: t(itemDefinitions[itemId].name) })}>×</GameButton>}
          </div>)}
        </div>
      </div>
    </section>

    <section className="item-inventory-section">
      <header><span className="eyebrow">INVENTORY</span><h3>{t('보유 아이템 {current}/{total}', { current: ownedItems.length, total: itemOrder.length })}</h3></header>
      <div className="item-inventory-grid">
        {itemOrder.map((id) => {
          const item = itemDefinitions[id];
          const owned = ownedItems.includes(id);
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
            <span className="item-copy"><small>{item.target === 'formation' ? '편성 아이템' : '성채 아이템'} · {item.rarity}성</small><b>{owned ? item.name : `${item.sourceStage}장 최초 클리어`}</b><p>{owned ? item.description : '획득 전에는 효과가 공개되지 않습니다.'}</p></span>
            {equipped && <em>장착 중</em>}
          </GameButton>;
        })}
      </div>
    </section>
    {notice && <div className="toast" role="status">{notice}</div>}
  </main></Localized>;
}
