# Last Bastion — Balance Reference

Last updated: 2026-09-16

This is the canonical reference for implemented economy, progression, combat, and campaign numbers. Change this file in the same commit as any balance value. Product behavior and architecture remain canonical in `docs/GAME_SPEC.md`.

## 1. Currency economy

| Currency | Initial | Sources | Current sinks |
|---|---:|---|---|
| Gold | 100 | battles, first-clear rewards, achievement claims | troop recruitment, equipment, heroes, hero training, fortress research |
| Royal Gems | 0 | daily attendance, achievement claims | permanent 1.5× battle-speed license |

- Royal Gems are currently non-purchasable with real money. There is no recharge, payment, or currency-exchange path.
- Daily attendance grants 10 Royal Gems once per browser-local calendar date.
- The claimed date persists as `YYYY-MM-DD`. Changing the device clock is not prevented because progression is local-only.
- The `수수께끼 상인` shop is revealed after the stage-6 campaign boss clear. It sells `전투 가속 허가` for 200 Royal Gems once; the map operations button only enters the shop. The license permanently unlocks a persisted 1×/1.5× battle toggle. The purchase is idempotent and the speed applies to simulation time, timer events, and combat tweens; BGM tempo is not changed.
- At daily income alone the license represents 20 claims. Achievement rewards shorten this, including 25 Royal Gems from the first-boss achievement itself. A future verified cash entitlement may bypass both the currency price and stage gate, but no payment implementation currently exists.

Hero Training Ground unlocks from the stage-9 first clear. It supplements rather than replaces battle-earned hero mastery XP and refuses purchases at the level-30 cap.

Fortress economy research applies only to combat progression: each `전리품 회계` rank multiplies repeat and first-clear battle Gold by 1.05, and each `왕립 야전 교범` rank multiplies soldier and hero battle mastery XP by 1.05. Both cap at ×1.25 at rank 5 and round to the nearest whole value. Achievement Gold, daily rewards, recruitment costs, and paid Hero Training packages are not multiplied.

| Training package | Gold cost | Hero XP | Gold per XP |
|---|---:|---:|---:|
| 야전 훈련 | 250 | 100 | 2.50 |
| 전술 교습 | 1,000 | 500 | 2.00 |
| 왕실 전수 | 2,500 | 1,500 | 1.67 |

## 2. Shared troop base stats

Player and enemy troops use the same 50 base definitions. Player equipment/mastery or the stage's enemy equipment profile is applied afterward. Enemy forces never receive mastery. `src/data/units.ts` is the exhaustive numeric source; the table below preserves the original foundation and challenge-signature values, while the family matrix records the complete implemented roster.

| Family | Count | Roster |
|---|---:|---|
| Kingdom | 11 | Militia, Guardian, Archer, Lancer, Cavalry, Swordsman, Pikeman, Scout, Priest, Mage, Archmage |
| Betrayer | 2 | Crossbow, Assassin |
| Goblin | 4 | Raider, Poison Archer, Bomber, Wolf Rider |
| Orc | 3 | Bulwark, Berserker, Shaman |
| Ogre | 2 | Crusher, Ogre Mage |
| Beast/monster | 12 | Griffin, Troll, Harpy, Minotaur, Wyvern, Slime, Basilisk, Direwolf, Giant Eagle, Treant, Golem, Hydra |
| Spirit | 6 | Storm, Fire, Frost, Earth, Radiance, Shadow |
| Demon | 10 | Hellhound, Imp, Succubus, Guard, Mage, Gargoyle, Cerberus, Ifrit, Reaper, Abyss Knight |

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
| 오우거 파쇄자 | 140 | 1 | 440 | 45 | 52 | 1500 ms | 25 | 4.3 s | challenge 101 | cleave, ×0.80 secondary |
| 그리폰 기수 | 195 | 1 | 520 | 82 | 58 | 1050 ms | 78 | 6.5 s | 1,500 | cleave, ×0.85 secondary |
| 폭풍 정령 | 125 | 1 | 130 | 31 | 185 | 1150 ms | 58 | 4.5 s | challenge 102 | pierce 2, ×0.70 follow-through |
| 마염견 | 135 | 1 | 235 | 42 | 46 | 900 ms | 76 | 4.8 s | challenge 103 | cleave, ×0.65 secondary |
| 왕국 마법사 | 115 | 1 | 110 | 36 | 195 | 1300 ms | 37 | 3.5 s | encounter | pierce 2, ×0.65 follow-through |
| 대마법사 | 190 | 1 | 200 | 78 | 245 | 1600 ms | 31 | 5.5 s | encounter | pierce 3, ×0.70 follow-through |
| 이프리트 | 200 | 1 | 430 | 72 | 215 | 1650 ms | 42 | 6.6 s | challenge 104 | pierce 3, ×0.75 follow-through |

- A new profile owns and equips only the militia.
- Battle formations contain one to four acquired troop types.
- Command and cooldown are paid once per card activation. One Militia/Raider activation creates three bodies and one Guardian/Archer activation creates two; a wave's `count` likewise counts activations before squad expansion. Mastery summon counts track the activation rather than multiplying XP per body.
- Encounter alone does not bypass fortress recruitment permits: expansion troops below 110 Command default to tier 2 and troops at or above 110 default to tier 3. Royal Cavalry is revealed and recruitable at tier 2 without an encounter; Griffin Rider follows the same rule at tier 3. Ogre Crusher, Storm Spirit, Hellhound, and Ifrit are challenge-only recruits. Already-owned troops remain owned when an older save migrates.
- Lancer and Huntress attacks deal ×1.75 damage to `large` targets.
- Royal Cavalry has 3 base defense and its first attack after each spawn deals ×1.6 damage. Griffin Rider has 6 base defense, is tagged `flying` and `large`, and moves 112 virtual pixels above the lane. It is intentionally stronger than the Wyvern in HP and stronger than Ifrit in per-hit melee damage, but consumes 195 Command, waits 6.5 seconds between deployments, and must enter melee range.
- Only attackers tagged `ranged` and the fortress watchtower can select a flying target. Fortress bombardment and beast stomp skip flying targets; flying units can attack ground targets normally.
- Defense is subtracted from incoming damage after bonuses; final damage has a minimum of 1.
- Pierce starts with the selected primary target, then selects the nearest valid targets farther along the attack direction inside its follow-through distance. Cleave selects all valid targets inside the attacker's normal melee range. Every secondary target receives the listed multiplier.
- Archer versus Crossbow is an explicit tradeoff rather than a faction advantage. An Archer deployment has two bodies, 215 range, and higher combined single-target pressure. A Crossbow deployment has one tougher body, 160 range, a slower 1.45-second attack, and a stronger 36-damage bolt; its total volley exceeds the Archer deployment only when a second target lines up for the capped two-target pierce. High per-shot damage also loses less of its proportion to flat defense, while the Archer remains safer and stronger against one target.
- Priest is the symmetric healer for both factions: 105 Command, 145 HP, 1 defense, 20 attack, 175 attack range, 34 healing at 190 range, and a 1.25-second shared action interval. It heals the in-range non-boss ally with the greatest missing HP before attacking and cannot overheal; bosses are deliberately excluded so a producing garrison cannot sustain an unbounded boss-healing loop. Weapon equipment and mastery attack growth add the same flat amount to healing power. The unit-threat estimator values its healing per second at a 1.35 support coefficient.

### Upper-tier value corrections

The expensive roster was rebalanced against Command cost rather than rarity alone. These are the current corrected values for previously inefficient upper-tier troops; omitted columns retain their canonical values in `src/data/units.ts`.

| Troop | Command | HP | DEF | ATK | Interval |
|---|---:|---:|---:|---:|---:|
| 대마법사 | 190 | 200 | 3 | 78 | 1.60 s |
| 트롤 | 155 | 620 | 4 | 48 | 1.40 s |
| 오우거 마도사 | 175 | 450 | 3 | 68 | 1.50 s |
| 바실리스크 | 165 | 420 | 6 | 58 | 1.25 s |
| 룬 골렘 | 195 | 820 | 9 | 60 | 1.65 s |
| 늪지 히드라 | 200 | 720 | 4 | 60 | 1.45 s |
| 이프리트 | 200 | 430 | 4 | 72 | 1.65 s |
| 영혼 수확자 | 195 | 280 | 3 | 78 | 1.35 s |
| 심연 기사 | 200 | 640 | 9 | 60 | 1.25 s |

### Simultaneous legendary deployment limits

`maxActivePerSide` limits living bodies of one troop ID independently for each faction. It applies to player summons, scripted enemy waves, and reinforcements. A rank-5 equipment capstone fills only the remaining capacity: for example, a two-body deployment into a limit of two creates one body if one is already alive, while still consuming the card activation. Ordinary troops have no such limit.

| Limit | Troops |
|---:|---|
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

Expansion troops created through `makeTroop` derive readable fixed growth once at data construction: weapon `max(2, round(base ATK × 0.10))`, armor HP `max(12, round(base HP × 0.10))`, armor defense `+1.5` when the base has defense or `+1` otherwise, and boots `max(1, base move × 0.03 rounded to one decimal)`. Their equipment price base is 75 below 100 Command, 100 from 100–149, and 125 from 150 upward. These become ordinary fixed values on the resulting definition; combat never reapplies the formula.

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
| 파쇄자 | +5 | +42 | +1.8 | +1.0 |
| 그리폰 기수 | +8 | +55 | +2.0 | +2.2 |
| 폭풍 정령 | +4 | +18 | +0.8 | +2.0 |
| 마염견 | +5 | +28 | +1.2 | +2.2 |
| 에드릭 | +3 | +42 | +2.0 | +1.2 |
| 셀레네 | +5 | +24 | +1.0 | +1.4 |
| 리아 | +5 | +28 | +1.2 | +1.8 |
| 공성 마수 | +6 | +70 | +2.0 | +0.8 |

- Equipment cost: `equipmentCostBase × (currentLevel + 1)` for all three slots.
- Militia and Raider use base 50: 50 / 100 / 150 / 200 / 250 gold.
- Guardian, Archer, Lancer, Bulwark, and Crossbow use base 75: 75 / 150 / 225 / 300 / 375 gold.
- Royal Cavalry, Ogre Crusher, Storm Spirit, and Edric use base 100: 100 / 200 / 300 / 400 / 500 gold.
- Griffin Rider, Hellhound, Selene, Ria, and Mirena use base 125: 125 / 250 / 375 / 500 / 625 gold.
- Bran uses base 150: 150 / 300 / 450 / 600 / 750 gold.
- Soldier equipment capstone: when any one of Weapon, Armor, or Boots reaches rank 5, that troop's deployment size permanently increases by 1. Completing additional slots does not add more bodies. The rule applies symmetrically to stage-equipped regular enemies, while heroes, bosses, and explicitly single-body elite guards remain at one body. Enemy reinforcement `maxAlive` remains an exact living-body cap rather than a deployment count.
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
| 파쇄자 | +18 | +3 |
| 그리폰 기수 | +7 | +2 |
| 폭풍 정령 | +6 | +2 |
| 마염견 | +9 | +2 |

## 4. Heroes

| Hero | HP | ATK | Range | Attack interval | Move | Skill cooldown | Respawn | Unlock gold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 에드릭 | 520 | 29 | 42 | 900 ms | 40 | 25 s | 20 s | starting |
| 셀레네 | 285 | 43 | 190 | 1250 ms | 37 | 22 s | 18 s | 500 |
| 리아 | 350 | 48 | 230 | 1050 ms | 47 | 24 s | 16 s | 800 |
| 미레나 | 330 | 24 | 185 | 1200 ms | 38 | 23 s | 17 s | 1,200 |
| 브란 | 455 | 39 | 46 | 950 ms | 52 | 24 s | 19 s | 1,800 |

- Edric: normal attacks cleave at ×0.70 secondary damage; nearby non-hero troops take 15% less damage; active grants 100 shield.
- Selene: attacks splash for 35%; active meteor deals 240 area damage and 160 damage to a fortress caught in the impact.
- Ria: normal attacks pierce up to three targets at ×0.80 follow-through damage; ×1.75 damage to large targets; active deals 105 to every active normal enemy or 155 to a boss.
- Mirena: base attacks give way to a 58-point heal at 215 range whenever a nearby ally is injured; active heals allies within 240 range for 150 and the player fortress for 100.
- Bran: first charge deals ×1.60 damage and normal attacks cleave at ×0.72 secondary damage; active gives allies within 220 range 85 shield.

Hero mastery is deliberately stronger than troop mastery and also improves each active skill and respawn cadence. Every entry below is a fixed gain per mastery rank after level 1. Hero mastery stops at level 30.

| Hero | HP | ATK | Active per rank | Active per awakening | Respawn per rank | Maximum respawn reduction |
|---|---:|---:|---|---|---:|---:|
| 에드릭 | +24 | +2 | shield +10 | shield +50 | -0.30 s | -7.0 s (13.0 s final) |
| 셀레네 | +14 | +3 | meteor +16; fortress +10 | meteor +100; fortress +60 | -0.25 s | -6.3 s (11.7 s final) |
| 리아 | +17 | +3 | normal target +8; boss +12 | normal +45; boss +65 | -0.22 s | -5.6 s (10.4 s final) |
| 미레나 | +16 | +2 | ally heal +10; fortress +6 | ally +60; fortress +40 | -0.24 s | -6.0 s (11.0 s final) |
| 브란 | +21 | +3 | shield +8 | shield +40 | -0.28 s | -6.5 s (12.5 s final) |

Awakenings occur at levels 10, 20, and 30. Each awakening also reduces active cooldown by exactly 1.5 seconds; final cooldowns are 20.5 seconds for Edric, 17.5 seconds for Selene, 19.5 seconds for Ria, 18.5 seconds for Mirena, and 19.5 seconds for Bran. Final level-30 active values are 540 shield, 1,004/630 meteor unit/fortress damage, 472/698 arrow-rain normal/boss damage, 620/394 Mirena ally/fortress healing, and 437 Bran shield.

Each awakening rank also enables one level of a nearby-soldier aura: Edric gives +2 defense per rank within 170, Selene +3 attack within 180, Ria +15 attack range within 210, Mirena +4 HP/s regeneration within 195, and Bran +4 movement speed within 185. At rank III these resolve to +6 defense, +9 attack, +45 range, +12 HP/s, and +12 move respectively. Auras require the selected hero to be alive and do not buff the hero itself.

## 5. Battle and fortress baseline

| Value | Base |
|---|---:|
| Starting Command | 70 |
| Command regeneration | 10/s |
| Maximum Command | 200 |
| Command per normal kill | 6 |
| Full-gauge mobilization | consume 100%; maximum +25; regeneration +1.5/s; 3 uses/battle |
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

Fortress research has five ranks per node. Rank cost is `baseCost × (currentRank + 1)`, so every node has a readable five-step arithmetic sequence. Eighteen nodes provide 90 total purchasable research ranks.

| Fortress tier | Promotion requirement | Promotion cost | New permits |
|---:|---:|---:|---|
| 1 · 변경 요새 | starting | 0 | nine foundation nodes; kingdom regular troops |
| 2 · 왕립 성채 | 8 total research ranks | 1,000 | six tier-2 nodes; Raider, Bulwark, and Royal Cavalry recruitment |
| 3 · 최후의 보루 | 24 total research ranks | 2,500 | three tier-3 nodes; Crossbow and Griffin Rider recruitment |

- Promotion requirements count ranks purchased across all branches.
- A tier-gated node may also require a preceding node. Both conditions must be satisfied; the technology card shows both the required prerequisite rank and the player's current rank.
- Tier and prerequisite checks apply when buying a node's first rank. A node with one or more persisted ranks remains available for later ranks even if its requirements change in a future data revision.
- Save migration raises an inconsistent saved fortress tier to the highest `requiredTier` among nodes with at least one rank; it never lowers a saved tier or removes research.

| Branch | Tier | Node | Base cost | Effect per rank | Prerequisite |
|---|---:|---|---:|---|---|
| Economy | 1 | 전쟁 금고 | 100 | starting Command +25 | — |
| Economy | 1 | 보급로 | 150 | regeneration +2.5/s | 전쟁 금고 1 |
| Economy | 1 | 지휘 저장고 | 200 | maximum Command +40 | 보급로 1 |
| Economy | 2 | 상비군 훈련소 | 250 | summon cooldown -5% | 지휘 저장고 2 |
| Economy | 2 | 군수 표준화 | 300 | soldier Command cost -3% | 지휘 저장고 3 |
| Economy | 2 | 전리품 회계 | 350 | battle and first-clear Gold +5% | 군수 표준화 2 |
| Economy | 2 | 왕립 야전 교범 | 400 | battle-earned mastery XP +5% | 전리품 회계 2 |
| Economy | 3 | 승전 공납제 | 400 | Command per normal kill +2 | 상비군 훈련소 3 |
| Defense | 1 | 강화 성벽 | 100 | fortress HP +250 | — |
| Defense | 1 | 석재 장갑 | 150 | flat damage reduction +3 | 강화 성벽 1 |
| Defense | 1 | 수호 망루 | 200 | tower damage +22; interval improves by 250 ms | 강화 성벽 1 |
| Defense | 2 | 고층 흉벽 | 250 | tower range +45 | 수호 망루 2 |
| Defense | 3 | 재생 석재 | 400 | fortress regeneration +1.5 HP/s | 고층 흉벽 3 |
| Artillery | 1 | 흑색 화약 | 100 | bombardment damage +45 | — |
| Artillery | 1 | 신속 장전 | 150 | cooldown -3 s | 흑색 화약 1 |
| Artillery | 1 | 광역 탄두 | 200 | radius +20 | 흑색 화약 2 |
| Artillery | 2 | 마수 관통탄 | 300 | bombardment boss damage +70 | 광역 탄두 2 |
| Artillery | 3 | 공성 계산학 | 450 | direct enemy-fortress bombardment damage +60 | 마수 관통탄 3 |

- Summon cooldown reduction is capped at 25% through the five available ranks.
- Soldier Command-cost reduction is capped at 15% through the five `군수 표준화` ranks. Effective cost is `max(10, ceil(base Command × (1 - 0.03 × rank)))`; the battle card, affordability check, and actual deduction all use this same value.
- Watchtower interval is floored at 900 ms, and bombardment cooldown is floored at 16 seconds.
- Direct fortress bombardment may be fired at an undefended enemy fortress once `공성 계산학` has at least one rank.

At maximum `군수 표준화`, every one of the 50 deployment costs uses `max(10, ceil(base Command × 0.85))`; cards, affordability checks, and deductions share that calculation.

## 6. Campaign curve

| Stage | Enemy fortress HP | Battle gold | Enemy W/A/B | First-clear reward |
|---:|---:|---:|---|---|
| 1 | 800 | 100 | 0/0/0 | Guardian |
| 2 | 1,100 | 200 | 1/1/0 | Archer |
| 3 | 1,400 | 300 | 2/1/1 | Lancer + 300 gold |
| 4 | 1,800 | 400 | 2/3/1 | Selene |
| 5 | 2,300 | 500 | 4/4/3 | 500 gold |
| 6 | 3,200 | 600 | 5/5/4 | Ria + 800 gold |
| 7 | 3,600 | 700 | 5/5/5 | 700 gold |
| 8 | 3,300 | 800 | 5/5/5 | 800 gold |
| 9 | 3,900 | 900 | 5/5/5 | 900 gold + Hero Training Ground |
| 10 | 4,600 | 1,000 | 5/5/5 | 1,000 gold |
| 11 | 5,400 | 1,100 | 5/5/5 | 1,100 gold |
| 12 | 6,500 | 1,200 | 5/5/5 | Mirena + 1,200 gold |

- Defeat grants 20% of the listed battle gold, rounded down.
- First-clear rewards are granted once per save.
- The campaign contains 30 stages in five six-stage regions. The next region becomes visible after clearing stages 6, 12, 18, and 24.
- Stage metadata identifies seven occupation groupings: traitorous humans, goblins, orcs, monsters, bound spirits, demons, and mixed Demon Army formations. Campaign terrain multipliers remain ×1 for now; visible non-neutral multipliers are reserved for the separate beast challenges and are included by the difficulty estimator.
- Enemy weapon, armor, and boots upgrades are each capped at rank 5. No enemy or boss receives mastery XP, a mastery level, or a mastery multiplier.
- Stages 13–30 keep enemy equipment at 5/5/5. Their battle reward and first-clear gold both equal `stage × 100`; stage 18 additionally grants Bran.
- Each non-boss stage from 13–29 adds three entries from its 15-unit regional roster to the scripted opening. Five normal stages per region therefore expose all 15 entries exactly as an encounter path, while the continuous reinforcement roster remains stable to avoid a late-game pressure spike.

| Stage | Name | Fortress HP | Type |
|---:|---|---:|---|
| 13 | 백은 평원 | 14,500 | army + elite |
| 14 | 바람 절벽 | 15,750 | army + elite |
| 15 | 망각의 초소 | 18,250 | army + elite |
| 16 | 붉은 수로 | 20,750 | army + elite |
| 17 | 용광로 성벽 | 23,250 | army + elite |
| 18 | 잿불 마수의 요새 | 21,500 | boss siege |
| 19 | 서리 벌판 | 29,500 | army + elite |
| 20 | 빙결 관문 | 30,750 | army + elite |
| 21 | 유령 숲 | 33,250 | army + elite |
| 22 | 부서진 첨탑 | 35,750 | army + elite |
| 23 | 백야 성채 | 38,250 | army + elite |
| 24 | 서리 정령수의 왕성 | 36,500 | boss siege |
| 25 | 폭풍 해안 | 44,500 | army + elite |
| 26 | 천둥 협곡 | 45,750 | army + elite |
| 27 | 구름 요새 | 48,250 | army + elite |
| 28 | 왕좌 회랑 | 50,750 | army + elite |
| 29 | 최후의 장벽 | 53,250 | army + elite |
| 30 | 마왕성의 심연수 | 51,500 | boss siege |

Fortress distance is `min(1,390, 1,050 + (stage - 1) × 25)` virtual units. With the player fortress fixed at X 105, the enemy fortress moves from X 1,155 toward the capped X 1,495 position. Stage 14 resolves to 1,375, stage 15 reaches 1,390, and stages 16–30 stay at that maximum. Distance is therefore an early-to-mid-campaign expansion axis rather than an artificial per-stage late-game escalator.

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
- Bounded rank-5 armor and weapon produce 5,550 HP and 112 ATK before stage modifiers. Campaign boss modifiers are: stage 6 `×1.08 HP / ×1.00 ATK / ×1.00 cadence`, stage 12 `×1.90 / ×1.20 / ×0.84`, stage 18 `×2.05 / ×1.18 / ×0.85`, stage 24 `×2.18 / ×1.24 / ×0.80`, and stage 30 `×2.33 / ×1.30 / ×0.75`. Every campaign boss stands in front of a separately damageable fortress; both must fall. Its weak garrison continues while that fortress survives and stops immediately when it falls. No boss has mastery scaling.

### Beast-only challenges and terrain

| Challenge | Unlock | Repeat gold | Shared base | Terrain HP/ATK/Move | Named HP/ATK/cadence | First clear |
|---|---:|---:|---|---|---|---|
| 오우거 대족장 | stage 6 | 400 | 오우거 파쇄자 | ×10 / ×2.5 / ×1 | ×1.5 / ×1 / ×0.92 | 오우거 파쇄자 |
| 폭풍의 대정령 | stage 18 | 1,000 | 폭풍 정령 | ×10 / ×2.5 / ×1.15 | ×8 / ×1.05 / ×0.68 | 폭풍 정령 |
| 심연의 마염수 | stage 30 | 1,800 | 마염견 | ×10 / ×2.5 / ×1.2 | ×12 / ×1.05 / ×0.56 | 마염견 |
| 태양 감옥의 이프리트 | stage 30 | 2,400 | 이프리트 | ×10 / ×2.5 / ×1.1 | ×7.5 / ×1 / ×0.52 | 이프리트 |

Challenges contain no enemy fortress, waves, reinforcements, or elite. The enemy is derived from the same base troop later granted to the player, then receives rank-5 stage equipment, the visible terrain multipliers, and its named-boss modifier. Moving most durability into the common visible HP ×10 terrain rule makes the encounter premise legible while the remaining named modifier preserves progression; combined effective HP multipliers are ×15, ×80, ×120, and ×75 before equipment. These are about 11–29% higher than the previous combined challenge values. First-clear acquisition is persistent and does not advance the campaign; the acquired troop never receives terrain or named-boss multipliers. Listed battle gold is repeatable and defeat still grants 20%.

### Continuous enemy reinforcements

After the scripted opening waves, every non-boss stage cycles through the following production pattern. A due reinforcement is skipped while the living-enemy cap is full; production checks continue at the listed interval. Boss sieges use the much lighter garrison rows instead and stop producing if their fortress falls.

| Stage | Start | Interval | Rotation | Living-enemy cap |
|---:|---:|---:|---|---:|
| 1 | 34 s | 3.5 s | Raider → Militia | 6 |
| 2 | 32 s | 3.2 s | Guardian → Raider → Bulwark | 7 |
| 3 | 33 s | 3.0 s | Archer → Guardian → Crossbow | 8 |
| 4 | 36 s | 2.8 s | Lancer → Crossbow → Brute | 9 |
| 5 | 48 s | 2.8 s | Raider → Bulwark → Crossbow → Brute → Lancer | 9 |
| 6 | 5 s | 8.5 s | Raider → Militia | 4 |
| 7 | 34 s | 2.3 s | Militia → Crossbow → Guardian → Brute | 13 |
| 8 | 34 s | 2.3 s | Raider → Archer → Lancer → Crossbow → Royal Cavalry | 12 |
| 9 | 37 s | 2.3 s | Guardian → Royal Cavalry → Militia → Lancer → Bulwark | 13 |
| 10 | 39 s | 2.2 s | Bulwark → Crossbow → Guardian → Brute | 13 |
| 11 | 39 s | 2.2 s | Royal Cavalry → Bulwark → Crossbow → Brute → Lancer | 12 |
| 12 | 5 s | 8.0 s | Militia → Raider → Archer | 4 |

- Later boss garrisons are stage 18 `Raider → Goblin Archer / 7.8 s / cap 4`, stage 24 `Scout → Frost Spirit / 7.6 s / cap 4`, and stage 30 `Imp → Militia / 7.4 s / cap 5`; all begin at 5 seconds.
- Every non-boss stage from 13–29 starts reinforcements at 55 seconds, rotates Militia → Guardian → Archer → Lancer → Bulwark → Cavalry → Crossbow → Brute, uses a 2.28–2.12 second interval, and caps living regular enemies at 13–15.

- Enemy equipment reaches the shared +5/+5/+5 cap at stage 7. Later difficulty uses composition, advanced mechanics, reinforcement timing/caps, fortress HP, and boss patterns rather than additional generic stat multipliers.

### Elite defenders

Stages 2, 3, 4, 5, 7–11, and every non-boss stage from 13–29 place one named elite near the enemy fortress. Each elite starts from the stage-trained shared troop, is forced to one body, and then applies only the explicit HP/ATK/DEF modifier in `eliteGuard`. Campaign stages 6/12/18/24/30 use a boss instead. The map exposes the elite name but hides all enemy equipment ranks and modifier numbers.

## 7. Automated difficulty model

`yarn balance` is a standalone design audit and is deliberately not part of `yarn build` or the normal `yarn test` suite. It runs the campaign-curve check, shared-roster Command-efficiency check, and focused-upgrade progression stress report against live data, printing their tables when console interception is disabled.

The pure estimator in `src/game/difficulty.ts` combines six axes:

- objective durability from fortress HP at `HP / 5`, reflecting that every campaign battle—including boss sieges—retains a real fortress damage window;
- battlefield endurance from half of the virtual distance beyond the stage-1 baseline, representing the extra travel and reinforcement window;
- scripted-army pressure from trained unit threat, squad expansion, spawn timing, movement domain, attack pattern, and support healing per second;
- recurring pressure from reinforcement composition, interval, and living-enemy cap;
- explicit elite HP, attack, and defense modifiers;
- boss durability, damage, phase pressure, and stage stomp cadence.

Long scripted timelines use the square root of total deployment mass so a sequence that can be defeated piecemeal does not count as if every body arrived simultaneously. The resulting raw totals are normalized from stage 1 = 0 to the final stage = 100 and compared with equal linear targets. The audit requires strict monotonic growth, maximum target deviation ≤16, linear-fit R² ≥0.92, and every adjacent step between 0.3× and 2.2× the ideal step. There is no hand-authored stage difficulty value, preventing the check from proving itself circularly or the UI from merely repeating the stage number.

The map uses the same analyzed threat index for its player-facing tier. Index ≤15 is `낮음`, ≤35 `보통`, ≤60 `높음`, ≤82 `매우 높음`, and anything above is `극한`. Challenge totals are evaluated against the same campaign stage-1-to-stage-30 range, so exceptionally strong beasts naturally remain in `극한`. The map shows only the tier and five-slot marker; the numeric index is available as explanatory hover text rather than a fake stage-like fraction.

Opening waves measure complete deployments including squad-size capstones. Reinforcement pressure instead measures per-body threat because `maxAlive` already limits the number of living bodies; multiplying squad size there would count the same deployment bonus twice.

### Command-efficiency audit

`scripts/unit-efficiency.test.ts` estimates each base deployment as `estimateUnitThreat(unit) × squadSize`, then divides by its Command cost. The shared threat estimate accounts for effective HP, flat defense, DPS, healing per second, range, movement, flying/charge/anti-large traits, and pierce or cleave reach. Every troop costing at least 150 Command must score at least 1.0 estimated threat per Command, and no base troop may cost more than the unupgraded 200 maximum Command.

The current upper-tier range runs from the Treant at 1.03 to the Griffin Rider at 1.95. This is a regression guard, not a promise that the estimator perfectly orders every matchup: focus fire, path congestion, aerial counter availability, and real cleave density still require playtesting.

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
| 1 | 100 | Militia weapon +1 | 3 | ×1.09 | 282.0 |
| 2 | 200 | Militia weapon +2 | 3 | ×1.18 | 370.1 |
| 3 | 400 | Militia weapon +3 | 3 | ×1.27 | 483.2 |
| 4 | 1,000 | Militia weapon +5 | 4 | ×1.93 | 487.4 |
| 5 | 1,400 | Militia weapon +5 | 4 | ×1.93 | 560.9 |
| 6 | 2,400 | Militia weapon +5 | 4 | ×1.93 | 699.8 |

The finding confirms an early progression cliff. From stage 3 to stage 4, enemy pressure rises by 53.5%, but the optimized Militia build rises from weapon +3 to +5 and receives its free fourth body, increasing deployment power by roughly 52%. Relative pressure therefore rises only from 483.2 to 487.4, or about 0.9%, instead of delivering the intended difficulty step. At +5, weapon stats alone account for ×1.45 base power and the 3→4 body capstone multiplies that by another ×1.33, producing ×1.93 together.

This is a conservative finding: seven total stage-1 wins generate 700 battle gold on top of the starting 100, enough to buy the 750-gold Militia branch before entering stage 2. Achievements can accelerate it further. Repeated farming is allowed to make later battles easier, but the current free-body breakpoint is strong enough that the absolute campaign curve must not be presented as a player-relative guarantee.

The stress test currently characterizes and reports this known risk rather than silently declaring it balanced. A future capstone/economy change should replace the characterized stage-4 cliff expectations with a maximum relative-power-spike gate.

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
| Codex entries | 10 / 28 / 42 / 56 | 100 / 180 / 350 / 600 | 6 / 12 / 24 / 40 |

- The codex ladder uses 10 entries, `ceil(CODEX_TOTAL × 0.5)`, `ceil(CODEX_TOTAL × 0.75)`, and `CODEX_TOTAL`; with the current 56-entry codex these resolve to 10/28/42/56.
- The 64 definitions remain presented as twelve compact series by default, with the full list available as an alternate view.

## 9. Balance change workflow

1. Change structured values under `src/data` or a pure formula under `src/game`.
2. Update this document in the same change.
3. Update affected assertions or add a regression test.
4. Run `yarn balance` for any combat, stage, enemy, boss, objective, troop-stat, squad-size, attack-pattern, or Command-cost change and inspect its failures rather than weakening thresholds by default.
5. Run `yarn lint`, `yarn test`, and `yarn build`.
6. Record material curve changes in the changelog in `docs/GAME_SPEC.md`.
