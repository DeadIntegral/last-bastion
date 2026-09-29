# Last Bastion — Module and Dependency Map

Last updated: 2026-09-29

This document routes implementation work to the smallest owning context. It describes current code, not planned gameplay. Read it before a change crosses more than one source layer or moves responsibilities between files.

## Dependency direction

```text
src/types
   ↓
src/data ───────────────→ src/store
   ↓                         ↓
src/game pure rules      React screen modules
   ↓                         ↓
Phaser BattleScene       App navigation/shell
```

- Dependencies point downward. Data must not import React, Phaser, or the store.
- Pure combat modules may import types and data, but never React components or Zustand actions.
- `BattleScene` consumes canonical data and pure decisions, then owns live Phaser entities, pools, timers, and scene events.
- Screen modules consume canonical data, pure presentation helpers, and store selectors/actions. They never reproduce combat stats or persistence rules.
- `App.tsx` owns navigation, shared shell composition, and the screens not yet extracted. It must not regain an extracted screen's local state or markup.

## Current ownership

| Context | Owner | May depend on | Must not own |
|---|---|---|---|
| Troop/hero/stage/castle content | `src/data/*` | `src/types` | React state, Phaser objects |
| Persistent campaign progression | `src/store/useGameStore.ts` | data, pure rules | screen layout, Phaser rendering |
| Damage, ranges, upgrades, labels | `src/game/rules.ts` | types, data | live entities |
| Line traversal and area targeting | `src/game/combatTargeting.ts` | types | Phaser containers, UI |
| Attack rig/projectile style choice | `src/game/combatMotion.ts` | canonical definition metadata | damage or target selection |
| Live battle orchestration | `src/game/BattleScene.ts` | data, pure game modules, audio | persistent campaign mutation |
| Battle HUD/input bridge | `src/components/BattleView.tsx` | event bus, store selectors | battle simulation |
| Armory context | `src/components/Armory.tsx` | data, pure rules, store actions | routing, duplicated stats |
| Shared progression stat/equipment presentation | `src/components/ProgressionUi.tsx` | types only | store access, screen state |
| Shared rounded React actions/filters | `src/components/GameButton.tsx` + `src/styles/components.css` | native button attributes, base tokens | screen state, gameplay rules |
| App navigation and shared shell | `src/App.tsx` | screen components, store | extracted screen internals |
| Localization | `src/shared/i18n/*` | message resources | gameplay branching |
| Global tokens/reset/shared primitives | `src/styles/base.css` | none | feature-specific layout |
| Reusable React controls | `src/styles/components.css` | base tokens | feature-specific layout |
| Title/archive/modal/opening | `src/styles/menu.css` | base tokens | map, progression, battle rules |
| Shared panels/stages/continent map | `src/styles/map.css` | base tokens | armory or battle internals |
| Armory presentation | `src/styles/armory.css` | base tokens | other progression screens |
| Hero/monument/merchant/fortress/achievement/codex | `src/styles/progression.css` | base tokens | battle rendering |
| Battle HUD/results | `src/styles/battle.css` | base tokens | Phaser simulation |
| Cross-context readability and breakpoints | `src/styles/responsive.css` | all preceding style contexts | base feature definitions |

`Armory.tsx` currently owns faction filters, focused/all-card mode, compact selection, sticky detail, recruitment, formation, and troop equipment. `App.tsx` injects the shared header and only chooses when the screen is mounted.

`src/main.tsx` is the CSS manifest. It imports `base → components → menu → map → armory → progression → battle → responsive`; preserve this order so feature styles can specialize shared controls and the final responsive/readability layer can override feature defaults without specificity escalation. Do not recreate a root `styles.css` or import one feature stylesheet from an unrelated component.

## Change routing

- New or revised combatant: `types` only if schema changes → `data/units` → codex/mastery/art/acquisition data → focused rules/data tests → balance/spec docs.
- Combat capability: canonical field in `types`/`data` → pure resolution in `rules` or `combatTargeting` → difficulty valuation → Phaser consumes the result → disclosure/localization.
- Attack appearance: canonical presentation field when needed → `combatMotion` style selection → reusable BattleScene pool. Presentation must not decide hits.
- Screen layout or interaction: owning component only. Touch `App.tsx` only to add/remove navigation or inject shared shell content.
- CSS: edit the owning context stylesheet and place breakpoint-only overrides in `responsive.css`. Shared variables/reset belong only in `base.css`; do not add feature selectors there.
- Save behavior: store normalization/action → slot/crypto boundary if relevant → compatibility test → schema/version docs only when persisted shape changes.
- Numeric balance: data/rule → focused test → `yarn balance` → `docs/BALANCE.md`.

## Extraction policy

- Extract around a complete player or engine context, not around arbitrary line counts.
- Prefer one public component or service entry point and keep internal helpers private to its module.
- Pass shared shell content or callbacks inward instead of importing the root App from a child; circular dependencies are forbidden.
- Do not move canonical values into a component merely to make extraction easier.
- Keep a large orchestrator when it genuinely coordinates the lifecycle, but move independently testable decisions and independently editable presentation pools out over time.
- REV-11 remains Partial: Armory is extracted; other progression screens and BattleScene effect-lifetime contexts are candidates only when related work touches them.

## Verification scope

- During implementation, run the focused owning tests first.
- At handoff, run lint, the full normal test suite, applicable balance audits, and build once.
- A file move needs one representative navigation/integration test and type/build verification; do not duplicate every behavior test in the new module.
