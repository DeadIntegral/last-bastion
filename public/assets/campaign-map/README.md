# Illustrated campaign map assets

The current map uses one continuous continent painting with organic discovery masks. The five earlier region panels and Veil frontier painting remain archived source/runtime assets; they are no longer composited as separate map tiles.

## Runtime contract

### Unified continent — 2026-09-30

- Source: `continent-master-v1.png`, original built-in imagegen output, 1341 × 1173 RGB (2048 × 1792 requested; actual returned dimensions retained unchanged).
- Runtime: `continent-v1.webp`, optimized with `cwebp -q 85 -m 6`. The sole live terrain image is stretched to the canonical 2,800 × 2,400 world.
- One continuous painted landmass replaces the five-region/Veil compositing layout. `ContinentTerrain.tsx` uses soft organic SVG masks for discovered geography and a subtle cleared-region tint; stage/node/label layers remain separate.
- Generation prompt: original dark-fantasy cartographic continent, high near-top-down oblique view, no horizon/sky, consistent terrain scale and one continuous coastline/watershed/mountain system. Last refuge at the southwest coastal tip, western-central fertile occupied plains, central-eastern ochre basalt highlands, northeastern snowy upland, north-central violet-black blight, far northeastern mistbound highlands. Natural transitions rather than biome panels; muted slate/olive/ochre/frost palette, painterly texture, small dispersed ruins and open objective clearings. No grid, seams, separate biome islands, text, labels, UI, objective castles, armies, compass, painted node routes, parchment or floating island.

### Archived regional assets

- Runtime panels: five 1400 × 630 lossy WebP files, quality 82, approximately 167–204 KB each.
- Sources: five 1870 × 841 RGB PNG masters under `sources/`.
- Runtime owner: `src/data/campaignMapArt.ts` defines order, names, six-stage ranges, image paths, two-dimensional region rectangles, node placement, marker art, and rift themes.
- Cartographic labels: `campaignMapLandmarks` retains ten milestone-gated place names. Old geometric mountains/trees are no longer rendered; the continuous painting supplies terrain. Farm, treasure, rift and monument positions are authored individually.
- Current presentation: one 2,800 × 2,400 continent image, a southwest coastal starting point, northward authored reconquest paths, and soft geographic discovery masks. The viewport is cropped to discovered bounds with a translated global-coordinate content layer. Old panel rectangles/edge masks are no longer rendered.
- Node art: three dedicated 320 × 320 transparent PNG markers distinguish occupied outposts, boss citadels, and liberated keeps. PNG is retained for these small overlays to avoid the pale square compositing artifact seen around cleared boss markers; they do not reuse side-view battle-fortress images.
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

## Veil frontier extension — 2026-09-30

- Source: `veil-frontier-master-v1.png`, 1536 × 1024 RGB, original built-in imagegen generation.
- Runtime: `veil-frontier-v1.webp`, encoded with `cwebp -q 85 -m 6`; canonical path/rectangle in `campaignMapArt.ts`.
- Display: 1100 × 760 region beyond Chapter 1's final fortress, under separately interactive nodes and a connected road. No baked labels, objective castles, or UI. Prior five regional masters/runtime assets remain intact.
- Use case: `stylized-concept`. Prompt: original terrain-only dark-fantasy campaign map, high oblique bird's-eye cartographic view, hand-painted realistic medieval fantasy environment; mistbound eastern frontier with blue-gray basalt ridges, dead silver forest, ruined aqueduct fragments, slate marshes, winding rocky lowlands, restrained violet fissures and an upper-right black rocky hill. Dense coherent terrain, moderate detail, subdued cool palette, soft fog at edges, open lowland clearings for runtime fortress markers. No sky/horizon, text, labels, UI, markers, dotted roads, characters, compass, borders, floating island, or objective-like castles.

## Campaign-map fortress markers

- Runtime: `markers/occupied-outpost.png`, `markers/boss-citadel.png`, and `markers/liberated-keep.png`, each 320 × 320 with real alpha and a versioned runtime URL.
- Sources: matching 1254 × 1254 RGBA PNG masters under `markers/sources/`.
- Generated with the built-in image generation tool on 2026-09-27 and optimized with `cwebp -q 88 -alpha_q 100 -m 6 -resize 320 320`.

Shared final prompt contract:

> Create exactly one complete transparent campaign-map fortress miniature for an original low-fantasy strategy game. Use a premium hand-painted 2D cartographic style, crisp silhouette at 56–96 px, restrained detail, slight oblique top-down view matching the map, compact rocky foundation, generous transparent padding, and a gate facing lower-left. No landscape backdrop, rectangle, frame, UI, text, node badge, characters, creatures, extra castles, watermark, crop, side-view battle composition, photorealism, or 3D render.

Variants:

1. Occupied outpost: squat charcoal stone, one central tower, short wall, dark iron, muted crimson pennants, and subtle ember windows.
2. Boss citadel: a larger black-stone regional citadel with tall central keep, two heavy towers, restrained horn roofs, three crimson pennants, narrow ember windows, and one contained peak beacon.
3. Liberated keep: repaired blue-gray stone, open gate, deep-blue and aged-gold kingdom pennants, warm windows, green regrowth, and a modest gold beacon brazier.

Do not overwrite selected assets casually. Add versioned siblings, verify node readability and panel seams at runtime, then update `campaignMapArt.ts` and this record.

## Illustrated destinations — 2026-09-30

All seven revealed challenge markers now reuse the exact boss portrait selected by each stage's `bossUnitId` through `CharacterSprite`/`characterArt.ts`. The existing character atlases were not regenerated or remapped. A faint terrain-specific rift remains behind each silhouette; cleared encounters use a check badge. Guardian portraits likewise render without the former circular opaque backplate. The Last Bastion and liberation beacons reuse the existing kingdom keep PNG. Existing monument SVG illustrations remain intact.

Five new utility-marker assets use original 1254 × 1254 RGBA masters in `markers/sources/` and matching 320 × 320 RGBA runtime PNGs in `markers/`. Generated with the built-in imagegen tool (`stylized-concept`), then resized using `sips -Z 320`. Source and runtime alpha channels were checked for both fully transparent and opaque pixels. No black/white matte is added. Canonical paths live in `mapLocationArt`; farm presentation data selects its own image, while the existing claimed flag selects closed/open chest art.

Shared prompt: one original isolated oblique three-quarter campaign-map miniature, premium hand-painted dark-fantasy style matching the map's fortress art, a chunky silhouette readable at 80–100 px, muted wood/slate/aged-metal colors, full subject within a square canvas and real transparent padding. No rectangular tile, circular badge, scenic backdrop, text, numbers, UI, border, watermark, recognizable franchise design or black/white/checkerboard background.

- `supply-caravan-v1.png`: blue-canvas timber wagon, brass fittings, coin sacks, compact reinforced coffer and small kingdom pennant on a minimal irregular rocky patch. Gold supply mission 301.
- `royal-training-yard-v1.png`: wooden sparring enclosure with straw dummies, spear/shield rack, blue supply awning and kingdom pennant, on irregular earth. Mastery training mission 302.
- `remnant-camp-v1.png`: charcoal/crimson military tents, small rough watch platform, spiked palisade fragments, ember brazier and torn red pennant; no people. Free expedition 303, repositioned to `(180, 800)` to clear the capital treasure marker.
- `treasure-closed-v1.png`: closed squat dark-oak royal coffer, two broad aged-gold bands, clear lock plate and blue inset; front/right three-quarter view, restrained warm seam glint, no ground patch or detached coins.
- `treasure-open-v1.png`: imagegen edit of the closed master, retaining its materials, body and perspective while raising the lid to expose an empty wooden interior and removing the glow. No loot, sparkle or added objects. Claimed chest state.
