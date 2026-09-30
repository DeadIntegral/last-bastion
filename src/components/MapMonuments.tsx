import type { MouseEvent } from 'react';
import { monumentBuildings, type MonumentBuildingId } from '../data/endgame';
import { Localized } from '../shared/i18n/Localized';
import { t } from '../shared/i18n/i18n';
import { MonumentSilhouette } from './MonumentSilhouette';

export function MapMonuments({ builtIds, onOpen }: { builtIds: MonumentBuildingId[]; onOpen: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <Localized>{monumentBuildings.map((building, index) => builtIds.includes(building.id) && <button
    type="button" className="map-monument" style={{ left: building.x, top: building.y }} key={building.id}
    aria-label={t('{name} · 건설 완료 · 기념비 관리', { name: t(building.name) })} onClick={onOpen}>
    <MonumentSilhouette index={index} /><strong>{building.name}</strong><small>건설 완료</small>
  </button>)}</Localized>;
}
