import { describe, expect, it } from 'vitest';
import { challengeStages, stages } from '../data/stages';
import { analyzeCampaignDifficulty, stageDifficultyPresentation } from './difficulty';

describe('player-facing difficulty presentation', () => {
  const campaign = analyzeCampaignDifficulty(stages);

  it('uses calculated encounter pressure instead of the stage identity', () => {
    const stage = stages[7];
    const presentation = stageDifficultyPresentation(stage, campaign);
    const alteredIdentity = stageDifficultyPresentation({ ...stage, id: 999 }, campaign);

    expect(presentation.threatIndex).not.toBe(stage.id);
    expect(alteredIdentity).toEqual(presentation);
  });

  it('maps campaign and challenge pressure into five readable tiers', () => {
    expect(stageDifficultyPresentation(stages[0], campaign)).toMatchObject({ rank: 1, label: '낮음' });
    expect(stageDifficultyPresentation(stages[10], campaign)).toMatchObject({ rank: 3, label: '높음' });
    expect(stageDifficultyPresentation(stages.at(-1)!, campaign)).toMatchObject({ rank: 5, label: '극한' });
    expect(stageDifficultyPresentation(challengeStages.at(-1)!, campaign).rank).toBe(5);
  });
});
