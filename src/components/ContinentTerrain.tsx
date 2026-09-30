import { useId } from 'react';
import { campaignMapRegions, chapterTwoMapRegion, continentMapArt } from '../data/campaignMapArt';

/** One continuous painting, revealed through soft, irregular geographic footprints. */
export function ContinentTerrain({ regionCount, chapterTwo, clearedStages }: { regionCount: number; chapterTwo: boolean; clearedStages: readonly number[] }) {
  const id = useId().replaceAll(':', '');
  const regions = campaignMapRegions.slice(0, regionCount);
  return <svg className="continent-terrain" width={continentMapArt.width} height={continentMapArt.height} viewBox={`0 0 ${continentMapArt.width} ${continentMapArt.height}`} aria-hidden="true">
    <defs>
      <filter id={`${id}-soft`} x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="45" /></filter>
      <mask id={`${id}-discovered`} maskUnits="userSpaceOnUse" x="0" y="0" width={continentMapArt.width} height={continentMapArt.height}>
        <g fill="white" filter={`url(#${id}-soft)`}>
          {regions.map((region) => <path d={region.outline} key={region.id} />)}
          {chapterTwo && <path d={chapterTwoMapRegion.outline} />}
        </g>
      </mask>
    </defs>
    <image className="continent-painting" href={continentMapArt.image} width={continentMapArt.width} height={continentMapArt.height} preserveAspectRatio="none" mask={`url(#${id}-discovered)`} />
    <g className="continent-reclaimed" filter={`url(#${id}-soft)`}>
      {regions.filter((region) => clearedStages.includes(region.stageEnd)).map((region) => <path d={region.outline} key={region.id} />)}
    </g>
  </svg>;
}
