# Character roster atlases

The repository contains an original AI-generated full playable roster, correction sources, and seven runtime atlases:

- `roster-sheet.png`: 1225 × 1284 RGBA master output.
- `griffin-source.png`: 1280 × 1280 RGBA replacement source for the wide Griffin Rider.
- `orc-bulwark-source.png`: 1254 × 1254 RGBA replacement source with an uncovered green face and prominent tusks.
- `roster-atlas.png`: 612 × 640 RGBA runtime atlas, divided into sixteen exact 153 × 160 frames. The compact Griffin source replaces the original overflow-prone frame, and the adjacent Warden frame is cleaned during atlas preparation.
- `expansion-sources/`: transparent original sources for Goblin Archer, Goblin Bomber, Orc Berserker, and Orc Shaman.
- `expansion-atlas.png`: 612 × 640 RGBA runtime atlas using the same sixteen-frame geometry. Its first row is occupied and its remaining twelve frames are transparent.
- `regional-source.png`, `elemental-source.png`, and `demon-source.png`: transparent 4 × 4 generation masters for the remaining thirty-six troops plus Mirena and Bran.
- `regional-atlas.png`, `elemental-atlas.png`, and `demon-atlas.png`: 612 × 640 RGBA runtime atlases containing the remaining playable roster.
- `dragon-source.png`: 1254 × 1254 RGBA standalone source for Ancient Sky Dragon.
- `transcendent-atlas.png`: 612 × 640 RGBA runtime atlas with Ancient Sky Dragon in frame 0 and fifteen transparent cells.
- `hero-sources/karuk-source.png` and `hero-sources/neris-source.png`: standalone RGBA sources for the non-human heroes.
- `alliance-atlas.png`: 612 × 640 RGBA runtime atlas with Karuk and Neris in frames 0–1 and fourteen transparent cells.
- `yarn art:atlas`: deterministic local rebuild of all six non-core runtime atlases. It detects real transparent gutters in generated source grids, isolates each subject, alpha-crops it into a fixed frame, and preserves transparency in occupied and unused cells.

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

Regional frame order is:

1. Swordsman, Pikeman, Scout, Priest
2. Mage, Archmage, Assassin, Troll
3. Ogre Mage, Wolf Rider, Harpy, Minotaur
4. Wyvern, Slime deployment, Basilisk, Direwolf deployment

Elemental frame order is:

1. Storm Spirit, Fire Spirit, Ice Spirit, Earth Spirit
2. Light Spirit, Dark Spirit, Giant Eagle, Treant
3. Golem, Hydra, Hellhound, Saint Mirena
4. empty, empty, empty, empty

Demon frame order is:

1. Imp, Succubus, Demon Guard, Demon Mage
2. Gargoyle, Cerberus, Ifrit, Reaper
3. Abyss Knight, Marshal Bran, empty, empty
4. empty, empty, empty, empty

Transcendent frame order is:

1. Ancient Sky Dragon, empty, empty, empty
2. empty, empty, empty, empty
3. empty, empty, empty, empty
4. empty, empty, empty, empty

Alliance frame order is:

1. Orc Champion Karuk, Wind Spirit Neris, empty, empty
2. empty, empty, empty, empty
3. empty, empty, empty, empty
4. empty, empty, empty, empty

`src/data/characterArt.ts` is the canonical sheet-and-frame mapping. React resolves CSS background images and positions from the same mapping, while Phaser loads every declared sheet as a spritesheet. Enemy troops reuse and horizontally flip the same faction-neutral art.

## Runtime attack motion

The current seven atlases contain one neutral pose per character. They are transparent PNGs, but the file extension does not contain skeletal joints or separable limbs. Phaser therefore keeps each portrait and combatant container stable and layers a spawn-time arm/weapon/effect rig over it. `src/game/combatMotion.ts` selects slash, thrust, shoot, cast, crush, or lunge from the canonical combat definition and samples the motion without allocating objects per strike. Canonical 5-star transcendent troops render their portrait at 1.9× the ordinary battle-art scale while leaving collision and combat geometry unchanged. A future authored animation pass must add separated-part source files or multi-frame attack sheets; converting these same pixels to WebP, GIF, or another extension alone would not enable arm articulation.

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

## Full-roster generation record

- Mode: built-in image generation tool
- Use case: `stylized-concept`
- Generated: 2026-09-18
- Style reference: `roster-atlas.png`; reference only, with no existing character copied
- Saved editable sources: `regional-source.png`, `elemental-source.png`, `demon-source.png`
- Saved runtime atlases: `regional-atlas.png`, `elemental-atlas.png`, `demon-atlas.png`

All three final prompts shared this contract:

> Create new original full-body fantasy game sprites in a strict four-column by four-row grid, one subject centered in each specified equal cell, all facing right. Use a genuine transparent square canvas, identical low baselines, generous padding, no overlap, no visible grid, and completely transparent unused cells. Match the reference's polished hand-painted 2D chibi proportions, subtle inked edges, restrained detail, and crisp silhouettes readable at 48 px. Keep every wing, head, banner, and weapon inside its own cell. No text, labels, border, scenery, floor, cast shadow, logo, watermark, duplicates, cropped limbs, black background, pixel art, photorealism, front view, or isometric view.

Regional final subject prompt:

> Row 1: blue kingdom swordsman with sword; gold-accented long-pike soldier; green-cloaked frontier scout with shortbow; ivory-and-gold battlefield priest with healing staff. Row 2: violet kingdom mage with wand and spellbook; imposing deep-violet archmage with tall staff; charcoal hooded shadow assassin with twin daggers; huge moss-green troll with stone club. Row 3: broad ochre ogre mage with rune staff; small green goblin riding one gray wolf; purple-feathered harpy; muscular brown minotaur with two horns and heavy axe. Row 4: compact purple wyvern with folded wings; three small acid-green slimes grouped as one deployment silhouette; olive basilisk lizard with venomous gaze; two lean charcoal direwolves grouped as one deployment silhouette.

Elemental final subject prompt:

> Row 1: blue-white flying storm elemental with a compact lightning core; orange-red flying fire elemental; pale-blue crystalline flying frost elemental; massive brown stone-and-earth elemental with mossy armor. Row 2: radiant ivory-gold flying light spirit; smoky dark-violet flying shadow spirit; one majestic golden-brown giant eagle with folded wings; ancient walking treant with a wooden face and branch arms. Row 3: towering slate rune golem with glowing blue runes; squat green three-headed swamp hydra; black-and-crimson hellhound with ember cracks; Saint Mirena, a human dawn healer in ivory-and-gold robes holding a sun-topped healing staff. Row 4 remains empty.

Demon final subject prompt:

> Row 1: tiny crimson winged imp with a forked spear; elegant burgundy succubus with folded bat wings and a compact magic focus; broad armored demon guard with horned shield; robed violet abyss mage with a crooked staff and purple flame. Row 2: gray stone gargoyle with folded wings; massive black-red three-headed cerberus; towering flying Ifrit formed from crimson flame with gold armor; hooded soul reaper with a compact curved scythe. Row 3 columns 1–2: imposing black-violet abyss knight with full plate and greatsword; Bran the human liberation marshal in blue-and-crimson commander armor carrying a rally banner and one-handed sword. Remaining cells stay empty.

## Ancient Sky Dragon generation record

- Mode: built-in image generation tool
- Use case: `stylized-concept`
- Generated: 2026-09-18
- Style reference: `demon-atlas.png`; visual language only, with no character copied
- Saved editable source: `dragon-source.png`
- Saved runtime atlas: `transcendent-atlas.png`

Final prompt:

> Create one original full-body massive ancient sky dragon facing right on a genuinely transparent square canvas for a side-view low-fantasy lane-strategy game. Use dark midnight-blue scales, broad crimson wing membranes, aged-gold horns and chest armor, and a compact cyan glow in the throat suggesting magic breath. Match the project's polished hand-painted 2D chibi proportions, subtle inked edges, restrained detail, and crisp silhouette, while making the creature feel much larger and more imposing than ordinary troops. Keep exactly one dragon and every wing, horn, claw, and tail inside the canvas with generous padding and a low consistent baseline. No rider, extra creatures, scenery, floor, cast shadow, text, border, logo, watermark, black background, pixel art, photorealism, front view, or isometric view.

## Alliance hero generation record

- Mode: built-in image generation tool
- Use case: `transparent-background`
- Generated: 2026-09-18
- Saved editable sources: `hero-sources/karuk-source.png`, `hero-sources/neris-source.png`
- Saved runtime atlas: `alliance-atlas.png`

Karuk final prompt:

> Create one original full-body male Orc hero facing right for a side-view low-fantasy lane-strategy game. Give him unmistakable olive-green skin, large ivory lower tusks, pointed ears, a black topknot, heavy bronze-and-crimson clan armor, a massive one-handed war axe, broken chains, and a small blue liberation ribbon. Match the project's hand-painted 2D chibi proportions, crisp readable silhouette, subtle inked edges, and generous padding on a genuinely transparent background. No scenery, floor, cast shadow, text, logo, watermark, extra figures, crop, pixel art, photorealism, front view, or isometric view.

Neris final prompt and transparency extraction:

> Create one original full-body female Wind Spirit hero facing right for a side-view low-fantasy lane-strategy game. Make her clearly non-human: a translucent cyan body fading into curling air instead of feet, luminous pale eyes, floating teal-and-silver armor pieces, ribbon-like wind currents, and a crescent crystal staff. Match the project's hand-painted 2D chibi proportions, crisp readable silhouette, subtle inked edges, and generous padding on a genuinely transparent background. No scenery, rectangle, floor, cast shadow, text, logo, watermark, extra figures, crop, pixel art, photorealism, front view, or isometric view. Preserve the character and isolate the surrounding wind glow into RGBA transparency for atlas use.
