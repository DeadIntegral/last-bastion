# Last Bastion — Future Systems Specification

Last updated: 2026-09-27

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
- A verified purchase may bypass the normal stage-6/stage-12 gates for battle speed and the first expansion. Entitlement application is idempotent, so buying the bundle after earning either benefit cannot duplicate 1.5× speed or grant more than the first expansion; slots six and seven continue to require their normal sequential licenses.
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

## 6. Engineering and player-experience review backlog

Status: **Planned** for all entries below. Review completed on 2026-09-27; no proposed runtime behavior has shipped as part of that review.

The scoped evidence, ownership, persistence implications, accessibility/performance constraints, and acceptance criteria are recorded in [ENGINEERING_REVIEW.md](ENGINEERING_REVIEW.md). These supporting technical tasks do not replace the content and presentation backlog in section 7, and do not authorize weakening current balance contracts or implementing commerce.

| ID | Priority | Scope | Status |
|---|---|---|---|
| REV-01 | P1 | Tab-local save routing and concurrent-writer protection | Planned |
| REV-02 | P1 | Storage failure detection and recovery | Planned |
| REV-03 | P1 | Atomic, duplicate-safe battle result settlement | Planned |
| REV-04 | P1 | Battle chunk/asset loading failure recovery | Planned |
| REV-05 | P2 | Pause focus ownership and meaningful accessible announcements | Planned |
| REV-06 | P2 | Validate and address early tactical onboarding gaps | Planned |
| REV-07 | P2 | Actionable post-battle progression and tactical feedback | Planned |
| REV-08 | P2 | Mobile readability and runtime performance measurement | Planned |
| REV-09 | P2 | Representative player-progression balance validation | Planned |
| REV-10 | P2 | Reconcile documented behavior and audit output | Planned |
| REV-11 | P3 | Incremental screen and battle responsibility extraction | Planned |

REV-06 through REV-09 require observation or measurement before selecting gameplay/UI changes. On implementation, update both this status table and the corresponding review entry; move authoritative shipped behavior into GAME_SPEC and numeric changes into BALANCE.

## 7. Content, art, animation, and player-experience production backlog

Status: **Partial**. The comprehensive review and acceptance criteria are in [IMPROVEMENT_REVIEW.md](IMPROVEMENT_REVIEW.md). GD-01's shared art direction is Implemented; GD-02 has one western-frontier runtime pilot; and GD-12 reconstructs static liberation state from cleared stages. All other GD work remains Planned. Live browser playback and audio listening were unavailable during the original review.

| ID | Production priority | Scope | Status |
|---|---|---|---|
| GD-01 | A | Shared art direction and readability | Implemented |
| GD-02 | A | Regional backgrounds and challenge landmarks | Partial — ruined border pilot |
| GD-03 | A | Fortress variants, damage, and destruction presentation | Planned |
| GD-04 | A | Character silhouettes and visual body-count clarity | Planned |
| GD-05 | A | Authored movement, attack, hit, and death animation | Planned |
| GD-06 | A | Impact, guard, healing, and warning effects | Planned |
| GD-07 | A | Five recognizable campaign beast appearances | Planned |
| GD-08 | B | Distinct boss patterns and counterplay | Planned |
| GD-09 | B | Authored late-stage tactical situations | Planned |
| GD-10 | A | Seven hero skill and awakening presentations | Planned |
| GD-11 | B | Regional story, recruitment, and finale closure | Planned |
| GD-12 | A | Visible liberation on the campaign map | Partial — derived static liberation state |
| GD-13 | B | Role comparison, presets, optional reward-free practice | Planned |
| GD-14 | A | Recruitment and progression reward moments | Planned |
| GD-15 | B | Facility and merchant visual identity | Planned |
| GD-16 | A | Battle information hierarchy and action feedback | Planned |
| GD-17 | A | Contextual tactical onboarding | Planned |
| GD-18 | B | Regional and boss music variation | Planned |
| GD-19 | A | Material- and event-specific sound feedback | Planned |
| GD-20 | B | Actionable defeat and replay presentation | Planned |
| GD-21 | C | Optional post-campaign tactical content | Planned |
| GD-22 | B | Observed progression and spending value | Planned |
| GD-23 | A | Consistent icons and typography | Planned |
| GD-24 | A | Mobile, motion intensity, and accessible feedback | Planned |

A/B/C indicate production order, not defect severity. Begin with one cohesive early-region battle and first-boss presentation before expanding across the roster. All entries inherit the ownership, symmetry, persistence, localization, asset, balance, and verification requirements in the review's section 8. Prototype assets alone are Partial. New boss rules, practice sessions, and post-campaign modes require structured designs and compatibility plans before implementation; visual work alone must not alter combat rules.
