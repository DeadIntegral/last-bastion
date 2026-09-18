export type FortressArtSide = 'player' | 'enemy';

export const fortressArtDefinitions: Record<FortressArtSide, { textureKey: string; url: string }> = {
  player: { textureKey: 'fortress-player', url: '/assets/fortresses/player-fortress.png' },
  enemy: { textureKey: 'fortress-enemy', url: '/assets/fortresses/enemy-fortress.png' },
};

export const fortressArtLayout = {
  width: 250,
  height: 228,
  baselineOffset: 24,
  worldEdgeInset: 22,
  healthBarGap: 12,
  healthBarWidth: 150,
  healthBarHeight: 9,
} as const;
