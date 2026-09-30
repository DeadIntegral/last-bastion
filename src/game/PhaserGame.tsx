import type { MonumentBuildingId } from '../data/endgame';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getStage } from '../data/stages';
import type { BattleSpeed, CastleTechId, EquipmentLevels, HeroId, ItemId, UnitId } from '../types/game';
import { BattleScene, WORLD_HEIGHT, WORLD_WIDTH } from './BattleScene';

interface PhaserGameProps {
  stageId: number;
  equipmentLevels: Record<UnitId, EquipmentLevels>;
  equippedUnits: UnitId[];
  unitItems: Partial<Record<UnitId, ItemId | null>>;
  fortressItems: Array<ItemId | null>;
  unitMasteryXp: Record<UnitId, number>;
  heroId: HeroId;
  heroEquipmentLevel: EquipmentLevels;
  heroMasteryXp: number;
  castleTechLevels: Record<CastleTechId, number>;
  builtMonumentIds: readonly MonumentBuildingId[];
  battleSpeed: BattleSpeed;
}

export function PhaserGame({ stageId, equipmentLevels, equippedUnits, unitItems, fortressItems, unitMasteryXp, heroId, heroEquipmentLevel, heroMasteryXp, castleTechLevels, builtMonumentIds, battleSpeed }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const initialBattleSpeedRef = useRef(battleSpeed);

  useEffect(() => {
    if (!parentRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.WEBGL,
      parent: parentRef.current,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      autoMobileTextures: true,
      backgroundColor: '#111928',
      scene: [new BattleScene(
        getStage(stageId), equipmentLevels, equippedUnits, unitItems, fortressItems, unitMasteryXp, heroId,
        heroEquipmentLevel, heroMasteryXp, castleTechLevels, builtMonumentIds, initialBattleSpeedRef.current,
      )],
      render: { antialias: true, pixelArt: false, roundPixels: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      banner: false,
      audio: { noAudio: true },
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [stageId, equipmentLevels, equippedUnits, unitItems, fortressItems, unitMasteryXp, heroId, heroEquipmentLevel, heroMasteryXp, castleTechLevels, builtMonumentIds]);

  return <div className="phaser-host" ref={parentRef} aria-label="전투 화면" />;
}
