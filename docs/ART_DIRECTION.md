# Last Bastion Art Direction

Status: **Implemented baseline v1**  
Last updated: 2026-09-27

This is the production art contract shared by the opening, continent map, battle, characters, fortresses, effects, and React UI. It connects different media without forcing them into one rendering technique.

## 1. Core visual promise

Last Bastion is a weathered low-fantasy counteroffensive. The world feels damaged but reclaimable: cool desaturated occupation colors dominate, small areas of aged gold identify surviving hope, and restrained ember red identifies immediate enemy pressure.

- Opening: broad cinematic space, strongest light contrast, story-scale silhouettes.
- Map and facilities: simplified materials and compact information hierarchy.
- Battle: lowest background contrast and clearest silhouettes because units, warnings, HP bars, and commands own attention.
- Character art: hand-painted SD proportions with subtle inked edges and large readable equipment shapes.
- UI: dark navy glass and slate panels, thin weathered-gold accents, cyan information highlights, crimson destructive or enemy states.

No effect color may imply a damage type, status ailment, elemental resistance, or faction mechanic that does not exist in combat data.

## 2. Canonical palette

| Role | Color | Usage |
|---|---|---|
| Night navy | `#101824` | primary UI and battlefield shadow family |
| Deep charcoal | `#070B11` | modal/backdrop depth; never crush essential silhouettes into black |
| Slate blue | `#29364B` | distant occupied terrain and neutral structures |
| Mist cyan | `#8CCFDA` | information, allied readiness, non-damaging wind/magic clarity |
| Kingdom blue | `#244C73` | banners, shields, allied material identity |
| Weathered gold | `#DDBD70` | kingdom continuity, milestones, selected/high-value emphasis |
| Warm ivory | `#F2E8D2` | primary readable copy and controlled highlights |
| Occupation crimson | `#B64E55` | enemy banners, destructive decisions, hostile pressure |
| Ember orange | `#D87943` | fire and impact accents only, used sparingly |
| Healing dawn | `#C8E7B7` | healing feedback, paired with an upward/inward shape |

Backgrounds mostly use the first three families. Gold, crimson, cyan, and healing green remain scarce enough to preserve their gameplay meaning.

## 3. Shape and information hierarchy

1. Telegraphs and target areas are the highest-contrast battlefield shapes.
2. HP bars, Command state, and actionable controls come next.
3. Combatant and fortress silhouettes separate from the environment at runtime size.
4. Attack, guard, healing, and projectile effects clarify events rather than becoming persistent scenery.
5. Background landmarks establish place but do not intersect the lower combat lane with high-frequency edges.

On the continent map, occupation uses broken/dashed routes and crimson-edged region labels, the active front uses a warmer segmented route, and liberation uses continuous gold roads plus blue-and-gold flags and beacon shapes. The state remains readable without relying on hue alone.

Color is never the only state marker. Ownership also uses facing, HP bars, floor relationship, and banner language. Guarding, healing, danger, and readiness each require a distinct shape or motion.

## 4. Camera, perspective, and baseline

- Battle canvas: 1600 × 720, fixed side view, ground baseline Y 550.
- Battlefield backgrounds: 20:9 master composition. Keep the lower 27% mostly flat and low contrast, with no foreground subject that reads as a combatant.
- Keep the far-left and far-right fortress footprints clear. The background must not paint a second fortress behind a runtime fortress.
- Distant and middle layers may use atmospheric perspective; foreground objects must not obscure units or pointer placement.
- Character frames: current 153 × 160 cell contract with a shared low baseline. Weapons, wings, banners, and horns stay inside their cell.
- Fortress sprites: transparent side-view assets on one ground baseline; presentation size stays separate from collision and target X.

## 5. Light and material continuity

- The kingdom uses chipped blue-gray stone, worn deep-blue cloth, aged-gold trim, warm ivory highlights, and crown-and-tower heraldic shapes.
- Occupied and Demon Army structures use charcoal/burgundy masonry, dark iron, restrained horn geometry, crimson cloth, and ember windows.
- Goblin/orc/monster materials stay crude and readable rather than becoming saturated comic props.
- Spirits use a clear core and controlled translucency. Demons use dark mass plus one contained glow instead of all-over bloom.
- Light direction may vary by region, but a combatant's local value separation must survive horizontal flipping.

## 6. Runtime-size review board

Review assets at the sizes below before evaluating a zoomed master. These files are the current comparison set.

| Layer | Runtime review | Current reference |
|---|---:|---|
| Opening shot | responsive 16:9 viewport | [`opening-04-counteroffensive.webp`](../public/assets/opening/opening-04-counteroffensive.webp) |
| Battle background | 1600 × 720 | [`ruined-border.webp`](../public/assets/backgrounds/ruined-border.webp) |
| Campaign-map region | 1000-unit display panel / 1400 × 630 runtime art | [`western-frontier.webp`](../public/assets/campaign-map/western-frontier.webp) and four regional siblings |
| Fortress | 250 × 228 | [`player-fortress.png`](../public/assets/fortresses/player-fortress.png), [`enemy-fortress.png`](../public/assets/fortresses/enemy-fortress.png) |
| Character source cell | 153 × 160 | [`roster-atlas.png`](../public/assets/characters/roster-atlas.png) |
| Common battlefield body | roughly 48–100 px tall by authored size | inspect in battle at 1× and 1.5× |
| Transcendent art | 1.9× art scale, unchanged collision | inspect beside an ordinary body and its HP bar |
| Command/HUD icon | 16–24 px | inspect in KO/EN/JA at desktop and 390 px width |

Every new battle asset is checked at desktop 1600×720, a horizontally constrained mobile viewport, 1× and 1.5× battle speed, and with both factions overlapping near a fortress.

## 7. Asset decisions

### Preserve

- The four approved opening WebP shots and their generation records.
- The seven transparent character atlases and shared player/enemy mapping.
- The transparent kingdom and occupied-fortress masters/runtime sprites.
- Existing pooled projectile, guard, ground-warning, and strike systems until a replacement meets the same performance contract.

### Revise selectively

- Similar small silhouettes such as Archer/Huntress and Guardian/Warden only after actual-size overlap review.
- Multi-creature Direwolf and Slime deployment frames if one runtime body visually reads as multiple independently targetable bodies.
- Fortress damage and destruction through reusable overlays before commissioning complete replacement structures.

### Create

- Five campaign-region battle environments and composed challenge landmarks.
- The five continent-map region panels are complete; future map work should refine transitions or liberation motion rather than return to abstract CSS terrain.
- Five distinct campaign-beast silhouettes and authored warning/death poses.
- True multi-frame or separated-part motion assets for the representative animation pilot.
- A coherent small icon family for economy, command, roles, research, and liberation.

## 8. Effects and motion

- Slash: directional arc; thrust: narrow forward impact; shield: forward metal spark/wake; heavy strike: low dust; heal: upward converging light.
- Impact visuals land on the actual damage/heal frame. Animation never owns simulation timing.
- General attacks do not use global screen shake or hit-stop.
- High-frequency effects stay pooled and bounded. If a cosmetic pool is exhausted, damage still resolves and essential warnings retain priority.
- `prefers-reduced-motion` and future low-effects settings may reduce decoration but never hide danger areas, target confirmation, or command readiness.

## 9. Delivery checklist

- Original project-owned design; no recognizable franchise asset or copied composition.
- Source and optimized runtime asset retained with generation/edit record.
- Path, dimensions, format, alpha expectations, baseline, display size, and file budget documented.
- No embedded text, watermark, black matte, neighboring-cell contamination, or cropped weapon/wing.
- Tested with allied and enemy facing, fortress overlap, health bars, warnings, KO/EN/JA UI, mobile, and reduced motion where applicable.
- Visual-only work does not alter HP, damage, range, collision, movement domain, cadence, rewards, or unlock rules.
