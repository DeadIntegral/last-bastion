# Character roster atlases

The repository contains an original AI-generated core roster, correction sources, and an expandable second atlas:

- `roster-sheet.png`: 1225 × 1284 RGBA master output.
- `griffin-source.png`: 1280 × 1280 RGBA replacement source for the wide Griffin Rider.
- `orc-bulwark-source.png`: 1254 × 1254 RGBA replacement source with an uncovered green face and prominent tusks.
- `roster-atlas.png`: 612 × 640 RGBA runtime atlas, divided into sixteen exact 153 × 160 frames. The compact Griffin source replaces the original overflow-prone frame, and the adjacent Warden frame is cleaned during atlas preparation.
- `expansion-sources/`: transparent original sources for Goblin Archer, Goblin Bomber, Orc Berserker, and Orc Shaman.
- `expansion-atlas.png`: 612 × 640 RGBA runtime atlas using the same sixteen-frame geometry. Its first row is occupied and its remaining twelve frames are transparent.
- `yarn art:atlas`: deterministic local rebuild of the expansion runtime atlas from the four transparent sources. It alpha-crops and fits each source into the first row without changing the source art, while preserving transparent pixels in both occupied and unused cells.

Core frame order is left-to-right, top-to-bottom:

1. Militia, Guardian, Archer, Lancer
2. Raider, Bulwark, Royal Cavalry, Crossbow
3. Brute, Griffin Rider, Warden, Pyromancer
4. Huntress, empty, empty, empty

Expansion frame order is:

1. Goblin Archer, Goblin Bomber, Orc Berserker, Orc Shaman
2. empty, empty, empty, empty
3. empty, empty, empty, empty
4. empty, empty, empty, empty

`src/data/characterArt.ts` is the canonical sheet-and-frame mapping. React resolves CSS background images and positions from the same mapping, while Phaser loads every declared sheet as a spritesheet. Enemy troops reuse and horizontally flip the same faction-neutral art.

## Runtime attack motion

The current atlases contain one neutral pose per character. They are transparent PNGs, but the file extension does not contain skeletal joints or separable limbs. Phaser therefore keeps each portrait and combatant container stable and layers a spawn-time arm/weapon/effect rig over it. `src/game/combatMotion.ts` selects slash, thrust, shoot, cast, crush, or lunge from the canonical combat definition and samples the motion without allocating objects per strike. A future authored animation pass must add separated-part source files or multi-frame attack sheets; converting these same pixels to WebP, GIF, or another extension alone would not enable arm articulation.

## Generation record

- Mode: built-in image generation tool
- Use case: `stylized-concept`
- Generated: 2026-09-12

Final prompt:

> Create one original 4 × 4 transparent character sprite sheet for a low-fantasy side-view lane strategy game. Use exactly 13 occupied cells and leave the final three empty. Draw clean hand-painted 2D sprites with simple chibi proportions, crisp silhouettes, restrained detail readable at 48 px, subtle inked edges, full bodies facing right, identical baselines, generous padding, no overlap, no text, borders, logos, scenery, shadows, or watermark. Row 1: blue-banner militia, royal shield guardian, green-hood archer, gold lancer. Row 2: red raider, dark iron bulwark, blue-and-silver royal cavalry, crimson crossbow soldier. Row 3: red-brown brute, purple-gray griffin rider, blue-armored Warden Edric, ember-haired Pyromancer Selene. Row 4: green-cloaked Huntress Ria, then three empty cells. Use muted navy, slate, faded crimson, forest green, aged gold, and warm ivory highlights. Original designs only; avoid pixel art, photorealism, isometric or front-facing poses, action trails, cropped weapons, and duplicates.

Griffin correction prompt:

> Draw one original compact purple-gray Griffin Rider as a clean, hand-painted 2D low-fantasy game sprite on a genuinely transparent background. Show exactly one full-body winged griffin facing right with one armored rider. Keep the beak, folded wings, tail, talons, rider, and equipment comfortably inside a square with generous padding and a grounded baseline. Use simple chibi proportions, a crisp silhouette, restrained detail readable at 48 px, warm ivory head feathers, and aged-gold accents. No crop, neighboring characters, border, scenery, shadow, text, logo, watermark, pixel art, photorealism, front view, or isometric view.

Orc Bulwark correction prompt:

> Create one unmistakable Orc Iron Bulwark for a low-fantasy side-view lane strategy game. Draw exactly one full-body stocky orc facing right on a genuinely transparent background. Keep his olive-green face uncovered and make the broad square jaw, two large ivory lower tusks, amber eyes, flat nose, pointed ears, heavy brow, and black topknot immediately readable at 48 px. Use an open-faced dark-iron brow guard, battered rectangular tower shield with a faded crimson slash, short heavy cleaver, thick arms, and a hunched defensive pose. Match the clean hand-painted 2D chibi style, restrained detail, subtle inked edges, low baseline, and generous padding of the existing atlas. No enclosed helmet, hidden face, human skin, crop, text, border, scenery, shadow, logo, watermark, pixel art, photorealism, front view, or isometric view.

## Expansion generation record

- Mode: built-in image generation tool
- Use case: `stylized-concept`
- Generated: 2026-09-14
- Saved runtime atlas: `public/assets/characters/expansion-atlas.png`
- Saved editable sources: `public/assets/characters/expansion-sources/*.png`

The four final prompts shared this frame contract: one full-body character facing right on a genuinely transparent square canvas; polished hand-painted 2D chibi low-fantasy sprite; subtle inked edges; crisp silhouette readable at 48 px; low consistent baseline and generous padding; no crop, text, border, scenery, shadow, logo, watermark, extra figures, pixel art, photorealism, front view, or isometric view.

The 2026-09-16 alpha repair did not invoke a new generation prompt or alter these generated sources. The previous atlas assembly had flattened every alpha value to 255, producing black rectangles at runtime. `scripts/build-expansion-atlas.mjs` now rebuilds the sheet directly from the original RGBA pixels and refuses an output with no fully transparent pixels.

Goblin Archer final subject prompt:

> Create one small wiry green-skinned Goblin Poison Archer with oversized pointed ears, a sharp nose, mischievous yellow eyes, ragged forest-green hood, patched leather, short crooked wooden bow, and a tiny quiver of pale-green poisoned arrows. Use moss and olive skin, worn brown leather, muted yellow cloth, and compact toxic-green arrow tips. Keep the green goblin face and ears plainly visible; avoid human proportions, a face-covering helmet, or an oversized longbow.

Goblin Bomber final subject prompt:

> Create one short stocky green-skinned Goblin Bomber with oversized pointed ears, a broad grin, yellow eyes, battered brass goggles pushed onto his forehead, patched ochre leather, red utility sash, and one oversized soot-black round bomb with a compact lit fuse. Add a small bomb satchel and keep his face, goggles, and bomb immediately readable; avoid human proportions, a face-covering helmet, or floating extra bombs.

Orc Berserker final subject prompt:

> Create one muscular olive-green Orc Berserker with a broad uncovered jaw, two ivory lower tusks, pointed ears, heavy brow, fierce amber eyes, bare powerful arms, ragged dark-red war kilt, leather straps, sparse crude iron plates, and one chipped two-handed battle axe. Use an aggressive forward lean and keep him clearly less armored than the Orc Bulwark.

Orc Shaman final subject prompt:

> Create one lean elderly olive-green Orc Shaman with a long uncovered face, two ivory lower tusks, pointed ears, glowing pale-green eyes, braided gray-black topknot, moss-green and bone-white ritual cloth, bone charms, and small feathers. Give him one crooked staff crowned by a horned animal skull with a compact mint-green spirit flame, plus a small matching rune glow in his free hand; keep him visibly lightly armored.
