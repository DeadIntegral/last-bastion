# Last Bastion — Future Systems Specification

Last updated: 2026-09-30

This document is the canonical backlog for game systems that have been designed but are not yet implemented. Everything in this file is **Planned** unless a section explicitly says otherwise. Implemented behavior belongs in `docs/GAME_SPEC.md`, while final numeric values belong in `docs/BALANCE.md`.

## 1. Status and implementation contract

- `Planned`: design direction only; the current game must not advertise or depend on it.
- `Partial`: some production code exists, but the whole acceptance checklist is not complete.
- `Implemented`: code, content, persistence if needed, UI disclosure, tests, balance audit, and documentation have all shipped. Move the authoritative description to `docs/GAME_SPEC.md` and leave only a short completion link here.
- A future system must remain data-driven and faction-neutral. Player and computer units use the same tags, attack patterns, and counter rules.
- Proposed names and values in this file may be refined during implementation. A balance-affecting implementation must update `docs/BALANCE.md` and pass `yarn balance` rather than copying placeholders blindly.

## 2. Front-line protection and non-linear magic

Status: **Implemented**.

This system shipped on 2026-09-18 with faction-neutral `guardProtection`, deterministic pierce interception, directional rear-range attenuation, pooled guard feedback, cluster-aware warned ground bursts, flying-domain rules, UI disclosure, compact pure regression coverage, and difficulty valuation. Authoritative current behavior is in `docs/GAME_SPEC.md` sections 3–4 and exact combat values are in `docs/BALANCE.md` section 2.

## 3. Fifth fortress research branch

Status: **Implemented**.

`원정 전술` shipped as the fifth fortress branch on 2026-09-16. It includes staged rally control for 1–4-star soldiers, heroes, and canonical 5-star transcendent troops; hero active/respawn timing research; and regeneration research for the fixed-price wartime mobilization ability. The authoritative behavior is in `docs/GAME_SPEC.md` section 8 and all numeric values are in `docs/BALANCE.md` section 5.

## 4. Quick Starter commerce bundle

Status: **Planned**.

- The intended bundle grants a data-driven amount of Royal Gems plus the existing permanent `battleSpeedUnlocked` entitlement and exactly one increment of `formationSlotPurchases`. It must reuse those fields rather than creating paid-only speed or formation mechanics.
- A verified purchase may grant battle speed (already available from the start) and bypass the stage-12 gate for the first expansion. Entitlement application is idempotent, so buying the bundle after earning either benefit cannot duplicate 1.5× speed or grant more than the first expansion; slots six and seven continue to require their normal sequential licenses.
- The final Gem quantity, regional price, refund behavior, platform integration, and handling for players who already own an entitlement remain undecided.
- Payment confirmation must come from a trusted server or platform receipt. Client-side flags, imported saves, inferred purchase state, and local-storage edits must never be treated as proof of payment.
- Accounts, payment UI, recharge, advertising, and server persistence remain unimplemented. Do not advertise the bundle inside the current game until the complete purchase and restoration flow exists.

## 5. Future-system entry template

Every later proposal added to this file should include:

1. `Status` with `Planned`, `Partial`, or `Implemented`.
2. Player-facing goal and counterplay.
3. Canonical structured-data ownership.
4. Symmetry rules for player and computer forces.
5. Persistence and backward-compatibility impact.
6. UI, accessibility, art, audio, and performance requirements.
7. Difficulty-estimator and balance implications.
8. Testable acceptance criteria.

## 5A. Transcendent-hunt formation synergies

Status: **Planned**. The current battle does not yet grant recipe bonuses, break stacks, or combo finishers. Existing guard, healer, anti-large, lobbed, pierce, ground-burst, hero-aura, and rally behavior remains authoritative until every acceptance item below ships.

Player-facing goal and counterplay:

- Let a well-built 1–4-star formation contest one transcendent enemy through complementary roles rather than requiring its own 5-star body or a larger low-tier swarm.
- Keep individual troop identity readable. A recipe activates from canonical capabilities, not exact unit IDs, so Guardian + Priest + Archer and Orc Bulwark + Saint + Goblin Bomber can express related plans without becoming identical.
- Limit a formation to two active synergy doctrines selected before battle. Meeting every tag combination must not stack an unbounded number of passive bonuses.
- Proposed doctrines are `수호 순환` (guard + healer: guarded frontliners receive stronger incoming healing and a bounded emergency shield), `마수 사냥대` (anti-large + lobbed/backline attacker: distinct qualifying hits build short-lived armor-break stacks on large targets), and `마력 균열진` (ground-burst + straight pierce/directional attack: a warned ground hit opens a short window in which direct attacks partially ignore defense). Final values require simulation and UI testing.
- Bosses and 5-star bodies retain control resistance and do not become permanently stun-locked. Break stacks expire, have a hard cap, and may expose defense or trigger one short stagger window, never scale maximum HP damage without a separate explicit balance review.

Canonical ownership and symmetry:

- Add recipe definitions under `src/data`, using existing `tags`, `attackPattern`, `guardProtection`, `rangedTargeting`, and healing capability rather than duplicate role flags where possible.
- Resolve qualifying hits and expiring target state in pure helpers. Player and computer formations use the same eligibility and combat math; encounter-only immunity or thresholds must be explicit boss metadata and included in the estimator.
- Doctrine selection is battle-loadout state. If selection later persists, old/imported saves default to no selected doctrines and normalize unknown recipe IDs; the initial implementation should prefer no new save field.

UI, accessibility, art, audio, and performance:

- The armory formation strip previews available recipes and explains the missing role for inactive recipes. Battle HUD shows at most two compact doctrine indicators plus a visible capped break meter on the affected large target.
- Color is never the only state cue. Every proc has localized KO/EN/JA text, an icon/shape distinction, reduced-motion behavior, and pooled visual/audio feedback.
- No per-frame full-roster recipe scans, object allocation, tween creation, or unbounded per-target map growth. Re-evaluate formation recipes only when the loadout changes or a battle starts; update expiring combat state alongside existing bounded unit timers.

Difficulty and acceptance criteria:

1. Add estimator coefficients for uptime-limited healing amplification, defense exposure, and any stagger opportunity cost; run campaign, challenge, and unit-efficiency audits.
2. Prove with deterministic simulations that at least three materially different 1–4-star formations can defeat a benchmark transcendent target at comparable total Gold/Command investment, while a random same-cost formation remains meaningfully weaker.
3. Ensure no single recipe is mandatory for all seven challenge bosses and no two-recipe pair can permanently suppress a boss.
4. Add focused pure tests for recipe activation, two-doctrine cap, stack cap/expiry, symmetry, flying-domain behavior, guard interaction, and save normalization if persistence is introduced.
5. Move shipped rules and exact values into `GAME_SPEC.md` and `BALANCE.md`; do not mark this section Implemented for UI-only recipe badges.

## 5B. Formation-slot and fortress items

Owned-only inventory and ready-only crafting are **Implemented**. Unavailable item/recipe previews were removed from the operational vault; a separate optional Item Reference in the Codex holds the complete catalogue, effects, acquisition thresholds and recipes. Both UI and store use the same crafting predicate. Item reference entries do not affect combatant discovery counts or achievements.

Status: **Implemented**. Authoritative behavior and exact values now live in `docs/GAME_SPEC.md` and `docs/BALANCE.md`.

- Six repeatable battle-drop materials and four stronger crafted items ship through `src/data/items.ts`, with region pools, encounter-type chances, and recipes unlocked at stages 12/18/30.
- Schema 8 persists bounded inventory counts, fixed nullable formation-item slots matching formation capacity, and exactly two fortress slots. Hydration removes invalid, over-inventory, unowned, or wrong-target assignments and does not retain the superseded schema-7 milestone grants.
- `ItemVault` provides inventory quantities, drag/drop, select-then-slot fallback, per-slot removal, recipe requirements, equipped-material protection, and target validation. Formation items remain bound to numbered positions when troops move.
- Duplicate-copy equipment is **Implemented**: each owned copy can occupy a compatible slot, including two matching fortress items. Hydration keeps copies up to inventory count; assignment never silently relocates an exhausted copy and crafting protects every equipped copy.
- `applyFormationItem` and `applyFortressItems` integrate base and crafted HP, attack/healing, cooldown, fortress HP, Command, and artillery effects into player battle values only. Every crafted item preserves both ingredient roles in one slot and exceeds each ingredient's matching values.
- KO/EN/JA messages, pure effect/drop tests, store acquisition/crafting/migration tests, navigation coverage, and an item-aware campaign/free-expedition pressure audit are implemented.

## 5C. Five-star full-set transcendence engraving

Status: **Planned**. Current 5-star behavior still grants its existing non-stacking stat capstone when any one equipment branch reaches rank 5; completing all three branches at the current player cap adds no separate full-set reward. Chapter 2's ordinary +6–10 ranks are implemented separately and are not this engraving purchase.

- Completing Weapon, Armor, and Boots at the current Chapter 2 cap (+10) on a canonical 5-star troop may reveal one additional Gold purchase named `초월 각인`; this proposal must be re-audited after the new equipment sink.
- The proposed first version has one purchased engraving rank per 5-star troop, never adds a body, and grants exactly three more fixed ranks of that troop's four authored equipment effects. It therefore preserves Ifrit damage/range identity, Dragon aerial artillery identity, and Alliance Guardian durability instead of applying one shared percentage.
- Final cost must be audited against the 20,000-Gold Alliance Guardian, current monuments and the 114,000-Gold cost of three complete +10 branches for a 5-star troop. A placeholder price must not ship without this comparison.
- Persistence uses a bounded set/record keyed by canonical UnitId, defaults false for old saves, rejects non-5-star IDs on import, and never grants the engraving merely because an old malformed save has high equipment ranks.
- Acceptance requires Armory reveal/purchase feedback, current-versus-base deltas, battle integration, save/import normalization, KO/EN/JA copy, 5-star regression coverage, unit-efficiency audit, and synchronized GAME_SPEC/BALANCE documentation.

## 5D. Monuments and chapter progression

The Chapter 2 narrative opening is **Implemented**: three original illustrated scenes automatically after the final monument construction (also on revisiting a completed unseen collection), with first frontier entry as a fallback, a shared cinematic module, skip/automatic completion, and schema-12 per-slot completion with legacy-progress migration. Broader regional narrative and additional Chapter 2 content remain **Planned**. It does not disclose future unlock requirements or unseen enemy identities.

The implemented construction economy was revised on 2026-09-30 to a 46,000 base / 36,800 fully discounted total, replacing the long repeat-battle grind with a short post-finale funding target. Effects and progression rules are unchanged; GAME_SPEC/BALANCE own the current prices.

Status: **Implemented** for five one-time regional monuments, existing four deeds, schema-10 migration and map markers, and the first six encounters of Chapter 2. Further Chapter 2 regions remain **Planned**. Current behavior and numbers are authoritative in GAME_SPEC/BALANCE. The five enemy-only Veil constructs have distinct existing combat roles, no recruitment/grade/mastery/capstone path, five original SVG portraits, a separate discovered codex, and independent sequential campaign progression. Canonical data owns every identity, encounter, and gate; saves normalize unique built IDs and a gated prefix of Chapter 2 clears.

Player-facing discovery is part of acceptance: never publish the monument-to-chapter gate in advance, display locked future-chapter tabs, leak unknown enemy portraits/names/counters, or turn narrative screens into implementation explanations. Only earned state reveals the new route. Player controls disclose price/current benefit and immediate battle objective; optional discovered codex entries hold detailed counters. Shared troop/combat math remains symmetric; only the explicitly enemy-only new definitions have no recruit path. Preserve the bounded rendering pools, minimum typography, three-language resources and normal save export/import boundaries when expanding this region.

Future-region acceptance: authored objectives and introduction pacing, new enemy records/art/codex ownership, measured progression and standalone pressure audit, finite openings plus bounded production, no equipment beyond rank 5, no duplicate paid entitlement on migration, and complete KO/EN/JA/battle/map/result flows. Do not imply that all of Chapter 2 is a 30-battle campaign until those encounters actually ship.

The unified continent and Chapter 2 extension are **Implemented**: one painting, organic geographic discovery masks, a southwest Last Bastion starting point and a northward reconquest route replace tiled regional panels. Chapter 2's six existing encounters continue into the northeast after discovery. Additional Chapter 2 regions remain **Planned**; authoritative geometry and progression rules live in GAME_SPEC.

## 5E. Fortress tactical actives — Implemented

Emergency Supply and Central Trap ship as two five-rank tier-2 research nodes. Canonical tuning, pure activation/cooldown/lifetime rules, physical Z/X input, accessible HUD state, one reusable trap marker, pooled ground damage feedback, research migration defaults, and tests are implemented. Pause, speed scaling, ground-only targeting, expiry, duplicate activation, full-resource refusal, and battle shutdown are part of the contract. These player commands do not add generic enemy progression or new persisted battle state. Further fortress skills remain unimplemented; adding one requires the same complete data/rules/UI/lifecycle/verification chain. Current exact values live in GAME_SPEC/BALANCE.

## 5F. Chapter 2 equipment expansion — Implemented

Player troop/hero equipment can advance from +5 to +10 after the canonical Chapter 2 gate. Each extra rank continues authored flat gains at twice the normal rank-price formula. Store/UI/imports share the cap, existing saves keep their actual ranks, enemy equipment remains +5, and the rank-five body/stat capstone never repeats. Advanced-equipment tours introduce the newly available controls. Numeric values and reward-budget/strength audits live in BALANCE. This ordinary equipment expansion does not implement the separate five-star engraving proposal.

## 6. Engineering and player-experience review backlog

The reusable spotlight module and contextual first-use guides are **Implemented** (GAME_SPEC, Guided tutorials): localized target steps, skip/replay, per-slot schema-11 migration, responsive focus handling, and battle pause ownership. Broader observed tactical teaching in REV-06/GD-17 remains **Partial**; the shipped UI guides do not claim action-based counterplay training or validated learning outcomes.

Status: **Partial**. The original review completed on 2026-09-27; the table below tracks subsequent shipped work and remaining proposals.

The scoped evidence, ownership, persistence implications, accessibility/performance constraints, and acceptance criteria are recorded in [ENGINEERING_REVIEW.md](ENGINEERING_REVIEW.md). These supporting technical tasks do not replace the content and presentation backlog in section 7, and do not authorize weakening current balance contracts or implementing commerce.

| ID | Priority | Scope | Status |
|---|---|---|---|
| REV-01 | P1 | Tab-local save routing and concurrent-writer protection | Planned |
| REV-02 | P1 | Storage failure detection and recovery | Planned |
| REV-03 | P1 | Atomic, duplicate-safe battle result settlement | Planned |
| REV-04 | P1 | Battle chunk/asset loading failure recovery | Planned |
| REV-05 | P2 | Pause focus ownership and meaningful accessible announcements | Planned |
| REV-06 | P2 | Validate and address early tactical onboarding gaps | Partial — first-use spotlight guides shipped; tactical observation pending |
| REV-07 | P2 | Actionable post-battle progression and tactical feedback | Planned |
| REV-08 | P2 | Mobile readability and runtime performance measurement | Partial — reported 100-body/60-FPS desktop result; mobile and long-session measurement pending |
| REV-09 | P2 | Representative player-progression balance validation | Planned |
| REV-10 | P2 | Reconcile documented behavior and audit output | Planned |
| REV-11 | P3 | Incremental screen and battle responsibility extraction | Partial — Armory, Hero Hall and contextual tutorial modules extracted; battle scene remains large |

REV-06 through REV-09 require observation or measurement before selecting gameplay/UI changes. On implementation, update both this status table and the corresponding review entry; move authoritative shipped behavior into GAME_SPEC and numeric changes into BALANCE.

## 7. Content, art, animation, and player-experience production backlog

Status: **Partial**. The comprehensive review and acceptance criteria are in [IMPROVEMENT_REVIEW.md](IMPROVEMENT_REVIEW.md). GD-01's shared art direction is Implemented; GD-02 has one western-frontier runtime pilot; GD-06 now has pooled orb, spear, and ground-eruption magic grammar; GD-10 has distinct self-awakening mechanics and Hero Hall disclosure while unique skill visuals remain planned; and GD-12 includes a two-dimensional illustrated continent, dedicated markers/rifts, persistent regional treasures, and static liberation state. GD-17 now includes reusable first-use spotlight guides. All other GD work remains Planned. Live browser playback and audio listening were unavailable during the original review.

| ID | Production priority | Scope | Status |
|---|---|---|---|
| GD-01 | A | Shared art direction and readability | Implemented |
| GD-02 | A | Regional backgrounds and challenge landmarks | Partial — ruined border pilot |
| GD-03 | A | Fortress variants, damage, and destruction presentation | Planned |
| GD-04 | A | Character silhouettes and visual body-count clarity | Planned |
| GD-05 | A | Authored movement, attack, hit, and death animation | Planned |
| GD-06 | A | Impact, guard, healing, and warning effects | Partial — pooled magic grammar |
| GD-07 | A | Five recognizable campaign beast appearances | Planned |
| GD-08 | B | Distinct boss patterns and counterplay | Planned |
| GD-09 | B | Authored late-stage tactical situations | Planned |
| GD-10 | A | Seven hero skill and awakening presentations | Partial — self-awakening mechanics and attained-rank-only Hall disclosure; unearned abilities stay hidden |
| GD-11 | B | Regional story, recruitment, and finale closure | Planned |
| GD-12 | A | Visible liberation on the campaign map | Partial — unified illustrated world, treasures, static liberation, canonical challenge portraits and painted utility/chest markers |
| GD-13 | B | Role comparison, presets, optional reward-free practice | Planned |
| GD-14 | A | Recruitment and progression reward moments | Planned |
| GD-15 | B | Facility and merchant visual identity | Planned |
| GD-16 | A | Battle information hierarchy and action feedback | Planned |
| GD-17 | A | Contextual tactical onboarding | Partial — reusable first-use guides; action-based teaching and player observation pending |
| GD-18 | B | Regional and boss music variation | Planned |
| GD-19 | A | Material- and event-specific sound feedback | Planned |
| GD-20 | B | Actionable defeat and replay presentation | Planned |
| GD-21 | C | Optional post-campaign tactical content | Planned |
| GD-22 | B | Observed progression and spending value | Planned |
| GD-23 | A | Consistent icons and typography | Planned |
| GD-24 | A | Mobile, motion intensity, and accessible feedback | Planned |

A/B/C indicate production order, not defect severity. Begin with one cohesive early-region battle and first-boss presentation before expanding across the roster. All entries inherit the ownership, symmetry, persistence, localization, asset, balance, and verification requirements in the review's section 8. Prototype assets alone are Partial. New boss rules, practice sessions, and post-campaign modes require structured designs and compatibility plans before implementation; visual work alone must not alter combat rules.
