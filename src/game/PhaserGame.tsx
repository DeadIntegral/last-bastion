import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getStage } from '../data/stages';
import type { BattleSpeed, CastleTechId, EquipmentLevels, HeroId, UnitId } from '../types/game';
import { BattleScene, WORLD_HEIGHT, WORLD_WIDTH } from './BattleScene';

interface PhaserGameProps {
  stageId: number;
  equipmentLevels: Record<UnitId, EquipmentLevels>;
  equippedUnits: UnitId[];
  unitMasteryXp: Record<UnitId, number>;
  heroId: HeroId;
  heroEquipmentLevel: EquipmentLevels;
  heroMasteryXp: number;
  castleTechLevels: Record<CastleTechId, number>;
  triumphMonumentLevel: number;
  battleSpeed: BattleSpeed;
}

export function PhaserGame({ stageId, equipmentLevels, equippedUnits, unitMasteryXp, heroId, heroEquipmentLevel, heroMasteryXp, castleTechLevels, triumphMonumentLevel, battleSpeed }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const initialBattleSpeedRef = useRef(battleSpeed);

  useEffect(() => {
    if (!parentRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      backgroundColor: '#111928',
      scene: [new BattleScene(
        getStage(stageId), equipmentLevels, equippedUnits, unitMasteryXp, heroId,
        heroEquipmentLevel, heroMasteryXp, castleTechLevels, triumphMonumentLevel, initialBattleSpeedRef.current,
      )],
      render: { antialias: true, pixelArt: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      banner: false,
      audio: { noAudio: true },
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [stageId, equipmentLevels, equippedUnits, unitMasteryXp, heroId, heroEquipmentLevel, heroMasteryXp, castleTechLevels, triumphMonumentLevel]);

  return <div className="phaser-host" ref={parentRef} aria-label="전투 화면" />;
}
