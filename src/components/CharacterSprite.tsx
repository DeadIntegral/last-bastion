import type { CSSProperties } from 'react';
import { characterArtFrames, characterArtSheet, proceduralCharacterIcons, type CharacterArtId } from '../data/characterArt';

interface CharacterSpriteProps {
  id: CharacterArtId;
  className?: string;
}

export function CharacterSprite({ id, className = '' }: CharacterSpriteProps) {
  const frame = characterArtFrames[id];
  if (!frame) return <span className={`character-sprite procedural-character ${className}`.trim()} aria-hidden="true">{proceduralCharacterIcons[id] ?? '?'}</span>;
  const sheet = characterArtSheet(id)!;
  const position = `${frame.column * 100 / 3}% ${frame.row * 100 / 3}%`;
  return (
    <span
      className={`character-sprite ${className}`.trim()}
      style={{ backgroundImage: `url('${sheet.url}')`, backgroundPosition: position } as CSSProperties}
      aria-hidden="true"
    />
  );
}
