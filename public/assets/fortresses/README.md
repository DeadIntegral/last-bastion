# Battlefield fortress art

The battle scene uses two original transparent hand-painted fortress sprites instead of Phaser rectangles:

- `player-fortress.png`: 640 × 585 RGBA runtime sprite, blue-gray kingdom stonework and aged-gold banners, with its gate facing the battlefield to the right.
- `enemy-fortress.png`: 640 × 585 RGBA runtime sprite, charcoal and burgundy occupied stonework, crimson banners and ember windows, with its gate facing the battlefield to the left.
- `sources/*-fortress-source.png`: 1312 × 1199 RGBA generated masters retained for future non-destructive revisions.

`src/data/fortressArt.ts` is the canonical runtime path and display-layout mapping. Both sprites keep real alpha transparency and share a 250 × 228 virtual battlefield footprint. Challenge stages intentionally draw no enemy fortress.

## Generation record

- Mode: built-in image generation tool
- Use case: `stylized-concept`
- Generated: 2026-09-16

Player-fortress final prompt:

> Create one original player kingdom fortress on a genuinely transparent background for a 2D side-view lane strategy game. Match a polished hand-painted low-fantasy character-sprite style with subtle inked edges, restrained chibi proportions, a crisp silhouette readable around 180 px, and painterly texture rather than flat CSS geometry. Show exactly one full structure from foundation to battlements, mostly side-on with a slight three-quarter read and its arched gate oriented right. Use layered blue-gray stone walls, two squat towers, a central keep, a wooden gate, arrow slits, aged-gold kingdom banners, modest battle wear, cool overcast light, and warm gold highlights. Center it with generous transparent padding and a grounded baseline. No characters, text, frame, UI, landscape, opaque background, watermark, photorealism, 3D render, isometric view, modern architecture, crop, or floating debris.

Enemy-fortress final prompt:

> Using the player fortress only as a style, scale, silhouette-complexity, and painterly-rendering reference, create one distinct original Demon Army occupied fortress on a genuinely transparent background. Match the same polished hand-painted 2D low-fantasy game-sprite quality and compact proportions. Show exactly one full black-stone structure with two squat battlement towers, a central keep, dark iron braces, a reinforced arched gate oriented left, weathered charcoal and burgundy masonry, restrained horn-like roof ornaments, muted crimson banners with an abstract split-sun sigil, dim ember-orange windows, and modest siege wear. Keep the whole structure centered on the same grounded baseline with generous padding. No characters, text, frame, UI, landscape, opaque background, watermark, photorealism, 3D render, isometric view, skull overload, living-monster face, crop, or floating debris.
