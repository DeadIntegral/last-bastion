import Phaser from 'phaser';

/** Resize-only typography for world labels; never scans or allocates during combat updates. */
export class BattleText {
  private readonly labels = new Map<Phaser.GameObjects.Text, number>();

  constructor(private readonly scene: Phaser.Scene) {
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.resize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  create(x: number, y: number, content: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    const text = this.scene.add.text(x, y, content, style);
    const baseSize = typeof style.fontSize === 'number' ? style.fontSize : parseFloat(style.fontSize ?? '16');
    this.labels.set(text, baseSize);
    text.once(Phaser.GameObjects.Events.DESTROY, () => this.labels.delete(text));
    this.fit(text, baseSize);
    // Canvas text does not trigger CSS unicode-range font downloads by itself.
    // Redraw only the still-live label once its actual glyph subset is available.
    if (typeof document !== 'undefined' && document.fonts) {
      const weight = style.fontStyle?.includes('bold') ? 700 : 400;
      void document.fonts.load(`${weight} ${baseSize}px "Pretendard Variable"`, content)
        .then(() => { if (this.labels.has(text)) text.updateText(); })
        .catch(() => { /* Keep the configured system fallback when the CDN is unavailable. */ });
    }
    return text;
  }

  private fit(text: Phaser.GameObjects.Text, baseSize: number): void {
    const { parentSize, gameSize } = this.scene.scale;
    const scale = Math.min(parentSize.width / gameSize.width, parentSize.height / gameSize.height);
    if (scale > 0) text.setFontSize(Math.max(baseSize, Math.ceil(10 / scale)));
  }

  private resize(): void {
    for (const [text, baseSize] of this.labels) this.fit(text, baseSize);
  }

  private destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.resize, this);
    this.labels.clear();
  }
}
