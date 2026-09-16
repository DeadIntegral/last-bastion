# Opening cinematic assets

These four project-owned 1672 × 941 WebP backgrounds are the runtime art for the New Game prologue. They were generated with the built-in `imagegen` tool on 2026-09-16 and optimized with `cwebp -q 88 -m 6`. Runtime order, copy, duration, and image paths are canonical in `src/data/opening.ts`.

## Shared art direction

- Use case: `stylized-concept`
- Asset: wide 16:9 cinematic backgrounds for an original web fantasy strategy game
- Medium: premium hand-painted 2D dark-fantasy concept art and cinematic matte painting
- Palette: charcoal navy, weathered stone, ember crimson, and restrained antique gold
- Kingdom identity: torn deep-blue banners with an original antique-gold crown-and-tower emblem
- Generation composition: layered atmospheric depth with a darker lower-left region originally reserved for Korean overlay copy
- Runtime presentation: the final UI instead uses a centered lower-third title and subtitle over a full-width bottom vignette; this preserves the generation prompt record while documenting the implemented overlay
- Avoid: embedded text, letters, UI, frames, watermarks, modern objects, copyrighted characters, or recognizable franchise designs

## Final prompt set

1. `opening-01-fallen-continent.webp`: a once-great capital burning at night, demonic and monster armies filling the roads, and one tiny unconquered fortress glowing on the far western horizon; foreground ruins, middle-ground occupied city, distant last hope.
2. `opening-02-last-bastion.webp`: predawn refugees and scattered soldiers following a winding road toward the scarred Last Bastion, with a worn militia torchbearer at the gate and burned villages behind. A targeted edit replaced ambiguous black heraldry with the canonical weathered blue-and-gold kingdom banners while preserving the scene.
3. `opening-03-oath.webp`: a battered alliance of militia, shield soldiers, archer, mage, and mounted scout seen from behind on the fortress wall as they raise the torn kingdom banner into the first sunrise over occupied valleys.
4. `opening-04-counteroffensive.webp`: militia, shield formations, archers, mage, cavalry, and wagons marching from the Last Bastion across a ruined continent toward the Demon King's distant black citadel beneath a crimson storm.

Do not regenerate or overwrite these selected files casually. Add a versioned sibling and update `src/data/opening.ts` plus this record when replacing a shot.
