# Illustrated campaign map assets

Five original region panels form the horizontally draggable continent map. They replace the former CSS-only sea, polygon land, triangle mountains, and text forests while leaving stage progression and challenge discovery unchanged.

## Runtime contract

- Runtime panels: five 1400 × 630 lossy WebP files, quality 82, approximately 167–204 KB each.
- Sources: five 1870 × 841 RGB PNG masters under `sources/`.
- Runtime owner: `src/data/campaignMapArt.ts` defines order, names, six-stage ranges, image paths, region width, and compact node placement.
- Presentation: each panel occupies one 1,000-unit map region with an 80-unit overlap; CSS edge masks soften seams.
- Node art: campaign fortress markers reuse the canonical transparent assets from `src/data/fortressArt.ts` rather than duplicating a map-only castle drawing.
- Generation mode: built-in image generation tool.
- Use case: `stylized-concept`.
- Generated: 2026-09-27.
- Optimization: `cwebp -q 82 -m 6 -resize 1400 630`.

## Shared generation prompt

> Create one 20:9 ultra-wide region panel for a horizontally scrollable illustrated fantasy campaign map. Match the supplied western-frontier panel's camera height, premium hand-painted low-fantasy cartographic landscape, painterly miniature terrain, atmospheric depth, restrained charcoal-navy palette, rendering density, and soft blendable edges. Use an oblique bird's-eye strategic-map view with varied vertical landforms and open pockets for six overlaid mission nodes. No readable text, labels, letters, numbers, UI, borders, frames, compass, characters, armies, creatures, standalone castles, fortress icons, large flags, node markers, dotted routes, board-game hexes, parchment background, photorealism, 3D render, or watermark. Keep contrast moderate beneath UI and avoid one dominant foreground object.

Region-specific final requests:

1. `western-frontier.webp`: slate-blue sea entering from the far left, irregular rocky coastline, river mouths, weathered roads, burned farms, ruined boundary walls, sparse dark forest, watchtower ruins, distant foothills, and weak beacon fires under cold gray-blue dawn.
2. `fallen-capital.webp`: broad occupied heartland plains crossed by a winding river, damaged stone roads, aqueduct fragments, abandoned orchards, defaced statues, villages, and the distant ruined royal capital under dusty overcast light.
3. `ash-highland.webp`: rising basalt shelves, switchback passes, mining terraces, broken chimneys, cooled lava beds, restrained glowing fissures, ash forests, and smoke beneath copper ash-filtered light.
4. `spirit-tundra.webp`: snow plateau, frozen rivers and lakes, evergreen groves, wind-cut ice, broken standing stones, subtle binding-rune circles, distant pale mountains, and a restrained aurora.
5. `demon-rift.webp`: tundra giving way to shattered charcoal plateaus, restrained violet/crimson ground cracks, twisted woodland, collapsed bridges, broken spire fields, upward ash, and a distant contained rift beneath storm clouds.

Do not overwrite selected assets casually. Add versioned siblings, verify node readability and panel seams at runtime, then update `campaignMapArt.ts` and this record.
