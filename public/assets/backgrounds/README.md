# Battlefield background assets

The regional-background pipeline is currently **Partial**. The western `ruined-border` campaign terrain is the first completed pilot; every other campaign region and challenge intentionally retains the procedural fallback until its own reviewed asset ships.

## Ruined Border pilot

- Runtime: `ruined-border.webp`, 1600 × 720, lossy WebP quality 84, approximately 127 KB.
- Source: `sources/ruined-border-source.png`, 1870 × 841 RGB generation master.
- Runtime owner: `src/data/backgroundArt.ts`, keyed by `terrain.id`.
- Display: exact 1600 × 720 battlefield canvas; no crop or camera motion.
- Gameplay: visual-only. Terrain multipliers, fortress distance, unit positions, collision, targeting, and danger areas are unchanged.
- Generation mode: built-in image generation tool.
- Use case: `stylized-concept`.
- Generated: 2026-09-27.
- Style reference: `public/assets/opening/opening-04-counteroffensive.webp`; style and palette only, not an edit target.
- Optimization: `cwebp -q 84 -m 6 -resize 1600 720`.

Final prompt:

> Use case: stylized-concept. Asset type: ultra-wide battlefield background for a 2D side-view lane strategy game, displayed at 1600 × 720 (20:9). Input image: style reference only for painterly low-fantasy atmosphere, restrained antique-gold highlights, charcoal navy palette, and layered depth; do not copy its composition or objects. Primary request: create the ruined western frontier battlefield, the first region reclaimed from the Demon Army. Scene/backdrop: desolate kingdom borderland after invasion; smoke-thinned predawn sky, far low mountains, middle-distance burned farm roofs, one broken watchtower and collapsed stone boundary wall, sparse dead trees, distant weak beacon fires, torn unmarked cloth strips moving in the wind. Style/medium: original premium hand-painted 2D low-fantasy matte painting, coherent with the reference but lower contrast and less detailed so small game sprites stay readable. Composition/framing: strict ultra-wide 20:9 side-view panorama; layered sky, distant landscape and middle ground; reserve the bottom 27 percent as a mostly flat dark traversable dirt-and-stone battle lane with only subtle texture; keep both far left and far right edges free of tall structures because fortress sprites will be overlaid there; strongest landmark detail stays behind the upper middle third. Lighting/mood: cold blue-gray dawn with faint weathered-gold light on the horizon, somber but not pitch black. Color palette: desaturated charcoal navy, slate, ash brown, muted smoke gray, very restrained ember red and antique gold. Constraints: no characters, armies, creatures, castles, fortresses, UI, text, letters, logos, frames, emblems, weapons in foreground, bright magic, large foreground debris, opaque vignette, watermark; no essential object may overlap the lower lane; danger telegraphs and health bars must remain readable over the image. Avoid: photorealism, 3D render, isometric perspective, close-up subject, high-frequency detail, saturated colors, black crush, copied landmarks from the reference.

Do not overwrite the selected source or runtime image casually. Add a versioned sibling, compare it at runtime size with units, fortresses, and warnings, then update `src/data/backgroundArt.ts` and this record when replacing it.
