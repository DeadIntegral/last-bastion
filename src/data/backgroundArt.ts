export interface BattleBackgroundDefinition {
  terrainId: string;
  textureKey: string;
  url: string;
  fallbackColor: number;
  mistTint: number;
  mistAlpha: number;
}

export const battleBackgroundDefinitions = {
  'ruined-border': {
    terrainId: 'ruined-border',
    textureKey: 'battle-background-ruined-border',
    url: '/assets/backgrounds/ruined-border.webp',
    fallbackColor: 0x111928,
    mistTint: 0xb9ced3,
    mistAlpha: 0.055,
  },
} as const satisfies Record<string, BattleBackgroundDefinition>;

export function battleBackgroundForTerrain(terrainId: string): BattleBackgroundDefinition | undefined {
  return battleBackgroundDefinitions[terrainId as keyof typeof battleBackgroundDefinitions];
}
