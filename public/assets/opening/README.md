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

## Chapter 2 — Beyond the Veil (2026-09-30)

Three new original 1672 × 941 images use the same shared cinematic component. Canonical copy/order is `chapterTwoOpeningScenes` in `src/data/opening.ts`; each shot lasts 6 seconds, with an 18-second total. The first eligible map-node, frontier-shortcut or monument entry launches the sequence. Skip/Escape and automatic completion return to the first mission and persist completion per slot. Neither enemies nor unlock mechanics are explained in the story.

Runtime WebPs were encoded with `cwebp -q 86 -m 6`. PNG masters are retained in `sources/`, with matching versioned filenames. Generation used the built-in imagegen tool, `stylized-concept`, full-bleed 16:9 dark-fantasy matte paintings with charcoal navy/slate/antique-gold colors, atmospheric depth and a quiet lower central third for story text. No text, readable inscriptions, UI, borders, watermarks, modern objects, identifiable enemy faces or franchise designs.

1. `chapter-two-01-aftermath-v1.webp` / `sources/chapter-two-01-aftermath-v1.png`: day after reconquest, exhausted commander and blue/gold standard-bearer seen from behind on a breached castle wall, soldiers repairing stonework, liberated valleys with warm town lights at cold dawn, northern mountains swallowed by an unnatural gray-blue mist bank; restrained relief and unease rather than a celebration crowd.
2. `chapter-two-02-beacon-v1.webp` / `sources/chapter-two-02-beacon-v1.png`: at night, a weathered victory monument with an original abstract crown/tower relief awakens with narrow gold light in its seams, two cloaked scouts, a faint thread of light along a ruined mountain pass and aqueduct into a wall of mist; no laser or sci-fi portal.
3. `chapter-two-03-threshold-v1.webp` / `sources/chapter-two-03-threshold-v1.png`: kingdom soldiers and a cloaked commander enter a cold fogbound northern pass; a broken scout spear with a torn blue tower banner is left in the foreground, lanterns recede behind them, immense ruined gate pillars barely emerge ahead; unknown opponents remain unseen.
