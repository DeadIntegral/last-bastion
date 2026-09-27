# Illustrated campaign map assets

Five original region panels form the two-dimensionally draggable continent map. They replace the former CSS-only sea, polygon land, triangle mountains, and text forests while leaving stage progression and challenge discovery unchanged.

## Runtime contract

- Runtime panels: five 1400 × 630 lossy WebP files, quality 82, approximately 167–204 KB each.
- Sources: five 1870 × 841 RGB PNG masters under `sources/`.
- Runtime owner: `src/data/campaignMapArt.ts` defines order, names, six-stage ranges, image paths, two-dimensional region rectangles, node placement, marker art, and rift themes.
- Presentation: panels overlap across a 4,900 × 1,850 world; radial CSS edge masks soften seams while north/south regional movement makes vertical panning meaningful.
- Node art: three dedicated 320 × 320 transparent WebP markers distinguish occupied outposts, boss citadels, and liberated keeps. They do not reuse side-view battle-fortress images.
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

## Campaign-map fortress markers

- Runtime: `markers/occupied-outpost.webp` (24 KB), `markers/boss-citadel.webp` (35 KB), and `markers/liberated-keep.webp` (32 KB), each 320 × 320 with real alpha.
- Sources: matching 1254 × 1254 RGBA PNG masters under `markers/sources/`.
- Generated with the built-in image generation tool on 2026-09-27 and optimized with `cwebp -q 88 -alpha_q 100 -m 6 -resize 320 320`.

Shared final prompt contract:

> Create exactly one complete transparent campaign-map fortress miniature for an original low-fantasy strategy game. Use a premium hand-painted 2D cartographic style, crisp silhouette at 56–96 px, restrained detail, slight oblique top-down view matching the map, compact rocky foundation, generous transparent padding, and a gate facing lower-left. No landscape backdrop, rectangle, frame, UI, text, node badge, characters, creatures, extra castles, watermark, crop, side-view battle composition, photorealism, or 3D render.

Variants:

1. Occupied outpost: squat charcoal stone, one central tower, short wall, dark iron, muted crimson pennants, and subtle ember windows.
2. Boss citadel: a larger black-stone regional citadel with tall central keep, two heavy towers, restrained horn roofs, three crimson pennants, narrow ember windows, and one contained peak beacon.
3. Liberated keep: repaired blue-gray stone, open gate, deep-blue and aged-gold kingdom pennants, warm windows, green regrowth, and a modest gold beacon brazier.

Do not overwrite selected assets casually. Add versioned siblings, verify node readability and panel seams at runtime, then update `campaignMapArt.ts` and this record.
