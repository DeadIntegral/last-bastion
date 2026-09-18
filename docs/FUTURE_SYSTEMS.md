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

Status: **Planned**.

Implemented foundation: the live combat model already has attack windup/recovery, impact-time target revalidation, minimum-range dead zones, and radial `splash` patterns with explicit ground/all-domain targeting. These generic mechanics are documented in `docs/GAME_SPEC.md`; they do not by themselves implement guard interception, directional rear attenuation, a target-point ground eruption, or its pooled telegraph, so the system below remains Planned.

### Design goal

Add a readable front-line/back-line relationship without making tanks a universal answer. Tanks should protect formations from attacks that physically travel through the lane, while ground-origin magic should punish an army that relies only on a single blocking body.

The intended counter triangle is:

| Threat | Tank response | Remaining counterplay |
|---|---|---|
| Straight pierce projectile or thrust | Stops at the first living tank it hits | Focus or displace the tank; use an indirect attack |
| Directional line/wave area attack | Damages the tank, then loses reach behind it | Place the back line outside the reduced continuation zone |
| Ground-origin magic | Ignores intervening tanks and erupts at the target point | React to its telegraph, spread units, use flying units when the spell is ground-only |

### 2.1 Tank role tag

- Add a canonical combat role/capability such as `guard` to selected tank troops and heroes; do not infer it merely from high HP or defense.
- The tag and its exact protection properties live on the shared combatant definition, so an enemy Guardian protects enemy troops by the same rules as a player Guardian.
- Initial candidates should come from existing defensive units such as Guardian, Orc Bulwark, Rune Golem, Demon Guard, and Edric. The final set requires a roster and balance review before implementation.
- UI cards, codex records, battle target feedback, and the difficulty estimator must disclose and value the protection capability.

### 2.2 Pierce interception

- A straight `pierce` attack resolves targets from front to back as it does today.
- When the traversal reaches a living guard with active pierce interception, that guard takes the appropriate primary or follow-through hit and the traversal terminates. No target farther behind the guard is hit by that attack.
- Interception is deterministic, not a random block chance. It protects positioning while preserving damage dealt to the tank.
- A guard cannot intercept an attack that originates behind it, a non-directional effect, a ground-origin spell, or an explicitly `unblockable` pattern.
- Flying and ground lanes remain explicit: a ground guard cannot stop an aerial projectile path unless its definition explicitly protects the flying domain.
- Multiple tanks do not produce extra damage reduction for the same stopped traversal; the first valid guard ends it.

### 2.3 Rear area-range attenuation

- Directional area attacks receive an explicit propagation model instead of treating every area as an undifferentiated circle.
- If a directional line or wave includes a guard, the guard is damaged normally, but the attack's remaining range behind that guard is reduced by a data-driven `rearRangeMultiplier` or equivalent fixed continuation distance.
- The reduction changes only the portion behind the tank. It must not shrink the attack in front of the tank or move its origin.
- Straight pierce interception is the strongest form of this rule and reduces continuation to zero. Broader waves may retain a short residual distance so tight formations can still be punished.
- Radial explosions centered on the tank are not automatically directional and therefore do not gain rear attenuation unless their attack definition declares a travel direction.
- The battle presentation needs a visible split or fading wave behind the tank so players can understand that protection occurred.

### 2.4 Ground-origin magic

- Add a separate attack pattern such as `groundBurst`. It chooses a valid target position first, telegraphs that location, then creates its hit area from the ground at that point.
- Because the effect does not travel from caster to target, intervening guards cannot intercept it and do not reduce its radius or reach.
- The first implementation should be ground-only: it cannot hit units tagged `flying` unless a spell explicitly opts into both movement domains.
- A unit standing inside the eruption, including a tank, is damaged normally. The mechanic bypasses the tank's line protection, not the tank's own defense or damage-reduction stats.
- Ground magic needs readable counterplay: an authored warning marker and cast delay, a bounded radius, and a longer cadence or lower direct efficiency than an equivalent unobstructed line attack.
- Target selection should prefer tactically meaningful clusters but remain bounded and deterministic enough for testing. It must not scan or sort an unbounded historical combatant list.
- Candidate users include Kingdom Mage, Archmage, Ogre Mage, Orc Shaman, Abyss Mage, and selected bosses. Not every magic user should receive the same pattern.

### 2.5 Proposed structured data

The exact TypeScript names are intentionally not locked yet, but the implementation should express capabilities in data rather than unit-ID conditionals. A likely shape is:

```ts
interface GuardProtection {
  stopsPierce: boolean;
  rearRangeMultiplier: number;
  protectedDomains: MovementDomain[];
}

type AttackPattern =
  | { kind: 'single' }
  | { kind: 'pierce'; maxTargets: number; followThroughRange: number }
  | { kind: 'cleave'; secondaryMultiplier: number }
  | { kind: 'splash'; radius: number; targetDomain: 'ground' | 'all' }
  | { kind: 'directionalArea'; length: number; width: number }
  | { kind: 'groundBurst'; radius: number; telegraphMs: number; targetDomains: MovementDomain[] };
```

Do not persist derived combat capabilities on a save. Saves retain combatant IDs and progression; current definitions supply the mechanic after an update.

### 2.6 Required implementation work

1. Extend shared combat types and canonical unit definitions.
2. Add pure target-resolution helpers under `src/game` for guard interception, directional attenuation, and ground-burst membership.
3. Integrate the helpers symmetrically into Phaser combat for soldiers, heroes, enemies, elites, and bosses.
4. Add allocation-bounded telegraph/effect pools for ground magic; no per-cast unbounded tween, timer, or Phaser-object creation.
5. Add armory, codex, map/enemy preview where appropriate, and battle feedback for the new traits without revealing hidden enemy equipment.
6. Extend `src/game/difficulty.ts` so defensive interception and indirect cluster pressure affect encounter estimates.
7. Rebalance affected units and stages in structured data, then update `docs/BALANCE.md`.

### 2.7 Acceptance criteria and minimum regression coverage

- A two- or three-target pierce that reaches a guard damages that guard but never the ally behind it.
- The same pierce without a guard reaches the normal target cap and continuation distance.
- A directional area attack keeps its full range before the guard and only the configured residual range behind it.
- A radial explosion without a travel direction is unchanged by rear attenuation.
- A ground burst can hit a back-line ground unit despite an intervening guard.
- A default ground burst cannot hit a flying target.
- Player and computer versions of the same troop produce identical results.
- Difficulty and performance audits remain within their documented gates after the new mechanics enter campaign data.

These are product acceptance conditions, not eight mandatory test cases. Prefer one compact, table-driven pure target-resolution suite for the distinct interception, attenuation, ground-burst, and flying-domain branches; add a single battle integration test only for behavior the pure resolver cannot prove. Presentation belongs in browser verification, and the existing balance audit should be extended only when live combat data starts using the mechanics.

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
