import Phaser from 'phaser';
import { fortressSkillTuning } from '../data/fortressSkills';
import { t } from '../shared/i18n/i18n';
import type { BattleText } from './battleText';

export class FortressTrapVisual {
  private readonly object: Phaser.GameObjects.Container;
  private readonly ring: Phaser.GameObjects.Arc;
  private state = -1;

  constructor(scene: Phaser.Scene, text: BattleText, x: number, y: number) {
    this.ring = scene.add.circle(0, 0, fortressSkillTuning.trap.radius, 0xd9b76c, .07).setStrokeStyle(2, 0xd9b76c, .8).setScale(1, .25);
    const plate = scene.add.rectangle(0, 0, 36, 13, 0x354657).setStrokeStyle(2, 0xc9b988);
    const teeth = Array.from({ length: 4 }, (_, index) => scene.add.rectangle((index - 1.5) * 9, -4, 4, 13, 0xe2d7b4).setAngle((index - 1.5) * 10));
    const label = text.create(0, 27, t(fortressSkillTuning.trap.name), { fontFamily: 'Pretendard Variable, system-ui, sans-serif', fontSize: '12px', color: '#eeddb3', backgroundColor: '#13212cbb', padding: { x: 6, y: 3 } }).setOrigin(.5, 0);
    this.object = scene.add.container(x, y, [this.ring, plate, ...teeth, label]).setDepth(520).setVisible(false);
  }

  show(active: boolean, armed: boolean): void {
    const state = active ? armed ? 2 : 1 : 0;
    if (state === this.state) return;
    this.state = state;
    this.object.setVisible(active);
    this.ring.setStrokeStyle(2, armed ? 0xe6bc66 : 0x84c3d8, .8);
  }

  destroy(): void { this.object.destroy(); }
}
