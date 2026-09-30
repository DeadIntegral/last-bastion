# Chapter Two — Veil constructs

Five original code-authored vector portraits, 153 × 160 each, with transparent backgrounds. These enemy-only constructs intentionally use plate armor, hollow cores, and restrained violet/cyan light rather than recruitable troop stars. SVG files are both editable masters and runtime assets; no generated bitmap or external source was used.

- `voidSentinel.svg`: broad shield with a vertical void core.
- `riftArbalest.svg`: forked siege bow and crawler supports.
- `nullCantor.svg`: faceless hood with two resonating satellites.
- `duskExecutioner.svg`: heavy plate body and a large asymmetric axe.
- `veilRegent.svg`: empty crowned visor and ceremonial armored mantle.

`src/data/characterArt.ts` is the sole runtime mapping. Phaser rasterizes the SVGs once during preload and React displays the same files. Their combat and recruitment rules remain in `src/data/enemies.ts`; these portraits do not occupy or resize the existing recruitable atlases.
