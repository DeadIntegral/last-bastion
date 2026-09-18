# Last Bastion — Future Systems Specification

Last updated: 2026-09-18

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
