# Last Bastion — Balance Reference

Last updated: 2026-09-18

This is the canonical reference for implemented economy, progression, combat, and campaign numbers. Change this file in the same commit as any balance value. Product behavior and architecture remain canonical in `docs/GAME_SPEC.md`.

## 1. Currency economy

| Currency | Initial | Sources | Current sinks |
|---|---:|---|---|
| Gold | 100 | battles, first-clear rewards, achievement claims | troop recruitment, equipment, heroes, hero training, fortress research, post-finale Victory Monument |
| Royal Gems | 0 | daily attendance, achievement claims | permanent 1.5× battle-speed license; three permanent formation-slot licenses |

- Royal Gems are currently non-purchasable with real money. There is no recharge, payment, or currency-exchange path.
- Daily attendance grants 10 Royal Gems once per browser-local calendar date.
- The claimed date persists as `YYYY-MM-DD`. Changing the device clock is not prevented because progression is local-only.
- The `수수께끼 상인` shop is revealed after the stage-6 campaign boss clear. It sells `전투 가속 허가` for 200 Royal Gems once; the map operations button only enters the shop. The license permanently unlocks a persisted 1×/1.5× battle toggle. The purchase is idempotent and the speed applies to simulation time, timer events, and combat tweens; BGM tempo is not changed.
- Formation licenses are sequential: stage 12 reveals slot 5 for 150 Royal Gems, stage 18 reveals slot 6 for 250, and stage 24 reveals slot 7 for 350. They persist as a clamped `formationSlotPurchases` count and expose matching battle cards and numeric hotkeys. The full formation expansion costs 750 Gems, or 75 daily claims before achievement income; buying it together with battle speed costs 950 Gems. Legacy `formationSlotUnlocked: true` saves migrate to one purchase.
- No payment implementation currently exists. A future verified Quick Starter may combine a data-driven Gem grant with battle-speed access and exactly the first formation purchase; slots 6–7 remain ordinary campaign progression unless a future documented entitlement explicitly changes that rule.

Hero Training Ground unlocks from the stage-9 first clear. It supplements rather than replaces battle-earned hero mastery XP and refuses purchases at the level-30 cap.

Fortress growth research has two independent tier-2 roots in one branch: each `전리품 회계` rank multiplies repeat and first-clear battle Gold by 1.05, and each `왕립 야전 교범` rank multiplies soldier and hero battle mastery XP by 1.05. Both cap at ×1.25 at rank 5 and round to the nearest whole value. Neither root requires investment in the command/supply tree or the other growth root. Achievement Gold, daily rewards, recruitment costs, and paid Hero Training packages are not multiplied.

| Training package | Gold cost | Hero XP | Gold per XP |
|---|---:|---:|---:|
| 야전 훈련 | 250 | 100 | 2.50 |
| 전술 교습 | 1,000 | 500 | 2.00 |
| 왕실 전수 | 2,500 | 1,500 | 1.67 |

The `승전 기념비` is revealed only after campaign stage 30 is cleared. It has 20 persistent levels and costs `5,000 + current level × 2,500` Gold, producing the sequence 5,000 / 7,500 / … / 52,500 and a total completion cost of 575,000 Gold. Each level applies only to the player side: all soldiers and heroes gain +1% maximum HP, attack, and healing power, while the player fortress gains +150 maximum HP. The maximum effect is +20% combatant HP/attack/healing and +3,000 fortress HP. It does not strengthen active hero-skill formulas, enemy forces, or the offline campaign difficulty estimate.

## 2. Shared troop base stats

Player and enemy troops use the same 51 base definitions. Player equipment/mastery or the stage's enemy equipment profile is applied afterward. Enemy forces never receive mastery. `src/data/units.ts` is the exhaustive numeric source; the table below preserves the original foundation and challenge-signature values, while the family matrix records the complete implemented roster.

| Family | Count | Roster |
|---|---:|---|
| Kingdom | 11 | Militia, Guardian, Archer, Lancer, Cavalry, Swordsman, Pikeman, Scout, Priest, Mage, Archmage |
| Betrayer | 2 | Crossbow, Assassin |
| Goblin | 4 | Raider, Poison Archer, Bomber, Wolf Rider |
| Orc | 3 | Bulwark, Berserker, Shaman |
| Ogre | 2 | Crusher, Ogre Mage |
| Beast/monster | 13 | Griffin, Troll, Harpy, Minotaur, Wyvern, Slime, Basilisk, Direwolf, Giant Eagle, Treant, Golem, Hydra, Ancient Sky Dragon |
| Spirit | 6 | Storm, Fire, Frost, Earth, Radiance, Shadow |
| Demon | 10 | Hellhound, Imp, Succubus, Guard, Mage, Gargoyle, Cerberus, Ifrit, Reaper, Abyss Knight |

### Intrinsic troop grades

Grade is fixed canonical metadata, not an additional upgrade track. It applies equally to the player and computer form of a troop and contributes no runtime multiplier: all actual combat values come from the authored base definition, equipment, mastery where permitted, terrain, and explicit encounter modifiers. The labels communicate combat stature, rarity, and acquisition expectation. Authored 4-star and 5-star definitions nevertheless preserve a stature floor of at least 1,000 base HP; this is a data invariant, not a hidden grade multiplier.

| Grade | Label | Troops |
|---:|---|---|
| ★☆☆☆☆ | General | Militia, Guardian, Archer, Lancer, Raider, Crossbow, Swordsman, Pikeman, Scout, Goblin Archer, Goblin Bomber, Slime, Imp |
| ★★☆☆☆ | Trained | Bulwark, Royal Cavalry, Priest, Kingdom Mage, Assassin, Orc Berserker, Orc Shaman, Wolf Rider, Harpy, Fire Spirit, Frost Spirit, Direwolf, Giant Eagle, Succubus, Gargoyle |
| ★★★☆☆ | Elite | Ogre Crusher, Storm Spirit, Hellhound, Archmage, Troll, Ogre Mage, Minotaur, Wyvern, Basilisk, Earth Spirit, Radiance Spirit, Shadow Spirit, Demon Guard, Demon Mage |
| ★★★★☆ | Legendary | Griffin Rider, Ancient Treant, Rune Golem, Swamp Hydra, Cerberus, Reaper, Abyss Knight |
| ★★★★★ | Transcendent | Ifrit, Ancient Sky Dragon |

Only 5-star troops count as transcendent for `초월의 군기`. In particular, Griffin Rider is 4-star and Minotaur is 3-star. Changing a grade does not rebalance a stat automatically; any intended numerical change must still be made and audited separately.

| Troop | Command | Squad | HP each | ATK | Range | Attack interval | Move | Cooldown | Recruit | Pattern |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 민병대 | 45 | 3 | 105 | 17 | 34 | 820 ms | 54 | 2.0 s | starting | single |
| 방패병 | 70 | 2 | 285 | 11 | 32 | 1050 ms | 34 | 3.0 s | stage 1 | single |
| 궁수 | 75 | 2 | 72 | 22 | 215 | 1180 ms | 42 | 3.2 s | stage 2 | single |
| 창병 | 80 | 1 | 165 | 31 | 62 | 1100 ms | 47 | 2.8 s | stage 3 | pierce 2, ×0.85 follow-through |
| 고블린 약탈병 | 50 | 3 | 90 | 14 | 34 | 900 ms | 43 | 2.2 s | 200 | single |
| 오크 철갑병 | 90 | 1 | 390 | 22 | 42 | 1250 ms | 28 | 3.4 s | 350 | cleave, ×0.70 secondary |
| 왕립 기마병 | 120 | 1 | 250 | 40 | 40 | 1050 ms | 82 | 3.9 s | 700 | pierce 2, ×0.80 follow-through |
| 석궁병 | 85 | 1 | 115 | 36 | 160 | 1450 ms | 36 | 3.0 s | 400 | pierce 2, ×0.75 follow-through |
| 오우거 파쇄자 | 170 | 1 | 900 | 65 | 52 | 1500 ms | 25 | 4.3 s | challenge 101 | cleave, ×0.80 secondary |
| 다이어울프 | 85 | 2 | 155 | 31 | 32 | 800 ms | 82 | 3.5 s | challenge 106 | single, first strike ×1.60 |
| 그리폰 기수 | 200 | 1 | 1,600 | 150 | 58 | 1050 ms | 78 | 6.5 s | 1,500 | cleave, ×0.85 secondary |
| 폭풍 정령 | 155 | 1 | 600 | 55 | 185 | 1150 ms | 58 | 4.5 s | challenge 102 | pierce 2, ×0.70 follow-through |
| 룬 골렘 | 200 | 1 | 2,300 | 110 | 46 | 1650 ms | 17 | 6.2 s | challenge 107 | cleave ×0.85, guard ×0.15 |
| 마염견 | 170 | 1 | 850 | 70 | 46 | 900 ms | 76 | 4.8 s | challenge 103 | cleave, ×0.65 secondary |
| 왕국 마법사 | 115 | 1 | 110 | 36 | 195 | 1300 ms | 37 | 3.5 s | encounter | ground burst r72, ×0.70 secondary |
| 대마법사 | 190 | 1 | 700 | 110 | 245 | 1600 ms | 31 | 5.5 s | encounter | all-domain directional 245, ×0.70 secondary |
| 이프리트 | 200 | 1 | 11,000 | 140 | 215 | 1650 ms | 42 | 6.6 s | challenge 104 after stage 30 | pierce 3, ×0.75 follow-through |
| 창공의 고룡 | 200 | 1 | 15,000 | 240 | 250 | 1900 ms | 36 | 9.0 s | challenge 105 after stage 30 | pierce 3, ×0.80 follow-through |

- A new profile owns and equips only the militia.
- Battle formations contain one to four acquired troop types by default and up to seven after purchasing the three sequential permanent formation-slot licenses.
- Command and cooldown are paid once per card activation. One Militia/Raider activation creates three bodies and one Guardian/Archer activation creates two; a wave's `count` likewise counts activations before squad expansion. Mastery summon counts track the activation rather than multiplying XP per body.
- Encounter alone does not bypass fortress recruitment permits: expansion troops below 110 Command default to tier 2 and troops at or above 110 default to tier 3. Royal Cavalry is revealed and recruitable at tier 2 without an encounter; Griffin Rider follows the same rule at tier 3. Ogre Crusher, Direwolf, Storm Spirit, Rune Golem, Hellhound, Ifrit, and Ancient Sky Dragon are challenge-only recruits. Already-owned troops remain owned when an older save migrates.
- Lancer and Huntress attacks deal ×1.75 damage to `large` targets.
- Royal Cavalry has 3 base defense and its first attack after each spawn deals ×1.6 damage. Griffin Rider has 8 base defense, is tagged `flying` and `large`, and moves 112 virtual pixels above the lane. It retains higher per-hit melee damage than Ifrit, but consumes the full 200 base Command, waits 6.5 seconds between deployments, must enter melee range, and permits only two living bodies per side.
- Only combatants tagged `ranged` and the player watchtower can select a flying target. Late enemy-fortress fire is an explicit domain-independent exception and can shoot both ground and flying attackers. Fortress bombardment and beast stomp skip flying targets; flying units can attack ground targets normally.
- Defense is subtracted from incoming damage after bonuses; final damage has a minimum of 1.
- Pierce starts with the selected primary target, then selects the nearest valid targets farther along the attack direction inside its follow-through distance. A guard protecting that movement domain takes its normal hit and terminates the traversal. Cleave selects all valid targets inside the attacker's normal melee range. Every secondary target receives the listed multiplier.
- Archer versus Crossbow is an explicit tradeoff rather than a faction advantage. An Archer deployment has two bodies, 215 range, and higher combined single-target pressure. A Crossbow deployment has one tougher body, 160 range, a slower 1.45-second attack, and a stronger 36-damage bolt; its total volley exceeds the Archer deployment only when a second target lines up for the capped two-target pierce. High per-shot damage also loses less of its proportion to flat defense, while the Archer remains safer and stronger against one target.
- Priest is the symmetric healer for both factions: 105 Command, 145 HP, 1 defense, 20 attack, 175 attack range, 34 healing at 190 range, and a 1.25-second shared action interval. It heals the in-range non-boss ally with the greatest missing HP before attacking and cannot overheal; bosses are deliberately excluded so a producing garrison cannot sustain an unbounded boss-healing loop. Weapon equipment and mastery attack growth add the same flat amount to healing power. The unit-threat estimator values its healing per second at a 1.35 support coefficient.

### Attack commitment, guard protection, and area geometry

`attackIntervalMs` is the complete attack-start-to-attack-start cycle. `attackWindupMs` is the immobile pre-impact commitment and recovery is exactly `attackIntervalMs - attackWindupMs`; the unit remains immobile for that remainder after impact. The locked target is revalidated when windup ends. A dead target, a target newly protected behind a living fortress, a target behind the attacker, or a target outside the current minimum–maximum attack band causes the committed attack to miss. A ranged unit whose nearest forward threat is inside `minimumAttackRange` retreats instead of selecting a farther target through the screen.

| Combatant | Effective range | Windup | Recovery | Pattern |
|---|---:|---:|---:|---|
| Militia | 0–34 | 180 ms | 640 ms | single |
| Guardian | 0–32 | 360 ms | 690 ms | single |
| Archer | 55–215 | 320 ms | 860 ms | single |
| Lancer | 0–62 | 260 ms | 840 ms | pierce 2 |
| Royal Cavalry | 0–40 | 230 ms | 820 ms | pierce 2 + charge |
| Crossbow | 75–160 | 650 ms | 800 ms | pierce 2 |
| Goblin Bomber | 80–145 | 720 ms | 880 ms | ground splash radius 82, ×0.80 secondary |
| Kingdom Mage | 65–195 | 520 ms | 780 ms | ground burst radius 72, ×0.70 secondary, 520 ms warning |
| Orc Shaman | 65–185 | 520 ms | 830 ms | ground burst radius 78, ×0.65 secondary, 520 ms warning |
| Ogre Mage | 75–170 | 720 ms | 780 ms | ground burst radius 95, ×0.70 secondary, 720 ms warning |
| Archmage | 100–245 | 780 ms | 820 ms | all-domain directional length 245, ×0.70 secondary |
| Abyss Mage | 75–210 | 620 ms | 830 ms | ground burst radius 88, ×0.65 secondary, 620 ms warning |
| Fire Spirit | 50–165 | 430 ms | 620 ms | ground/flying splash radius 68, ×0.60 secondary |
| Ifrit | 100–215 | 850 ms | 800 ms | pierce 3 |
| Ancient Sky Dragon | 120–250 | 1,100 ms | 800 ms | pierce 3 |

Every expanded roster entry stores resolved timing/range data even when `makeTroop` supplies a role-based default. Exact windup/recovery is intentionally hidden from the armory, Hero Hall, and battle cards. An owned troop or hero reveals it only in the codex at mastery level 5; encountered-but-unowned troops remain `미분석`. Attack pattern and effective range remain available before that analysis so formation choices are understandable.

`guardProtection.rearRangeMultiplier` applies only to the directional attack distance remaining behind the guard and only to the listed movement domains. It is not a damage reduction, does not affect ordinary radial splash, and never intercepts a ground burst. A straight pierce ends after damaging the first qualifying guard. All initial guards protect only the ground domain:

| Guard | Stops pierce | Rear directional multiplier | Effective reach reduction |
|---|---|---:|---:|
| Guardian | yes | ×0.35 | 65% |
| Orc Bulwark | yes | ×0.25 | 75% |
| Earth Spirit | yes | ×0.40 | 60% |
| Rune Golem | yes | ×0.15 | 85% |
| Demon Guard | yes | ×0.25 | 75% |
| Abyss Knight | yes | ×0.20 | 80% |
| Edric | yes | ×0.30 | 70% |

Ground-burst target selection evaluates only current living valid targets, chooses the in-range center covering the most bodies, and uses the farther candidate as the deterministic tie-break. The position is fixed at cast start; movement can escape the warned radius, caster death cancels the cast, and a ground-only burst cannot hit flying units. Kingdom Mage, Orc Shaman, Ogre Mage, and Abyss Mage use this pattern. Archmage instead emits an all-domain directional wave, so a ground guard shortens only the ground continuation while the flying lane retains its authored length.

### Upper-tier value corrections

The expensive roster was rebalanced against Command cost rather than rarity alone. These are the current corrected values for previously inefficient upper-tier troops; omitted columns retain their canonical values in `src/data/units.ts`.

| Troop | Command | HP | DEF | ATK | Interval |
|---|---:|---:|---:|---:|---:|
| 대마법사 | 190 | 700 | 4 | 110 | 1.60 s |
| 트롤 | 170 | 1,200 | 6 | 75 | 1.40 s |
| 오우거 마도사 | 185 | 900 | 4 | 100 | 1.50 s |
| 미노타우로스 | 190 | 1,350 | 6 | 95 | 1.40 s |
| 와이번 | 190 | 1,050 | 4 | 88 | 1.10 s |
| 바실리스크 | 180 | 1,200 | 8 | 90 | 1.25 s |
| 대지 정령 | 165 | 1,150 | 9 | 60 | 1.35 s |
| 고대 트렌트 | 190 | 1,900 | 8 | 90 | 1.60 s |
| 룬 골렘 | 200 | 2,300 | 12 | 110 | 1.65 s |
| 늪지 히드라 | 200 | 2,100 | 7 | 115 | 1.45 s |
| 악마 근위병 | 175 | 1,300 | 10 | 75 | 1.20 s |
| 케르베로스 | 200 | 1,600 | 6 | 110 | 0.95 s |
| 이프리트 | 200 | 11,000 | 8 | 140 | 1.65 s |
| 창공의 고룡 | 200 | 15,000 | 12 | 240 | 1.90 s |
| 영혼 수확자 | 200 | 1,200 | 6 | 125 | 1.35 s |
| 심연 기사 | 200 | 1,900 | 12 | 115 | 1.25 s |

### Simultaneous legendary deployment limits

`maxActivePerSide` limits living bodies of one troop ID independently for each faction. It applies to player summons, scripted enemy waves, and reinforcements. A body-granting rank-5 equipment capstone fills only the remaining capacity: for example, a two-body deployment into a limit of two creates one body if one is already alive, while still consuming the card activation. Stat-capstone creatures never add a body. Ordinary troops have no such limit.

| Limit | Troops |
|---:|---|
| 1 per side | Ancient Sky Dragon |
| 2 per side | Griffin Rider, Minotaur, Wyvern, Basilisk, Treant, Golem, Hydra, Cerberus, Ifrit |
| 3 per side | Ogre Crusher, Storm Spirit, Hellhound, Troll, Ogre Mage, Earth Spirit, Radiance Spirit, Shadow Spirit, Giant Eagle, Gargoyle |

The armory displays `진영당 N명`, and battle cards display the current living count as `전장 current/N`. The same cap is enforced for both sides so an enemy wave cannot bypass a restriction that applies to the acquired form.

## 3. Equipment and mastery

Each troop and hero has three independent equipment slots with five levels each.

| Slot | Effect per level | Price rule |
|---|---|---|
| Weapon | combatant-specific flat ATK | combatant sequence |
| Armor | combatant-specific flat HP and defense | combatant sequence |
| Boots | combatant-specific flat move speed | combatant sequence |

Equipment no longer applies a shared percentage. Each canonical combatant definition owns these absolute gains per equipment level:

Expansion troops created through `makeTroop` derive readable fixed growth once at data construction: weapon `max(2, round(base ATK × 0.10))`, armor HP `max(12, round(base HP × 0.10))`, armor defense `+1.5` when the base has defense or `+1` otherwise, and boots `max(1, base move × 0.03 rounded to one decimal)`. Equipment price bases instead follow canonical troop grade: 1-star 75, 2-star 100, 3-star 200, 4-star 300, and 5-star 400, with authored 50-cost exceptions for Militia and Raider. These become ordinary fixed values on the resulting definition; combat never reapplies the growth formula.

| Combatant | Weapon ATK | Armor HP | Armor DEF | Boots move |
|---|---:|---:|---:|---:|
| 민병대 | +2 | +18 | +1.2 | +2.0 |
| 방패병 | +2 | +35 | +2.0 | +1.5 |
| 궁수 | +4 | +14 | +1.0 | +1.5 |
| 창병 | +4 | +24 | +1.2 | +1.8 |
| 약탈병 | +2 | +17 | +1.0 | +2.0 |
| 철갑병 | +3 | +38 | +2.2 | +1.2 |
| 왕립 기마병 | +5 | +30 | +1.4 | +2.4 |
| 석궁병 | +4 | +13 | +1.0 | +1.4 |
| 파쇄자 | +7 | +90 | +2.0 | +1.0 |
| 그리폰 기수 | +15 | +160 | +2.0 | +2.2 |
| 폭풍 정령 | +6 | +60 | +1.2 | +2.0 |
| 마염견 | +7 | +85 | +1.5 | +2.2 |
| 창공의 고룡 | +24 | +1,500 | +1.5 | +1.1 |
| 에드릭 | +3 | +42 | +2.0 | +1.2 |
| 셀레네 | +5 | +24 | +1.0 | +1.4 |
| 리아 | +5 | +28 | +1.2 | +1.8 |
| 공성 마수 | +6 | +70 | +2.0 | +0.8 |

- Equipment cost: `equipmentCostBase × (currentLevel + 1)` for all three slots.
- Militia and Raider use base 50: 50 / 100 / 150 / 200 / 250 gold.
- Other 1-star troops use base 75: 75 / 150 / 225 / 300 / 375 gold.
- Every 2-star troop uses base 100: 100 / 200 / 300 / 400 / 500 gold.
- Every 3-star troop uses base 200: 200 / 400 / 600 / 800 / 1,000 gold; one complete branch costs 3,000.
- Every 4-star troop uses base 300: 300 / 600 / 900 / 1,200 / 1,500 gold; one complete branch costs 4,500.
- Every 5-star troop uses base 400: 400 / 800 / 1,200 / 1,600 / 2,000 gold; one complete branch costs 6,000.
- Heroes retain authored bases: Edric 100, Selene/Ria/Mirena 125, Bran 150, Karuk 175, and Neris 200.
- Soldier equipment capstone: when any one of Weapon, Armor, or Boots reaches rank 5, ordinary, 3-star, and non-large 4-star troops permanently gain +1 deployment body. Every 5-star troop and 4-star `large` troop instead stays at its canonical squad size and gains three additional fixed ranks of Weapon attack/healing, Armor HP/defense, and Boots movement simultaneously. The current stat-capstone roster is Griffin Rider, Ancient Treant, Rune Golem, Swamp Hydra, Cerberus, Ifrit, and Ancient Sky Dragon. Completing additional slots does not stack either bonus. Swamp Hydra therefore receives a clearly visible capstone-only +630 HP, +36 ATK, +4.5 defense, and +3 move rather than the previous one-rank +210/+12/+1.5/+1. The rule applies symmetrically to stage-equipped regular enemies; heroes and bosses receive neither bonus, named elite spawning remains single-body, and reinforcement `maxAlive` remains an exact living-body cap rather than a deployment count.
- Soldier mastery maximum: level 50. Hero mastery maximum: level 30.
- XP for next mastery level: `round(45 × level^1.32)`.
- Mastery uses character-specific flat gains. At level `L`, add `(L - 1) × listed gain` to canonical HP and ATK before adding equipment.
- Expansion-troop mastery values are generated as fixed `max(4, round(base HP × 0.035))` HP and `max(1, round(base ATK × 0.05))` ATK per rank. The original twelve troops retain their authored overrides listed below.
- Used troop XP per battle: `8 × summon count + 12` on victory or `8 × summon count + 4` on defeat.
- Selected hero XP per battle: `24 + 5 × skill uses + 18` on victory or `24 + 5 × skill uses + 6` on defeat.

| Troop | HP per mastery rank | ATK per mastery rank |
|---|---:|---:|
| 민병대 | +5 | +1 |
| 방패병 | +12 | +1 |
| 궁수 | +4 | +1 |
| 창병 | +7 | +2 |
| 약탈병 | +4 | +1 |
| 철갑병 | +16 | +2 |
| 왕립 기마병 | +10 | +2 |
| 석궁병 | +5 | +2 |
| 파쇄자 | +35 | +4 |
| 그리폰 기수 | +55 | +6 |
| 폭풍 정령 | +24 | +3 |
| 마염견 | +32 | +4 |

## 4. Heroes

| Hero | HP | ATK | Range | Attack interval | Move | Skill cooldown | Respawn | Unlock gold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 에드릭 | 520 | 29 | 42 | 900 ms | 40 | 25 s | 20 s | starting |
| 셀레네 | 285 | 43 | 190 | 1250 ms | 37 | 22 s | 18 s | 500 |
| 리아 | 350 | 48 | 230 | 1050 ms | 47 | 24 s | 16 s | 800 |
| 미레나 | 330 | 24 | 185 | 1200 ms | 38 | 23 s | 17 s | 1,200 |
| 브란 | 455 | 39 | 46 | 950 ms | 52 | 24 s | 19 s | 1,800 |
| 카루크 | 720 | 68 | 54 | 1150 ms | 40 | 26 s | 22 s | 2,500 |
| 네리스 | 420 | 58 | 230 | 1050 ms | 72 | 21 s | 16 s | 4,000 |

- Edric: normal attacks cleave at ×0.70 secondary damage; nearby non-hero troops take 15% less damage; active grants 100 shield.
- Selene: attacks splash for 35%; active meteor deals 240 area damage and 160 damage to a fortress caught in the impact.
- Ria: normal attacks pierce up to three targets at ×0.80 follow-through damage; ×1.75 damage to large targets; active deals 105 to every active normal enemy or 155 to a boss.
- Mirena: base attacks give way to a 58-point heal at 215 range whenever a nearby ally is injured; active heals allies within 240 range for 150 and the player fortress for 100.
- Bran: first charge deals ×1.60 damage and normal attacks cleave at ×0.72 secondary damage; active gives allies within 220 range 85 shield.
- Karuk: the Orc champion's first charge deals ×1.60 damage and his axe cleaves at ×0.85 secondary damage; active deals 180 damage to enemies within 205 and gives nearby allies 80 shield.
- Neris: the flying wind spirit pierces two targets at ×0.80 follow-through; active centers a radius-185 storm 190 units ahead, dealing 200 to ground and flying enemies and 130 to a fortress in the area.

Hero mastery is deliberately stronger than troop mastery and also improves each active skill and respawn cadence. Every entry below is a fixed gain per mastery rank after level 1. Hero mastery stops at level 30.

| Hero | HP | ATK | Active per rank | Active per awakening | Respawn per rank | Maximum respawn reduction |
|---|---:|---:|---|---|---:|---:|
| 에드릭 | +24 | +2 | shield +10 | shield +50 | -0.30 s | -7.0 s (13.0 s final) |
| 셀레네 | +14 | +3 | meteor +16; fortress +10 | meteor +100; fortress +60 | -0.25 s | -6.3 s (11.7 s final) |
| 리아 | +17 | +3 | normal target +8; boss +12 | normal +45; boss +65 | -0.22 s | -5.6 s (10.4 s final) |
| 미레나 | +16 | +2 | ally heal +10; fortress +6 | ally +60; fortress +40 | -0.24 s | -6.0 s (11.0 s final) |
| 브란 | +21 | +3 | shield +8 | shield +40 | -0.28 s | -6.5 s (12.5 s final) |
| 카루크 | +30 | +4 | damage +12; shield +6 | damage +70; shield +30 | -0.32 s | -7.5 s (14.5 s final) |
| 네리스 | +18 | +4 | unit +14; fortress +9 | unit +80; fortress +50 | -0.24 s | -5.8 s (10.2 s final) |

Awakenings occur at levels 10, 20, and 30. Each awakening also reduces active cooldown by exactly 1.5 seconds; final cooldowns are 20.5 seconds for Edric, 17.5 seconds for Selene, 19.5 seconds for Ria, 18.5 seconds for Mirena, 19.5 seconds for Bran, 21.5 seconds for Karuk, and 16.5 seconds for Neris. Final level-30 active values are 540 shield, 1,004/630 meteor unit/fortress damage, 472/698 arrow-rain normal/boss damage, 620/394 Mirena ally/fortress healing, 437 Bran shield, 738/344 Karuk damage/shield, and 846/541 Neris unit/fortress storm damage.

Each awakening rank also enables one level of a nearby-allied aura: Edric gives +2 defense per rank within 170, Selene +3 attack within 180, Ria +15 attack range within 210, Mirena +4 HP/s regeneration within 195, Bran +4 movement speed within 185, Karuk +2 attack and +1 defense within 185, and Neris +12 range and +3 movement within 215. At rank III Karuk grants +6/+3 and Neris grants +36/+9. Auras require the selected hero to be alive and do not buff the hero itself.

## 5. Battle and fortress baseline

| Value | Base |
|---|---:|
| Starting Command | 70 |
| Command regeneration | 10/s |
| Maximum Command | 200 |
| Command per normal kill | 6 |
| Wartime mobilization | costs 300 / 400 / 500 Command; maximum +100 each; 3 uses/battle |
| Player fortress HP | 1800, plus 70 per stage after stage 1 |
| Bombardment damage | 175 |
| Bombardment radius | 125 |
| Bombardment cooldown | 32 s |

### Fortress rear deployment

- Player soldiers and the selected hero spawn or respawn at player-fortress X minus 50. Enemy opening waves, garrisons, and reinforcements spawn at enemy-fortress X plus 50.
- Extra bodies in one squad are placed 16 units farther toward their own rear. These offsets are canonical in `fortressDeploymentTuning`.
- A living fortress blocks opposing target selection against combatants still on its rear side. It does not block those defenders' attacks: ranged units can fire over the fortress, and melee units advance through its line before becoming exposed.
- The rule is faction-symmetric. When the enemy fortress reaches zero HP, its remaining rear defenders immediately become valid targets. Challenge bosses receive no enemy-fortress shield because challenges contain no enemy fortress. Campaign bosses and named elite guards retain their forward authored spawn points.
- This increases the tactical value of fortress durability and provides a recovery window after an army is pushed back. It changes engagement geometry but no unit stat, reward, cost, or authored campaign-pressure input.

Fortress research has five ranks per node. Rank cost is `baseCost × (currentRank + 1)`, so every node has a readable five-step arithmetic sequence. Twenty-three nodes across five implemented branches—Command, Growth, Defense, Artillery, and Expedition—provide 115 total purchasable research ranks.

| Fortress tier | Promotion requirement | Promotion cost | New permits |
|---:|---:|---:|---|
| 1 · 변경 요새 | starting | 0 | ten foundation nodes; kingdom regular troops |
| 2 · 왕립 성채 | 8 total research ranks | 1,000 | eight tier-2 nodes; Raider, Bulwark, and Royal Cavalry recruitment |
| 3 · 최후의 보루 | 24 total research ranks | 2,500 | five tier-3 nodes; Crossbow and Griffin Rider recruitment |

- Promotion requirements count ranks purchased across all branches.
- A tier-gated node may also require a preceding node. Both conditions must be satisfied; the technology card shows both the required prerequisite rank and the player's current rank.
- Tier and prerequisite checks apply when buying a node's first rank. A node with one or more persisted ranks remains available for later ranks even if its requirements change in a future data revision.
- Save migration raises an inconsistent saved fortress tier to the highest `requiredTier` among nodes with at least one rank; it never lowers a saved tier or removes research.

| Branch | Tier | Node | Base cost | Effect per rank | Prerequisite |
|---|---:|---|---:|---|---|
| Command | 1 | 전쟁 금고 | 100 | starting Command +25 | — |
| Command | 1 | 보급로 | 150 | regeneration +2.5/s | 전쟁 금고 1 |
| Command | 1 | 지휘 저장고 | 200 | maximum Command +40 | 보급로 1 |
| Command | 2 | 상비군 훈련소 | 250 | summon cooldown -5% | 지휘 저장고 2 |
| Command | 2 | 군수 표준화 | 300 | soldier Command cost -3% | 지휘 저장고 3 |
| Growth | 2 | 전리품 회계 | 350 | battle and first-clear Gold +5% | — |
| Growth | 2 | 왕립 야전 교범 | 400 | battle-earned mastery XP +5% | — |
| Command | 3 | 승전 공납제 | 400 | Command per normal kill +1 | 상비군 훈련소 3 |
| Defense | 1 | 강화 성벽 | 100 | fortress HP +250 | — |
| Defense | 1 | 석재 장갑 | 150 | flat damage reduction +3 | 강화 성벽 1 |
| Defense | 1 | 수호 망루 | 200 | tower damage +22; interval improves by 250 ms | 강화 성벽 1 |
| Defense | 2 | 고층 흉벽 | 250 | tower range +45 | 수호 망루 2 |
| Defense | 3 | 재생 석재 | 400 | fortress regeneration +4 HP/s | 고층 흉벽 3 |
| Artillery | 1 | 흑색 화약 | 100 | bombardment damage +45 | — |
| Artillery | 1 | 신속 장전 | 150 | cooldown -3 s | 흑색 화약 1 |
| Artillery | 1 | 광역 탄두 | 200 | radius +20 | 흑색 화약 2 |
| Artillery | 2 | 마수 관통탄 | 300 | bombardment boss damage +70 | 광역 탄두 2 |
| Artillery | 3 | 공성 계산학 | 450 | direct enemy-fortress bombardment damage +60; bombardment range +80 | 마수 관통탄 3 |
| Expedition | 1 | 집결 신호 | 150 | ordinary-soldier rally control; redeploy cooldown -2 s | — |
| Expedition | 2 | 영웅 기치 | 300 | hero rally control; hero active cooldown -3% | 집결 신호 3 |
| Expedition | 2 | 동원 전술 훈련 | 300 | each mobilization regeneration +0.3/s | 집결 신호 2 |
| Expedition | 3 | 야전 구난대 | 400 | hero respawn time -3% | 영웅 기치 3 |
| Expedition | 3 | 초월의 군기 | 450 | 5-star transcendent rally control; rally movement +5% | 영웅 기치 5 |

- Summon cooldown reduction is capped at 25% through the five available ranks.
- `승전 공납제` raises the base 6 Command per normal kill to 7/8/9/10/11 across ranks 1–5. Its former +2 per rank reached 16 at rank 5 and over-rewarded large low-tier formations.
- `재생 석재` restores 4/8/12/16/20 fortress HP per second across ranks 1–5, clamped to the current maximum HP. The effect is continuous, elapsed-time based, and shown in the fortress summary.
- Soldier Command-cost reduction is capped at 15% through the five `군수 표준화` ranks. Effective cost is `max(10, ceil(base Command × (1 - 0.03 × rank)))`; the battle card, affordability check, and actual deduction all use this same value.
- Watchtower interval is floored at 900 ms, and bombardment cooldown is floored at 16 seconds.
- Bombardment has a 1,000-unit base targeting range measured from the player fortress. `공성 계산학` adds 80 per rank, reaching 1,400 at rank 5; out-of-range ground enemies and fortresses cannot be selected, and an invalid activation spends neither cooldown nor use count.
- Direct fortress bombardment requires at least one `공성 계산학` rank and the enemy fortress to be inside the resulting bombardment range.
- Rally placement starts at a 20-second base redeploy cooldown. `집결 신호` rank 1 is required to use the flag and resolves the cooldown to 18 seconds; ranks 2–5 reduce it to 16/14/12/10 seconds. Every placed order lasts exactly 12 seconds of scaled battle time, then clears automatically and restores normal advance; manual clearing does not erase the remaining redeploy cooldown. Eligible units attack targets already in range, otherwise move to a deterministic slot within 27 units of the clicked center and hold within an 18-unit arrival radius.
- `영웅 기치` rank 1 admits the selected hero and reduces the mastery-adjusted active cooldown by 3% per rank, capped at 15%. `야전 구난대` applies the same 3%-per-rank, 15%-maximum multiplier to mastery-adjusted hero respawn time.
- `초월의 군기` rank 1 admits canonical 5-star transcendent troops and increases every eligible unit's movement toward the flag by 5% per rank, capped at +25%. The current 5-star roster is Ifrit and Ancient Sky Dragon. Grades 1–4 use ordinary-soldier permission, regardless of size, rarity, active-unit cap, or Command cost.
- `전시 동원령` has three battle-local uses costing exactly 300, 400, and 500 Command. Each successful use deducts only its listed cost and adds exactly +100 maximum Command; stored Command above the cost is preserved. `동원 전술 훈련` adds +0.3 Command/s per rank to every activation, so rank 5 grants +1.5/s per use without changing the fixed maximum gain. The first activation requires enough `지휘 저장고` research to hold at least 300 Command.

At maximum `군수 표준화`, every one of the 51 deployment costs uses `max(10, ceil(base Command × 0.85))`; cards, affordability checks, and deductions share that calculation.

## 6. Campaign curve

| Stage | Enemy fortress HP | Battle gold | Enemy W/A/B | First-clear reward |
|---:|---:|---:|---|---|
| 1 | 800 | 100 | 0/0/0 | Guardian |
| 2 | 1,100 | 200 | 1/1/0 | Archer |
| 3 | 1,400 | 300 | 2/1/1 | Lancer + 300 gold |
| 4 | 1,800 | 400 | 2/3/1 | Selene |
| 5 | 2,500 | 500 | 4/4/3 | 500 gold |
| 6 | 3,200 | 600 | 5/5/4 | Ria + 800 gold |
| 7 | 5,000 | 700 | 5/5/5 | 700 gold |
| 8 | 7,600 | 800 | 5/5/5 | 800 gold |
| 9 | 9,800 | 900 | 5/5/5 | 900 gold + Hero Training Ground |
| 10 | 13,500 | 1,000 | 5/5/5 | 1,000 gold |
| 11 | 11,200 | 1,100 | 5/5/5 | 1,100 gold |
| 12 | 14,500 | 1,200 | 5/5/5 | Mirena + 1,200 gold |

- Defeat grants 20% of the listed battle gold, rounded down.
- First-clear rewards are granted once per save.
- The campaign contains 30 stages in five six-stage regions. The next region becomes visible after clearing stages 6, 12, 18, and 24.
- Stage metadata identifies seven occupation groupings: traitorous humans, goblins, orcs, monsters, bound spirits, demons, and mixed Demon Army formations. Campaign terrain multipliers remain ×1 for now; visible non-neutral multipliers are reserved for the separate beast challenges and are included by the difficulty estimator.
- Enemy weapon, armor, and boots upgrades are each capped at rank 5. No enemy or boss receives mastery XP, a mastery level, or a mastery multiplier.
- Stages 13–30 keep enemy equipment at 5/5/5. Their battle reward and first-clear gold both equal `stage × 100`; stage 15 additionally grants Karuk, stage 18 grants Bran, and stage 24 grants Neris.
- Each non-boss stage from 13–29 adds three entries from its 15-unit regional roster to the scripted opening. Five normal stages per region therefore expose all 15 entries exactly as an encounter path. Familiar and regional waves alternate for the first six entries, placing the first regional troop at 5.2 seconds and the other two at 14.2 and 23.2 seconds; remaining familiar formations follow afterward. Regional deployments of cost 120 or less use two deployments, while more expensive signatures use one.

| Stage | Name | Fortress HP | Type |
|---:|---|---:|---|
| 13 | 백은 평원 | 24,000 | army + elite |
| 14 | 바람 절벽 | 26,000 | army + elite |
| 15 | 망각의 초소 | 29,750 | army + elite |
| 16 | 붉은 수로 | 33,500 | army + elite |
| 17 | 용광로 성벽 | 37,250 | army + elite |
| 18 | 잿불 마수의 요새 | 36,750 | boss siege |
| 19 | 서리 벌판 | 46,000 | army + elite |
| 20 | 빙결 관문 | 48,500 | army + elite |
| 21 | 유령 숲 | 52,250 | army + elite |
| 22 | 부서진 첨탑 | 56,000 | army + elite |
| 23 | 백야 성채 | 59,750 | army + elite |
| 24 | 서리 정령수의 왕성 | 59,250 | boss siege |
| 25 | 폭풍 해안 | 68,500 | army + elite |
| 26 | 천둥 협곡 | 71,000 | army + elite |
| 27 | 구름 요새 | 74,750 | army + elite |
| 28 | 왕좌 회랑 | 78,750 | army + elite |
| 29 | 최후의 장벽 | 83,250 | army + elite |
| 30 | 마왕성의 심연수 | 81,750 | boss siege |

Fortress distance is `min(1,390, 1,050 + (stage - 1) × 25)` virtual units. With the player fortress fixed at X 105, the enemy fortress moves from X 1,155 toward the capped X 1,495 position. Stage 14 resolves to 1,375, stage 15 reaches 1,390, and stages 16–30 stay at that maximum. Distance is therefore an early-to-mid-campaign expansion axis rather than an artificial per-stage late-game escalator.

### Enemy fortress fire

Stages 13–30 add a basic enemy-fortress shot as a separate, visible difficulty axis. It targets the foremost living player combatant inside range, can hit ground and flying troops, subtracts the target's defense, and stops immediately when the fortress is destroyed. Stages 1–12 and fortress-less challenges have no enemy-fortress attack.

| Campaign region | Stages | Damage | Range | Interval |
|---|---:|---:|---:|---:|
| Ash highland | 13–18 | 60 | 260 | 2.8 s |
| Spirit tundra | 19–24 | 90 | 290 | 2.4 s |
| Demon rift | 25–30 | 125 | 320 | 2.1 s |

### Advanced troop introduction pacing

| Threat | First stage | First scripted time | Teaching rule |
|---|---:|---:|---|
| Royal Cavalry | 8 | 15.5 s | familiar Raider and Archer waves appear first; Cavalry is last in reinforcement rotation |
| Griffin Rider | 10 | 28.5 s | four familiar formations appear first; no Griffin is used in stages 7–9 |

- Stage 7 immediately after the regional boss contains no Cavalry or Griffin Riders. It deliberately reuses Militia, Crossbows, Guardians, and Brutes as a recovery and roster-check battle.
- Stage 9 repeats Cavalry after its introduction but adds no new movement domain. Stage 10 deploys one Griffin and stage 11 deploys two. Stage 11 is the first stage that combines Cavalry charge pressure with flying-target requirements. Griffin is absent from every repeating reinforcement rotation.

### Campaign beast tuning

| Value | Phase 1 | Phase 2 |
|---|---:|---:|
| Phase entry | battle start after awakening | 55% HP |
| Attack interval multiplier | ×1.00 | ×0.65 |
| Movement multiplier | ×1.00 | ×1.60 |
| Stomp interval | 5.2 s after the initial 3.6 s delay | 3.4 s |
| Stomp damage | trained ATK ×1.05 | trained ATK ×1.55 |

- Shared campaign-beast base stats: 5,200 HP, 82 ATK, 68 range, 1.5 s attack interval, and 20 movement speed.
- Its normal strike cleaves all valid targets in its melee range at full secondary damage.
- Stomp radius is 175, knockback is 55, and its 850 ms warning remains unchanged.
- Bounded rank-5 armor and weapon produce 5,550 HP and 112 ATK before stage modifiers. Campaign boss modifiers are: stage 6 `×1.08 HP / ×1.00 ATK / ×1.00 cadence`, stage 12 `×2.40 / ×1.35 / ×0.82`, stage 18 `×2.44 / ×1.32 / ×0.85`, stage 24 `×3.00 / ×1.40 / ×0.80`, and stage 30 `×3.10 / ×1.48 / ×0.75`. Every campaign boss stands in front of a separately damageable fortress; both must fall. Its weak garrison continues while that fortress survives and stops immediately when it falls. No boss has mastery scaling.

### Beast-only challenges and terrain

| Challenge | Unlock | Repeat gold | Shared base | Terrain HP/ATK/Move | Named HP/ATK/cadence | First clear |
|---|---:|---:|---|---|---|---|
| 오우거 대족장 | stage 6 | 400 | 오우거 파쇄자 | ×10 / ×2.5 / ×1 | ×1.5 / ×1 / ×0.92 | 오우거 파쇄자 |
| 월식의 늑대왕 | stage 12 | 700 | 다이어울프 | ×10 / ×2.5 / ×1.25 | ×12 / ×1.1 / ×0.78 | 다이어울프 |
| 폭풍의 대정령 | stage 18 | 1,000 | 폭풍 정령 | ×10 / ×2.5 / ×1.15 | ×8 / ×1.05 / ×0.68 | 폭풍 정령 |
| 룬 심장의 파수자 | stage 24 | 1,400 | 룬 골렘 | ×10 / ×2.5 / ×0.9 | ×3 / ×1.1 / ×0.62 | 룬 골렘 |
| 심연의 마염수 | stage 27 | 1,800 | 마염견 | ×10 / ×2.5 / ×1.2 | ×12 / ×1.05 / ×0.56 | 마염견 |
| 태양 감옥의 이프리트 | stage 30 | 2,400 | 이프리트 | ×10 / ×2.5 / ×1.1 | ×4/3 / ×8/9 / ×0.52 | 이프리트 |
| 창공의 고룡 | stage 30 | 3,000 | 창공의 고룡 | ×10 / ×2.5 / ×1.15 | ×8/9 / ×28/45 / ×0.48 | 창공의 고룡 |

Challenges contain no enemy fortress, fortress fire, waves, reinforcements, or elite. The enemy is derived from the same base troop later granted to the player, then receives rank-5 stage equipment, the visible terrain multipliers, and its named-boss modifier. The common HP ×10 terrain rule remains legible while the named modifier preserves progression; combined pre-equipment HP multipliers in unlock order are ×15, ×120, ×80, ×30, ×120, ×40/3, and ×80/9. Their trained HP rises through approximately 20,250 / 28,200 / 72,000 / 124,200 / 153,000 / 264,000 / 240,000; the last two are parallel finale challenges rather than a strict internal ordering. The stage-6 through stage-27 rewards deliberately mix 2-, 3-, and 4-star troops, while only the two stage-30 encounters grant 5-star transcendents. Because the apex stat capstone now contributes three equipment ranks instead of one, the 4-star Rune Golem receives the same fixed-rank stat capstone before its named modifier. Challenge 104 uses ×4/3 HP and ×8/9 ATK to preserve 264,000 trained HP and its prior attack pressure. Challenge 105 likewise uses ×8/9 HP and ×28/45 ATK, preserving 240,000 trained HP and 672 trained attack. Every challenge boss also uses a presentation-only 1.5× battlefield scale and the shared 1.08× phase-two visual growth; those multipliers are deliberately excluded from hit geometry and all threat calculations. First-clear acquisition is persistent and does not advance the campaign; the acquired troop never receives terrain or named-boss multipliers. Listed battle gold is repeatable and defeat still grants 20%.

### Continuous enemy reinforcements

After the scripted opening waves, every non-boss stage cycles through the following production pattern. A due reinforcement is skipped while the living-enemy cap is full; production checks continue at the listed interval. Boss sieges use the much lighter garrison rows instead and stop producing if their fortress falls.

| Stage | Start | Interval | Rotation | Living-enemy cap |
|---:|---:|---:|---|---:|
| 1 | 34 s | 3.5 s | Raider → Militia | 6 |
| 2 | 32 s | 3.2 s | Guardian → Raider → Bulwark | 7 |
| 3 | 33 s | 3.0 s | Archer → Guardian → Crossbow | 8 |
| 4 | 36 s | 2.8 s | Lancer → Crossbow → Bulwark | 9 |
| 5 | 48 s | 2.8 s | Raider → Bulwark → Crossbow → Swordsman → Lancer | 9 |
| 6 | 5 s | 8.5 s | Raider → Militia | 4 |
| 7 | 34 s | 2.0 s | Militia → Crossbow → Guardian → Swordsman | 15 |
| 8 | 34 s | 1.95 s | Raider → Archer → Lancer → Crossbow → Royal Cavalry | 15 |
| 9 | 37 s | 1.9 s | Guardian → Royal Cavalry → Militia → Lancer → Bulwark | 16 |
| 10 | 39 s | 1.85 s | Bulwark → Crossbow → Guardian → Swordsman | 16 |
| 11 | 39 s | 1.8 s | Royal Cavalry → Bulwark → Crossbow → Swordsman → Lancer | 16 |
| 12 | 5 s | 6.5 s | Militia → Raider → Archer | 5 |

- Later boss garrisons are stage 18 `Raider → Goblin Archer / 6.8 s / cap 5`, stage 24 `Scout → Frost Spirit / 6.5 s / cap 5`, and stage 30 `Imp → Militia / 6.2 s / cap 6`; all begin at 5 seconds.
- Every non-boss stage from 13–29 starts reinforcements at 55 seconds. Its rotation combines two regional foundation troops with up to four most recently introduced regional troops, excluding every 4–5-star unit. The strength-adjusted interval prevents the new regional roster from becoming a hidden pressure spike:

| Stages | Reinforcement intervals |
|---|---|
| 13–17 | 2.0 / 3.8 / 4.0 / 3.8 / 2.7 s |
| 19–23 | 2.5 / 4.3 / 4.6 / 3.8 / 2.6 s |
| 25–29 | 3.3 / 4.0 / 3.8 / 2.3 / 2.3 s |

- Non-boss stages 13–20 cap living reinforcement bodies at 15, non-boss stages 21–28 at 16, and stage 29 at 17. Ash-highland rotations are rooted in Raiders and Bulwarks, spirit-tundra rotations in Guardians and Archers, and demon-rift rotations in Imps and Crossbows. Recently introduced Trolls, Minotaurs, Spirits, Demon Guards, and Mages can therefore recur at a lower cadence, while Hydras, Griffins, Treants, Golems, Cerberus, Reapers, Abyss Knights, Ifrit, and Ancient Sky Dragon remain finite scripted or challenge threats.

- Enemy equipment reaches the shared +5/+5/+5 cap at stage 7. Later difficulty uses composition, advanced mechanics, reinforcement timing/caps, fortress HP and fire, and boss patterns rather than additional generic stat multipliers.

### Elite defenders and midfield commanders

Stages 2, 3, 4, 5, and 7–11 place one named elite at 86% of the route. Each normal stage from 13–17 places two at 55% and 86%; every normal stage from 19–29 places three at 38%, 64%, and 87%. Campaign stages 6/12/18/24/30 use a boss and fortress garrison instead of midfield elites. Every elite starts from a stage-trained shared troop, is forced to one body, and then applies only its explicit `eliteGuards` position and HP/ATK/DEF modifiers. The map exposes every name and the count but hides equipment ranks and modifier numbers.

The hardened eastern elites at stages 7–11 retain HP/ATK/flat-DEF profiles `1.45/1.22/+4`, `1.95/1.30/+4`, `2.25/1.42/+4`, `1.50/1.24/+5`, and `1.55/1.27/+6`; stage 4's Ogre profile is now `1.35/1.12/+2`. Late commanders are selected from already introduced regional troops of grade 1–3 so a legendary base body cannot create an accidental difficulty spike. With `progress = stage - 13`, their common target before position scaling is HP `1,500 + progress × 180`, ATK `60 + progress × 4`, and flat defense `5 + floor(progress / 3)`. Front/middle/rear position scales are ×0.9/×1.0/×1.1 as applicable. The generator converts those targets into explicit multipliers against rank-5 trained stats; it never changes the recruitable definition.

The estimator sums every elite's trained threat with a ×1.2 prepared-position premium. This modest premium accounts for predeployment while avoiding double-counting their already-authored target stats; dispersed lines are normally defeated sequentially rather than simultaneously.

## 7. Automated difficulty model

`yarn balance` is a standalone design audit and is deliberately not part of `yarn build` or the normal `yarn test` suite. It runs the campaign-curve check, shared-roster Command-efficiency check, and focused-upgrade progression stress report against live data, printing their tables when console interception is disabled.

The pure estimator in `src/game/difficulty.ts` combines seven axes:

- objective durability from fortress HP at `HP / 5`, reflecting that every campaign battle—including boss sieges—retains a real fortress damage window;
- enemy-fortress fire from its damage per second weighted by range, applied only to stages whose fortress can actually shoot;
- battlefield endurance from half of the virtual distance beyond the stage-1 baseline, representing the extra travel and reinforcement window;
- scripted-army pressure from trained unit threat, squad expansion, spawn timing, movement domain, single/pierce/cleave/splash/directional/ground-burst geometry, guard interception, attack windup/recovery commitment, close-range dead zones, and support healing per second;
- recurring pressure from reinforcement composition, interval, and living-enemy cap;
- explicit elite HP, attack, and defense modifiers;
- boss durability, damage, phase pressure, and stage stomp cadence.

Long scripted timelines use the square root of total deployment mass so a sequence that can be defeated piecemeal does not count as if every body arrived simultaneously. The resulting raw totals are normalized from stage 1 = 0 to the final stage = 100 and compared with equal linear targets. The audit requires strict monotonic growth, maximum target deviation ≤16, linear-fit R² ≥0.92, and every adjacent step between 0.3× and 2.2× the ideal step. There is no hand-authored stage difficulty value, preventing the check from proving itself circularly or the UI from merely repeating the stage number.

The map uses the same analyzed threat index for its player-facing tier. Index ≤15 is `낮음`, ≤32 `보통`, ≤60 `높음`, ≤82 `매우 높음`, and anything above is `극한`. Challenge totals are evaluated against the same campaign stage-1-to-stage-30 range, so exceptionally strong beasts naturally remain in `극한`. The map shows only the tier and five-step marker; the numeric index is available as explanatory hover text rather than a fake stage-like fraction.

Opening waves measure complete deployments including squad-size capstones. Reinforcement pressure instead measures per-body threat because `maxAlive` already limits the number of living bodies; multiplying squad size there would count the same deployment bonus twice.

### Command-efficiency audit

`scripts/unit-efficiency.test.ts` estimates each base deployment as `estimateUnitThreat(unit) × squadSize`, then divides by its Command cost. The shared threat estimate accounts for effective HP, flat defense, DPS, healing per second, range, movement, flying/charge/anti-large traits, all implemented attack geometries, guard interception/attenuation, windup commitment, and minimum-range exposure. Every troop costing at least 150 Command must score at least 1.0 estimated threat per Command, and no base troop may cost more than the unupgraded 200 maximum Command.

The current 150+ Command range runs from the Ogre Crusher at 1.25 estimated threat per Command to the post-finale Ancient Sky Dragon at 16.33. This is a minimum-value regression guard, not a promise that the estimator perfectly orders every matchup: target motion during windup, dead-zone screening, focus fire, path congestion, active-body limits, aerial counter availability, and real area density still require playtesting. Ifrit and Ancient Sky Dragon are gated behind stage 30 challenges 104 and 105, full-base-capacity 200 Command costs, one-body deployments, long cooldowns, and living caps of two and one rather than being treated as ordinary campaign recruits.

### Focused-upgrade progression stress report

The map tier and campaign curve measure absolute enemy pressure. They intentionally do not read a particular save's equipment, mastery, formation, repeat farming, or achievement claims, so a linear campaign curve alone cannot prove that player progression is smooth.

`scripts/progression-power.test.ts` models an adversarial early build with these assumptions:

- start with 100 gold;
- win each earlier stage once and collect both its battle reward and explicit first-clear gold;
- spend no gold on recruitment, heroes, fortress research, or other equipment;
- put the entire available budget into one equipment branch of one currently granted core troop;
- ignore mastery, achievements, repeat battles, active hero value, and tactical counters;
- compare the best deployment threat per Command with the same stage-pressure total used by the campaign audit.

| Entering stage | Lifetime budget | Best rush | Bodies | Power vs base | Enemy pressure / rush power |
|---:|---:|---|---:|---:|---:|
| 1 | 100 | Militia weapon +1 | 3 | ×1.09 | 290.2 |
| 2 | 200 | Militia weapon +2 | 3 | ×1.18 | 357.1 |
| 3 | 400 | Militia weapon +3 | 3 | ×1.27 | 434.4 |
| 4 | 1,000 | Militia weapon +5 | 4 | ×1.93 | 456.6 |
| 5 | 1,400 | Militia weapon +5 | 4 | ×1.93 | 519.1 |
| 6 | 2,400 | Militia weapon +5 | 4 | ×1.93 | 663.0 |

The stress case remains real: before stage 4, the optimized Militia build jumps from weapon +3 to +5 and receives its free fourth body, increasing deployment power to ×1.93 of base. The rebalanced encounter now raises pressure per optimized power from 434.4 to 456.6, a ×1.05 step, instead of allowing the capstone to erase the increase. At +5, weapon stats alone account for ×1.45 base power and the 3→4 body capstone multiplies that by another ×1.33.

This is a conservative finding: seven total stage-1 wins generate 700 battle gold on top of the starting 100, enough to buy the 750-gold Militia branch before entering stage 2. Achievements can accelerate it further. Repeated farming is allowed to make later battles easier, but the current free-body breakpoint is strong enough that the absolute campaign curve must not be presented as a player-relative guarantee.

The stress test now enforces a bounded early progression band: every tested stage-to-stage relative-pressure step must remain between ×0.95 and ×1.35, and stage 4 must retain at least ×1.05 despite the equipment capstone. It continues to print the full report so later economy or capstone changes cannot hide a new cliff behind a passing absolute campaign curve.

## 8. Achievement rewards

Each row lists aligned `target / Gold / Royal Gem` sequences. Every threshold is an independently claimable achievement; existing identifiers remain stable for saved claimed/unclaimed state.

| Series | Targets | Gold rewards | Royal Gem rewards |
|---|---|---|---|
| Enemy kills | 1 / 25 / 100 / 250 / 500 / 1,000 / 2,500 / 5,000 | 40 / 100 / 280 / 500 / 750 / 1,500 / 2,500 / 5,000 | 2 / 5 / 15 / 20 / 25 / 50 / 75 / 120 |
| Victories | 1 / 5 / 10 / 25 / 50 / 100 / 250 | 80 / 250 / 500 / 1,000 / 1,500 / 2,500 / 5,000 | 3 / 12 / 18 / 35 / 50 / 80 / 150 |
| Boss wins | 1 / 3 / 5 / 10 | 400 / 800 / 1,200 / 2,500 | 25 / 35 / 50 / 90 |
| Maximum win streak | 3 / 5 / 10 / 20 | 220 / 400 / 900 / 2,000 | 8 / 15 / 30 / 70 |
| Defeats | 3 / 10 / 25 / 50 | 100 / 250 / 500 / 1,000 | 3 / 8 / 15 / 30 |
| Soldier deaths | 25 / 100 / 500 / 1,000 | 140 / 350 / 900 / 1,800 | 4 / 12 / 30 / 55 |
| Hero deaths/returns | 3 / 10 / 25 / 50 | 130 / 350 / 750 / 1,500 | 5 / 12 / 25 / 45 |
| Summons | 10 / 50 / 100 / 250 / 500 / 1,000 / 2,500 | 80 / 180 / 300 / 500 / 800 / 1,200 / 2,500 | 3 / 7 / 10 / 18 / 28 / 40 / 80 |
| Hero skill uses | 5 / 15 / 50 / 100 / 200 / 500 | 90 / 180 / 400 / 650 / 900 / 2,000 | 4 / 8 / 15 / 22 / 30 / 65 |
| Fortress bombardments | 1 / 10 / 50 / 100 / 200 / 500 | 60 / 160 / 400 / 650 / 900 / 2,000 | 2 / 7 / 15 / 22 / 30 / 65 |
| Battles | 1 / 10 / 25 / 50 / 100 / 250 | 50 / 220 / 500 / 900 / 1,800 / 4,000 | 2 / 10 / 18 / 30 / 55 / 110 |
| Codex entries | 10 / 30 / 45 / 59 | 100 / 180 / 350 / 600 | 6 / 12 / 24 / 40 |

- The codex ladder uses 10 entries, `ceil(CODEX_TOTAL × 0.5)`, `ceil(CODEX_TOTAL × 0.75)`, and `CODEX_TOTAL`; with the current 59-entry codex these resolve to 10/30/45/59.
- The 64 definitions remain presented as twelve compact series by default, with the full list available as an alternate view.

## 9. Balance change workflow

1. Change structured values under `src/data` or a pure formula under `src/game`.
2. Update this document in the same change.
3. Update affected assertions or add a regression test.
4. Run `yarn balance` for any combat, stage, enemy, boss, objective, troop-stat, squad-size, attack-pattern, or Command-cost change and inspect its failures rather than weakening thresholds by default.
5. Run `yarn lint`, `yarn test`, and `yarn build`.
6. Record material curve changes in the changelog in `docs/GAME_SPEC.md`.
