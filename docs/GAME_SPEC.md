# Last Bastion — Living Game Specification

Last updated: 2026-09-16

This is the canonical specification for the game currently present in this repository. Future developers and AI agents must keep it synchronized with the code.

Numerical economy, reward, progression, combat, and difficulty values are canonical in `docs/BALANCE.md`; update both documents when a number also appears here as product context.

## 1. Product identity

- Title: **Last Bastion — 최후의 성채**
- Genre: single-player 2D side-view lane strategy and siege game
- Platform: desktop and mobile web browsers
- Core promise: lead the Last Bastion's counteroffensive, build a line with timed summons, and reclaim a continent occupied by the Demon King's armies
- Visual direction: original low-fantasy presentation combining Phaser primitives, CSS, and project-owned illustrated character atlases; no borrowed game assets

The campaign begins immediately before the Demon King's conquest becomes complete. The surviving kingdom counterattacks from its final fortress, retaking five regions from traitorous human armies, goblin and orc tribes, ogres and other monsters, bound elementals, and demons before reaching the rift beneath the Demon King's seat. Large hostile bosses are called `마수` in current Korean UI and content; `거신` is not a current setting term.

## 2. Player loop

1. Open the kingdom map and choose an unlocked campaign stage.
2. Claim the once-per-local-day Royal Gem attendance reward when available.
3. Recruit encountered troop types, choose up to four troops and one hero, improve equipment with gold, and grow mastery through battle use.
4. Enter battle with the selected hero deployed for free.
5. Regenerate Command and spend it to summon soldiers.
6. Use the hero skill and castle ability at tactically useful moments.
7. Destroy the enemy fortress or defeat the boss before the player fortress falls.
8. Receive gold and mastery XP, claim a one-time first-clear reward, record new codex discoveries, unlock achievements and the next stage, and invest gold into equipment, heroes, or fortress research.

## 3. Battle rules

Status: **Implemented**.

- The battlefield is one horizontal lane.
- The player fortress remains at the far left. The enemy objective starts closer in early campaign stages and moves toward the far-right maximum as campaign stage numbers rise.
- Units automatically walk toward the enemy, stop in range, attack, acquire a new target after a kill, and resume walking.
- Soldiers are faction-neutral. A soldier has one canonical base stat record and behaves identically on either side; only progression or stage training modifiers differ.
- Basic troops deploy as squads: Militia and Raider cards create three individual soldiers, while Guardian and Archer cards create two. Command and cooldown are paid once per deployment, and enemy wave `count` also means deployments rather than individual bodies.
- Every combatant declares an attack pattern in structured data. Single attacks hit one target, pierce attacks continue through a line for up to two or three total targets, and cleave attacks hit every valid target inside the melee attacker's range. Secondary hits apply the pattern's damage multiplier and respect flying-target rules.
- A combatant with healing data checks friendly living non-boss combatants in healing range before attacking. It restores the ally with the greatest missing HP, cannot overheal, and uses the same rule on both factions. Bosses are excluded to prevent a producing fortress garrison from creating an unbounded boss-healing loop. The current healer is the shared Priest; its heal grows with weapon equipment and mastery attack growth.
- All simulation values use elapsed milliseconds rather than frame count.
- Every regular attack triggers one of six presentation-only motion rigs: slash, thrust, shoot, cast, crush, or creature lunge. The combatant container, portrait/body, shadow, and health bar remain stable while only the attached arm, weapon, bow, claw, or spell focus moves. The same rule applies to player units, enemy units, heroes, bosses, and attacks against fortresses; motion does not alter hit timing, range, or damage.
- Soldiers deploy from the protected rear of their own fortress rather than appearing in front of it. Player troops and the initial/respawning hero begin 50 virtual units left of the player fortress; computer wave and reinforcement troops begin 50 units right of the enemy fortress. Additional squad bodies are spaced another 16 units rearward. While the relevant fortress is alive, enemies cannot directly select a combatant that is still behind it: ranged defenders can shoot from cover, while melee defenders walk through the fortress line before engaging. The rule is symmetric, and destroying the enemy fortress exposes surviving rear troops. Bosses and named elite guards keep their authored forward positions, while boss-only challenges have no enemy fortress cover.
- Normal victory: enemy fortress HP reaches zero.
- Campaign boss victory: both the named beast and its supporting enemy fortress reach zero HP, in either order. Challenge victory requires only the beast.
- Defeat: player fortress HP reaches zero.
- Command starts at 70, regenerates at 10 per second, and is capped at 200.
- Killing a normal enemy grants 6 Command.
- When Command reaches exactly 100% of its current capacity, the player may activate `전시 동원령`. It consumes the entire gauge and permanently adds 25 maximum Command plus 1.5 Command/s for the rest of that battle. The rising capacity makes each later activation cost more, and the skill is capped at three uses per battle.
- Fortress research can modify starting Command, regeneration, maximum Command, summon cooldowns, Command per kill, battle Gold and battle mastery XP, fortress HP and regeneration, flat damage reduction, automatic tower fire, and bombardment against armies, bosses, and fortresses.

### Battlefield dimensions

- Target virtual resolution: 1600 × 720.
- Player fortress X: 105. Campaign fortress distance starts at 1,050 on stage 1, adds 25 per stage, reaches the 1,390 cap at stage 15, and remains there through stage 30. The enemy fortress therefore progresses from X 1,155 to X 1,495 without forcing a distance increase into every late stage. Boss-only challenges use the maximum distance as their approach length but do not draw an enemy fortress.
- Ground lane Y: 550.
- The long approach lets armies form a visible front before reaching a fortress.

## 4. Soldiers

Status: **Implemented**.

The canonical roster contains 50 shared troop definitions. The armory provides an `all` filter and eight family filters so the expanded collection stays usable. The full set is distributed as follows:

| Family | Count | Implemented troops |
|---|---:|---|
| Kingdom | 11 | Militia, Guardian, Archer, Lancer, Royal Cavalry, Swordsman, Pikeman, Scout, Priest, Kingdom Mage, Archmage |
| Betrayer | 2 | Crossbow, Shadow Assassin |
| Goblin | 4 | Raider, Poison Archer, Bomber, Wolf Rider |
| Orc | 3 | Bulwark, Berserker, Shaman |
| Ogre | 2 | Ogre Crusher, Ogre Mage |
| Beast/monster | 12 | Griffin Rider, Troll, Harpy, Minotaur, Wyvern, Acid Slime, Basilisk, Direwolf, Giant Eagle, Ancient Treant, Rune Golem, Swamp Hydra |
| Spirit | 6 | Storm, Fire, Frost, Earth, Radiance, and Shadow Spirits |
| Demon | 10 | Hellhound, Imp, Succubus, Demon Guard, Abyss Mage, Gargoyle, Cerberus, Ifrit, Soul Reaper, Abyss Knight |

Kingdom Mage is a moderate-cost two-target ranged caster. Archmage is a higher-cost 245-range caster whose slower spell can pierce three targets. Ifrit is a flying large demon/elemental with 215 range and a three-target piercing attack. Griffin Rider is the premier melee aerial assault unit: it spends nearly a full base Command gauge, survives concentrated ranged fire, and cleaves a ground formation rather than acting as a fragile aerial skirmisher.

Priest is the roster's symmetric support unit: its 190 healing range exceeds its 175 attack range, its 34 base heal uses the normal 1.25-second action cadence, and it attacks only when no injured ally is available in range. Enemy Priests heal enemy troops through the same definition and scene path.

| Troop | Command | Squad | HP each | Damage | Range | Interval | Recruit cost | Attack |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 민병대 | 45 | 3 | 105 | 17 | 34 | 820 ms | starting | single |
| 방패병 | 70 | 2 | 285 | 11 | 32 | 1050 ms | stage 1 reward | single |
| 궁수 | 75 | 2 | 72 | 22 | 215 | 1180 ms | stage 2 reward | single |
| 창병 | 80 | 1 | 165 | 31 | 62 | 1100 ms | stage 3 reward | pierce 2 |
| 고블린 약탈병 | 50 | 3 | 90 | 14 | 34 | 900 ms | 200 | single |
| 오크 철갑병 | 90 | 1 | 390 | 22 | 42 | 1250 ms | 350 | melee cleave |
| 왕립 기마병 | 120 | 1 | 250 | 40 | 40 | 1050 ms | 700 | pierce 2 |
| 석궁병 | 85 | 1 | 115 | 36 | 160 | 1450 ms | 400 | pierce 2 |
| 오우거 파쇄자 | 140 | 1 | 440 | 45 | 52 | 1500 ms | challenge 101 | melee cleave |
| 그리폰 기수 | 195 | 1 | 520 | 82 | 58 | 1050 ms | 1,500 | melee cleave |
| 폭풍 정령 | 125 | 1 | 130 | 31 | 185 | 1150 ms | challenge 102 | pierce 2 |
| 마염견 | 135 | 1 | 235 | 42 | 46 | 900 ms | challenge 103 | melee cleave |

- A new profile starts with only the militia. Guardian, archer, and lancer are earned from the first clears of stages 1, 2, and 3 respectively.
- All fifty troops use `troopDefinitions` regardless of side. Human loyalists and betrayers, goblins, orcs, ogres, beasts, spirits, and demons can therefore use one canonical base record and later fight for the player. Exceptional beasts, spirits, and top-tier summons may declare `maxActivePerSide`; this is a simultaneous living-body cap, not a lifetime summon count. It applies identically to the player and computer, includes bodies gained from the equipment capstone, and is disclosed in the armory and battle card.
- An encountered non-boss troop becomes visible as a recruitment candidate in the armory. Paying its recruit cost adds the same base troop to the player's roster.
- Royal Cavalry and Griffin Riders are tier-signature recruits: tier 2 and tier 3 promotion respectively reveal their information and allow recruitment without a prior enemy encounter. They still enter the codex only after recruitment or battle encounter.
- The player persists a battle formation containing one to four acquired troop types. The four battle cards and hotkeys follow formation order.
- Soldier summon cooldowns are communicated visually rather than with a changing numeric countdown: a disabled overlay recedes across the command card in proportion to remaining cooldown, then a short ready pulse marks the transition back to active. Exact remaining time stays in the button's accessible label for assistive technology.
- Every soldier owns three independent equipment branches, each with five paid levels:
  - Weapon: adds the troop's fixed attack value per level.
  - Armor: adds the troop's fixed HP and defense values per level. Defense is subtracted from incoming attack damage, with a minimum of 1 damage.
  - Boots: adds the troop's fixed movement-speed value per level.
- Equipment gains are absolute and role-specific rather than one shared percentage. The canonical values live on each combatant definition and are listed in `docs/BALANCE.md`; this prevents high-base-stat combatants from automatically receiving a larger upgrade solely because their base is larger.
- Equipment prices use readable arithmetic steps: `combatant equipment base × (current level + 1)`. All three slots use that combatant's same sequence, while stronger combatants have a higher base of 75, 100, or 125 instead of the basic 50.
- Finishing any one soldier equipment branch at rank 5 activates a one-time deployment capstone: that troop produces one additional body per summon without increasing Command cost or cooldown. Additional completed branches do not stack. Regular enemies receive the same bonus from their stage equipment profile; heroes, bosses, and named single-body elite defenders are excluded.
- Every summon grants that soldier mastery XP after the battle. Used soldiers receive `8 × summon count`, plus 12 XP on a victory or 4 XP on a defeat.
- Mastery has up to 50 levels and requires `round(45 × level^1.32)` XP per next level.
- Every mastery level after level 1 grants the troop's role-specific flat HP and damage gains without spending gold. These fixed gains are stored in `src/data/mastery.ts` and shown on each owned troop card; no shared percentage multiplier remains.
- Owned troop cards show current HP, attack, defense, and movement speed together with the total increase from that troop's canonical base definition. The increase combines equipment and mastery and keeps the base value available as a tooltip/accessibility label.
- Lancers deal 75% bonus damage to targets tagged `large`.
- Archers and Crossbows are deliberately asymmetric roles shared by both factions: the two-body Archer formation has 215 range, faster attacks, and better single-target deployment pressure, while the tougher one-body Crossbow has 160 range and a slower attack but fires a 36-damage bolt through at most two lined-up enemies. Crossbow piercing never reaches three soldier targets.
- Royal Cavalry move at 82 units/s and their first attack after spawning deals 60% bonus damage. The charge is consumed whether it hits a combatant or fortress.
- Griffin Riders fly 112 virtual pixels above the lane. Their 520 HP, 6 defense, 82 attack, and 0.85-strength melee cleave make them a top-tier assault unit, balanced by 195 Command and a 6.5-second summon cooldown. Non-ranged combatants cannot select a flying target, while ranged troops, ranged heroes, and the fortress watchtower can. Flying units may attack ground units and fortresses normally.
- Fortress bombardment and the beast stomp are ground-only area attacks and skip flying targets. Ranged hero attacks and skills can damage them.

## 5. Heroes

Status: **Implemented**.

- One selected hero deploys at battle start for zero Command.
- A defeated hero automatically respawns at the player fortress.
- Each hero has one active skill, one base passive, and one awakening aura.
- Hero equipment uses the same independent five-level weapon, armor, and boots branches as soldiers. Independently, every battle grants the selected hero mastery XP; skill uses and victory add bonus XP.
- Hero mastery is a stronger, hero-specific flat curve rather than the soldier curve: every level adds fixed HP and damage, raises all numeric active-skill effects, and shortens respawn time up to a per-hero 35% cap.
- Hero mastery ends at level 30. Levels 10, 20, and 30 grant awakening ranks I–III; each rank adds the hero's fixed awakening bonus to every numeric active-skill channel, removes 1.5 seconds from its active cooldown, and increases a hero-specific nearby-allied aura. Aura effects are derived from mastery and add no persistence fields.
- Hero cards show current-versus-base HP, attack, defense, movement, and respawn values. The mastery panel also exposes the exact per-level stat gains, current active-skill power and cooldown, three awakening markers, and next milestone.

| Hero | Archetype | HP | Damage | Range | Respawn | Active | Passive |
|---|---|---:|---:|---:|---:|---|---|
| 에드릭, 철벽의 기사 | support tank | 520 | 29 | 42 | 20 s | nearby allies gain 100 shield | nearby soldiers take 15% less damage |
| 셀레네, 잿불 마녀 | area mage | 285 | 43 | 190 | 18 s | meteor damages a target area | attacks splash for 35% damage |
| 리아, 마수 사냥꾼 | boss killer | 350 | 48 | 230 | 16 s | arrow rain hits all active enemies | 75% bonus damage to large targets |
| 미레나, 새벽의 성녀 | healer | 330 | 24 | 185 | 17 s | heals nearby allies and the fortress | heals the most injured nearby ally instead of attacking |
| 브란, 해방군 기수 | vanguard commander | 455 | 39 | 46 | 19 s | grants nearby allies a shield | first charge deals 60% bonus damage |

Unlock costs: Edric 0, Selene 500 gold, Ria 800 gold, Mirena 1,200 gold, and Bran 1,800 gold. Stage 12 grants Mirena for free and stage 18 grants Bran for free if they were not already recruited.

Per mastery rank after level 1, Edric gains +24 HP, +2 damage, +10 shield, and -0.30 s respawn; Selene gains +14 HP, +3 damage, +16 meteor damage, +10 fortress damage, and -0.25 s respawn; Ria gains +17 HP, +3 damage, +8 normal arrow-rain damage, +12 boss arrow-rain damage, and -0.22 s respawn. Each awakening adds another +50 Edric shield, +100/+60 Selene unit/fortress meteor damage, or +45/+65 Ria normal/boss damage. Respawn reduction caps at 7.0/6.3/5.6 seconds respectively.

Mirena gains +16 HP, +2 damage/healing growth, +10 prayer healing, +6 fortress healing, and -0.24 s respawn per rank; each awakening adds +60/+40 healing. Bran gains +21 HP, +3 damage, +8 shield, and -0.28 s respawn per rank; each awakening adds +40 shield. Their respawn reductions cap at 6.0 and 6.5 seconds. At awakening ranks I–III the five auras respectively grant nearby soldiers Edric defense +2/+4/+6 within 170, Selene attack +3/+6/+9 within 180, Ria range +15/+30/+45 within 210, Mirena regeneration +4/+8/+12 HP/s within 195, or Bran movement +4/+8/+12 within 185.

Edric's normal melee attack cleaves every valid target in range at 70% secondary damage. Selene selects one normal target and then applies her separate 35% fire splash. Ria's arrows pierce up to three targets at 80% follow-through damage.

## 6. Occupation armies, terrain, and beasts

Status: **Implemented**.

Normal enemy armies combine the same fifty troops available to the player. Stages 13–29 introduce three region-themed roster entries in each scripted opening while retaining a stable core reinforcement rotation; across the three late regions every one of the 38 expansion troops receives an encounter path without dumping the full roster into one battle. Each stage explicitly identifies its occupying faction as traitorous humans, goblins, orcs, monsters, demons, spirits, or a mixed Demon Army force.

Every stage also owns a `terrain` record with a name, description, and enemy HP, attack, and movement multipliers. `BattleScene` applies these values after shared equipment and before named boss modifiers, while `difficulty.ts` evaluates the same result. Campaign terrains currently establish regional identity without hidden numeric bonuses. Beast challenges deliberately use visible HP ×10 and attack ×2.5 terrain advantages; this power is never copied to the acquired player unit.

Selected normal stages also define one named elite defender standing near the enemy fortress. An elite reuses a shared troop definition and that stage's bounded equipment profile, then applies explicit HP, attack, and defense modifiers. It is a single body even when its base troop normally deploys as a squad. The map identifies the elite and its role but does not reveal its numeric modifiers.

Advanced mechanics follow explicit introduction milestones stored in `advancedEnemyIntroductionStages`. Stage 7 is a post-boss recovery stage containing only previously encountered troops. Stage 8 opens with familiar Raiders and Archers before introducing three Royal Cavalry at 15.5 seconds; its reinforcement rotation places Cavalry last. Stage 9 reuses Cavalry to reinforce the counterplay lesson without adding another new domain. Stage 10 introduces exactly one strengthened Griffin Rider in its final scripted wave at 28.5 seconds after four familiar formations. Stage 11 combines Cavalry with two scripted Griffins. Griffins are deliberately excluded from continuous reinforcement rotations so the top-tier flying body remains a legible event rather than an endlessly recycled pressure spike.

Every non-boss campaign stage has two production phases: handcrafted opening waves introduce its composition, then a repeating reinforcement rotation continues until the battle ends. Reinforcements pause only when the stage's living-enemy cap is reached and resume after the player thins the army. Campaign boss stages use a named beast in front of a real enemy fortress plus a low-tier garrison: at five seconds the fortress begins slowly rotating two or three region-appropriate soldiers while holding only four or five living regular enemies. Both fortress and beast must be destroyed, in either order, and destroying the fortress immediately ends further production. Beast challenges remain truly boss-only.

| Stage | Enemy weapon | Enemy armor | Enemy boots |
|---:|---:|---:|---:|
| 1 | 0 | 0 | 0 |
| 2 | 1 | 1 | 0 |
| 3 | 2 | 1 | 1 |
| 4 | 2 | 3 | 1 |
| 5 | 4 | 4 | 3 |
| 6 | 5 | 5 | 4 |
| 7 | 5 | 5 | 5 |
| 8 | 5 | 5 | 5 |
| 9 | 5 | 5 | 5 |
| 10 | 5 | 5 | 5 |
| 11 | 5 | 5 | 5 |
| 12 | 5 | 5 | 5 |

Enemy equipment ranks and numeric elite modifiers are intentionally hidden from the map. Players see the stage theme, difficulty label, enemy roster icons, objective, reward, and elite defender name without receiving exact hidden-stat spoilers. Boss encounters still receive the equipment profile of their own stage.

Enemy equipment reaches its finite maximum at stage 7. Stages 8–30 add no further generic equipment scaling; their difficulty comes from denser formations, finite alive-capped reinforcements, named elites, Royal Cavalry charges, Griffin flight rules, progressively tougher fortresses, and boss behavior. Stages 13–29 use a 55-second reinforcement start, intervals no faster than 2.1 seconds, and living-enemy caps no higher than 15.

The shared beast behavior is reused by five campaign boss sieges at stages 6, 12, 18, 24, and 30 plus four standalone challenges. Campaign beasts use a canonical 5,200 HP, 82 attack, 68 range, 1.5-second attack interval, and 20 movement-speed body, while challenge beasts start from the exact recruitable Ogre, Storm Spirit, Hellhound, or Ifrit definition. The first player attack triggers their advance and telegraphed ground-only stomp. At 55% HP they enter phase two: attack interval becomes 65%, movement becomes 160%, stomp cadence accelerates from 5.2 to 3.4 seconds, and stomp damage rises from 105% to 155% of trained attack.

The campaign beast's normal melee strike also cleaves every valid target inside its attack range at full damage; its telegraphed stomp remains a separate, larger ground-only area pattern.

## 7. Campaign and first-clear rewards

Status: **Implemented**.

| Stage | Name | Purpose | Battle reward | First-clear reward |
|---:|---|---|---:|---|
| 1 | 국경의 불씨 | basic melee introduction | 100 | unlock Guardian |
| 2 | 철의 행렬 | armored enemies and first elite | 200 | unlock Archer |
| 3 | 붉은 화살비 | ranged pressure | 300 | unlock Lancer and gain 300 gold |
| 4 | 파쇄자의 길 | large enemies | 400 | recruit Selene for free |
| 5 | 검은 성문 | mixed army finale | 500 | 500 gold |
| 6 | 검은숲 마수의 성채 | first beast-and-fortress siege | 600 | recruit Ria for free and gain 800 gold |
| 7 | 잿빛 협곡 | familiar-roster recovery after the boss | 700 | 700 gold |
| 8 | 유리 사막 | delayed Royal Cavalry introduction | 800 | 800 gold |
| 9 | 무너진 수도 | Royal Cavalry counterplay reinforcement | 900 | 900 gold and unlock Hero Training Ground |
| 10 | 침묵 수도원 | late-wave Griffin introduction | 1,000 | 1,000 gold |
| 11 | 황혼의 관문 | combined advanced-roster endurance finale | 1,100 | 1,100 gold |
| 12 | 철갑 마수의 귀환 | second beast-and-fortress siege | 1,200 | recruit Mirena for free and gain 1,200 gold |

- Stages 13–30 form three additional six-stage regions: north (13–18), white night (19–24), and crown wastes (25–30). Their stage names and waves remain structured in `src/data/stages.ts`; stages 18, 24, and 30 are boss-and-fortress sieges. Stage 18 grants Bran alongside its 1,800 gold. Normal battle and first-clear gold otherwise continue the readable `stage × 100` sequence, ending at 3,000 gold on stage 30.
- Campaign selection is an illustrated interactive kingdom map with connected stage nodes, locked and cleared states, regional labels, a mission panel, a data-derived five-tier combat evaluation, and first-clear reward previews. `낮음`, `보통`, `높음`, `매우 높음`, and `극한` are calculated from fortress durability, battlefield distance, scripted armies and timing, reinforcement pressure, elites, and bosses; the former `stage/30` numeric duplicate and its authored `difficulty` field no longer exist. A new profile sees stages 1–6. Clearing stages 6, 12, 18, and 24 expands the horizontally scrollable world by the next six-stage region. Stage spacing is 185 virtual CSS pixels, the desktop viewport is at least 680 px high, and the world starts at 1,320 px wide before growing with revealed regions.
- The map viewport supports native horizontal scrolling and grab-to-pan pointer dragging with mouse, pen, or touch. Pointer capture begins only after the 6 px movement threshold so an ordinary press remains owned by its stage button; completed drags suppress the synthetic stage click, while taps/clicks and keyboard activation still select nodes. Touch retains vertical page panning.
- Winning unlocks the next stage. Losing grants 20% of the battle reward without unlocking progress.
- A stage's first-clear reward is granted exactly once and its claimed state persists. Replaying a cleared stage still grants the normal battle reward and mastery, but not its first-clear reward.
- Normal stages never run out of enemies: their post-opening reinforcement timing, rotation, and living-enemy cap are defined in stage data.
- A newly introduced combat mechanic must not be stacked at the first moment of a new region or immediately followed by another signature mechanic. The eastern campaign uses recovery → introduction → reinforcement → introduction → combination pacing.

### Beast challenges

Beast challenges have no separate menu. Clearing campaign milestones 6, 18, and 30 reveals four pulsing red rift nodes inside the draggable kingdom-map world; the two final rifts occupy distinct positions around stage 30. Selecting a rift reuses the normal mission panel but switches it to beast styling and shows the exact terrain amplification, solo-boss objective, first-clear recruit, and repeat reward. These encounters set `challenge: true`, contain one named boss, draw no enemy fortress, schedule no waves or reinforcements, and end immediately when the boss dies. They apply a clearly displayed terrain advantage of HP ×10 and attack ×2.5. Their named HP multipliers preserve encounter-to-encounter progression on top of that common rule: ×1.5, ×8, ×12, and ×7.5. Their first clears persist separately and grant the exact base Ogre Crusher, Storm Spirit, Hellhound, and Ifrit troops without terrain or boss multipliers. Repeat victories grant 400, 1,000, 1,800, and 2,400 gold respectively but never advance `unlockedStage`.

## 8. Fortress technology

Status: **Implemented**.

The fortress has three persistent tiers. It begins as tier 1, and the next promotion becomes purchasable after reaching its total-research requirement. Tier 2 requires 8 purchased ranks and 1,000 gold; tier 3 requires 24 purchased ranks and 2,500 gold. Promotions unlock both research facilities and recruitment permits. Every research node has five paid ranks, giving the full tree 18 nodes and 90 purchases. Each node uses the readable sequence `base cost × (current rank + 1)`.

| Branch | Tier | Node | Effect per rank | Prerequisite |
|---|---:|---|---|---|
| Economy | 1 | 전쟁 금고 | starting Command +25 | none |
| Economy | 1 | 보급로 | Command regeneration +2.5/s | 전쟁 금고 1 |
| Economy | 1 | 지휘 저장고 | maximum Command +40 | 보급로 1 |
| Economy | 2 | 상비군 훈련소 | soldier summon cooldown -5% | 지휘 저장고 2 |
| Economy | 2 | 군수 표준화 | soldier Command cost -3% | 지휘 저장고 3 |
| Economy | 2 | 전리품 회계 | battle and first-clear Gold +5% | 군수 표준화 2 |
| Economy | 2 | 왕립 야전 교범 | battle-earned mastery XP +5% | 전리품 회계 2 |
| Economy | 3 | 승전 공납제 | Command per normal kill +2 | 상비군 훈련소 3 |
| Defense | 1 | 강화 성벽 | fortress HP +250 | none |
| Defense | 1 | 석재 장갑 | flat incoming damage -3 | 강화 성벽 1 |
| Defense | 1 | 수호 망루 | automatic shot damage +22 and faster interval | 강화 성벽 1 |
| Defense | 2 | 고층 흉벽 | tower range +45 | 수호 망루 2 |
| Defense | 3 | 재생 석재 | fortress regeneration +1.5 HP/s | 고층 흉벽 3 |
| Artillery | 1 | 흑색 화약 | bombardment damage +45 | none |
| Artillery | 1 | 신속 장전 | bombardment cooldown -3 s | 흑색 화약 1 |
| Artillery | 1 | 광역 탄두 | bombardment radius +20 | 흑색 화약 2 |
| Artillery | 2 | 마수 관통탄 | bombardment boss damage +70 | 광역 탄두 2 |
| Artillery | 3 | 공성 계산학 | direct enemy-fortress bombardment damage +60 | 마수 관통탄 3 |

Base fortress stats are 70 starting Command, 10 Command/s, 200 maximum Command, 1800 HP, 175 bombardment damage, 125 bombardment radius, and 32 s bombardment cooldown. The watchtower is inactive until researched. Soldier Command costs start at 100% and `군수 표준화` lowers them to a maximum 85%; effective costs round upward and have a minimum of 10 Command.

- Tier 2 grants recruitment permits for encountered Raiders and Bulwarks and reveals the Royal Cavalry as a direct royal recruit.
- Tier 3 grants recruitment permits for encountered Crossbows and reveals the Griffin Rider as a direct royal recruit. Ogre Crushers, Storm Spirits, and Hellhounds ignore ordinary recruitment and come only from their corresponding first challenge clear.
- Tier and prerequisite requirements gate the first rank of a technology. Once a save contains at least one rank, that node remains unlocked even if a later game update changes its requirements.
- Every technology card with a prerequisite displays its exact target rank and the player's current rank. For example, `광역 탄두` at Black Powder rank 1 reads `선행: 흑색 화약 2단계 (현재 1단계)`, and its disabled action repeats the missing target instead of showing only the technology name.
- The fortress screen renders each branch as a left-to-right prerequisite tree with visible split and connection lines. Roots and children are derived directly from technology prerequisite data, deep branches scroll horizontally, and the same tree remains usable on mobile without flattening back into an unrelated card list.
- Every fortress branch supports pointer grab-to-scroll with mouse, pen, and touch. Pointer capture starts only after a 6 px drag threshold, a completed drag suppresses its following synthetic click so research is never purchased accidentally, and short clicks, keyboard activation, native scrollbars, and vertical page touch scrolling remain available.
- Save migration derives a minimum valid fortress tier from already-researched nodes. A saved tier-2 or tier-3 node therefore restores at least fortress tier 2 or 3 respectively instead of relocking previous progress.
- Campaign-reward troops do not require a fortress recruitment permit, and upgrading an old save never removes an already-owned troop.
- Tier, accumulated ranks, promotion readiness, unlock descriptions, and ten derived battle statistics—including the current summon-cost discount—are visible on the fortress screen.

## 9. Achievements and career statistics

Status: **Implemented**.

- Persistent statistics: battles, victories, defeats, kills, soldier deaths, hero deaths, total summons, hero skill uses, castle skill uses, boss wins, current win streak, maximum win streak, and unique codex entries.
- Sixty-four achievements cover combat, campaign, endurance, command behavior, and codex completion while remaining compact through twelve statistic-derived series.
- Long-term milestone chains extend kills to 5,000, victories and battles to 250, summons to 2,500, hero-skill and fortress-bombardment uses to 500, boss wins to 10, maximum win streak to 20, defeats and hero returns to 50, and soldier losses to 1,000.
- Every achievement claim grants both gold and Royal Gems. Exact values are canonical in `docs/BALANCE.md`.
- The achievement screen defaults to `묶음 보기`, reducing the sixty-four definitions to twelve statistic-based series such as kills, victories, summons, hero skills, bombardments, battles, and codex completion. Multi-step series use a visibly stacked card and show the current series step, claimed-step count, and pending-reward count. The featured card prioritizes the earliest unlocked but unclaimed reward, then the next incomplete target, then the final completed milestone, so claiming repeatedly advances through waiting rewards without hiding them.
- `전체 보기` expands the same data back to all sixty-four individual cards. The grouped/all toggle is session-local presentation state and does not alter achievement progress, rewards, or persistence.
- `왕국의 기록관` unlocks at 28 of 56 codex entries (50%) and rewards 180 gold plus 12 Royal Gems.
- `살아 있는 연대기` unlocks at 56 of 56 codex entries (100%) and rewards 600 gold plus 40 Royal Gems.
- Achievements unlock automatically when a recorded battle reaches their target.
- Newly unlocked achievements appear in the battle result.
- Gold and Royal Gem rewards are manually claimed together from the achievement screen and cannot be claimed twice.

## 10. War codex

Status: **Implemented**.

- Combatants are structured in three source groups: fifty shared troops, five heroes, and one campaign-beast record. There are currently 56 unique codex entries; completion achievements derive their 28-entry and 56-entry targets from `CODEX_TOTAL`.
- The codex derives visible statistics from combat definitions and adds structured role, gameplay description, and original lore text from `src/data/codex.ts`.
- A troop appears after acquisition or an enemy encounter. Its card marks `아군 확보`, `적군 조우`, or both states; a troop in both states still counts once.
- Heroes appear only after recruitment. The boss appears only after being present in a played battle. An encounter is recorded even if the player loses that battle.
- Undiscovered entries are represented only by the remaining-entry count. Their name, art/silhouette, lore, and statistics are not leaked.
- The screen separates shared troops, heroes, and the encountered boss and shows total completion as a unique count and percentage.
- When adding or removing a combatant, update its combat definition, codex entry, acquisition/encounter path, persistence behavior, and tests together. `CODEX_TOTAL` is derived from the structured records.

## 11. Menus and persistence

Status: **Implemented** for menu, daily attendance, dual-currency wallet, mysterious merchant, permanent battle-speed entitlement, kingdom map, recruitment and formation armory, hero hall, fortress tree, achievements, war codex, results, settings, and local saving.

- The title screen is intentionally limited to four choices and does not expose progression or settings menus. Without a save they are `새 게임`, disabled `불러오기`, `저장 관리`, and `크레딧`. When browser-local progress exists they become `계속하기`, `새 게임`, `저장 관리`, and `크레딧`; Continue moves to the first, emphasized position and displays the highest unlocked campaign chapter. Save Management keeps import and export together instead of adding a fifth title action.
- New Game plays an approximately 21-second, four-scene illustrated counteroffensive cinematic after reset. Its project-owned 16:9 backgrounds show the fallen continent, refugees reaching the Last Bastion, the restored kingdom banner, and the march toward the Demon King's citadel. Each 5.2-second scene automatically advances with synchronized copy fades, a slow CSS camera push and light drift, and an animated progress segment; the final scene enters the map without requiring an advance action. The visible skip action or Escape ends it immediately. Continue and a successful Import go directly to the kingdom map so a saved player is never forced through the opening again.
- Continue resumes the current browser-local automatic save and opens the kingdom map without mutating it. New Game resets the persistent profile after an in-game confirmation when meaningful progress exists. Credits opens a dedicated project-credit screen.
- The kingdom map is the persistent in-game hub. Its `왕국 운영` panel opens the armory, hero hall, fortress technology, stage-unlocked Hero Training Ground, achievements, war codex, daily reward, stage-unlocked mysterious merchant, and global sound setting. Beast challenges exist only as map nodes. On desktop this compact 176 px vertical panel occupies a dedicated left column outside the heading, stage map, and mission panel. At 820 px and below it becomes a compact toolbar above the map content, using four columns on tablet and two on phone; it never overlays or occupies the map canvas. Main labels remain at least 12–13 px and metadata at least 9 px even as button height is reduced.
- First-clear rewards can unlock features through structured `featureId` metadata. `hero-training` is unlocked by the persisted stage-9 clear rather than a redundant save flag, so old profiles that already cleared stage 9 receive it automatically. Before that milestone its operations button remains visible but disabled with the requirement.
- Hero Training Ground is the first repeatable late-game Gold sink. It offers 100 XP for 250 Gold, 500 XP for 1,000 Gold, and 1,500 XP for 2,500 Gold to any recruited hero. The store enforces the stage-9 gate, ownership, affordability, and the level-30 total-XP cap; battle usage continues to grant XP independently.
- Back navigation from every progression screen returns to the kingdom map. Battle results also return to the map; the map header and Credits are the only current routes back to the title.
- Persistence uses Zustand and localStorage key `last-bastion-profile-v1`.
- Missing fields in old or damaged saves are merged with defaults. Codex completion and eligible codex achievements are recalculated from the migrated acquisition and encounter lists on load.
- Save Management exports a human-readable JSON file named `last-bastion-save-YYYY-MM-DD.json`. Its portable wrapper contains the `last-bastion-save` format marker, export version, timestamp, and only the whitelisted persisted state; no store action is serialized.
- Import accepts that portable export, a raw saved profile JSON object, or Zustand's `{ state, version }` storage wrapper. It rejects malformed or unrelated JSON, whitelists persisted fields, clamps resources and upgrade ranks, removes unknown IDs, repairs formations and fortress tiers, and cannot replace store actions. Importing over meaningful local progress requires an explicit in-game confirmation before applying the replacement.
- All blocking confirmations and errors use the shared React game modal instead of browser `alert`, `confirm`, or `prompt`. The modal traps Tab focus, initially focuses the safe action for destructive choices, restores prior focus on close, supports Escape, and adapts to phone-width screens.
- The hero hall provides lore, passive, skill, unlock, select, and upgrade actions.
- New saves separately store gold, Royal Gems, the last daily claim date, battle-speed entitlement and preference, per-slot equipment levels for all shared troops, acquired troops, the one-to-four troop battle formation, cleared stages, mastery XP, recruited heroes, fortress research, career statistics, encountered troops and boss, unlocked achievements, and claimed rewards.
- Fortress tier persists independently from research ranks. Older profiles preserve all existing research and already-recruited troops; existing ranks count toward promotion, already-started nodes remain grandfathered as unlocked, and researched high-tier nodes repair the saved tier to their minimum required tier.
- Royal Gems start at zero. The kingdom map grants 10 once per browser-local calendar date and its sticky header shows both wallet currencies. Clearing stage 6 reveals the `수수께끼 상인` operation. Its dedicated shop sells the permanent battle-speed license for 200 Royal Gems and keeps an explicitly empty display slot for future wares; the operations button never purchases an item directly. Buying the license sets the saved preference to 1.5×; the battle HUD can then toggle 1×/1.5×, and later purchases are idempotent. There is no recharge or real-money purchase mechanism. A future server-verified cash purchase may grant the same entitlement without the stage gate, but payments remain out of scope.
- Legacy scalar `upgrades` and `heroLevels` values migrate into the weapon and armor slots; boots starts at zero. Existing saves preserve their acquired troops, while only new profiles use the militia-only start.

## 12. Controls

- Click/tap a soldier card to summon it.
- `1`–`4`: summon the corresponding troop in the current formation.
- Click/tap the hero portrait or press `Q`: hero active skill. The portrait displays the `Q` key hint.
- `Space`: compatibility shortcut for the hero active skill.
- Click/tap the castle ability: fortress bombardment.
- When Command is full, click/tap `동원` or press `E`: consume 100% Command and improve its maximum and regeneration for the current battle.
- `P` or `Escape`: pause/resume.
- After purchasing the stage-6, 200-Gem battle-speed license, click/tap the battle speed control to toggle `1×` and `1.5×`. The selected speed persists between battles.

## 13. Presentation and typography

- The opening uses four 1672 × 941 original cinematic paintings optimized to roughly 250–355 KB WebP files. `src/data/opening.ts` owns their order, copy, duration, and runtime paths. `public/assets/opening/README.md` records the shared art direction, final prompt set, and the scene-2 kingdom-banner correction. CSS supplies responsive cover cropping, a slow Ken Burns-style push, light drift, fades, and a centered lower-third title/subtitle treatment over a shallow borderless bottom vignette. Descriptive copy is 18 px on desktop and 15 px on phones, using text shadow rather than a dialogue-box-strength container. This keeps the artwork dominant and avoids obscuring upper-scene landmarks without pretending the illustrations are frame animation.
- Fourteen troops and three of the five heroes have original, simple hand-painted full-body character illustrations distributed across two transparent 4 × 4 runtime atlases. Mirena and Bran currently use their canonical procedural icon fallback.
- The 1225 × 1284 RGBA core master and dedicated correction sources are preserved under `public/assets/characters`. Every production atlas is 612 × 640 and its sixteen frames are exactly 153 × 160. `roster-atlas.png` contains ten troops and three heroes; `expansion-atlas.png` adds Goblin Archer, Goblin Bomber, Orc Berserker, and Orc Shaman. Unused cells remain transparent for future additions.
- `yarn art:atlas` deterministically rebuilds `expansion-atlas.png` from the four transparent expansion sources, crops their alpha bounds into the fixed first-row cells, and leaves every unused cell transparent. This command is the recovery path for atlas-alpha regressions and does not regenerate or reinterpret the source art.
- `src/data/characterArt.ts` is the canonical ID-to-sheet/frame mapping. The armory, hero hall, discovered codex entries, battle HUD, and Phaser combatants all resolve the selected atlas through that mapping. Enemy combatants horizontally flip the same faction-neutral frame instead of owning duplicate art.
- The two atlases remain single-pose transparent PNG sheets. During battle, `src/game/combatMotion.ts` classifies every definition into slash, thrust, shoot, cast, crush, or lunge and drives a lightweight localized arm/weapon/effect rig layered over the unchanged portrait. This replaces the former whole-container squash pulse. Merely changing the image extension would not provide joint data; true limb articulation or authored frame animation remains a future asset-production task requiring separated body parts or multiple attack frames.
- Campaign beasts intentionally retain distinct procedural boss rendering. Thirty-six troops without dedicated frames use data-driven procedural sigils; missing or undiscovered records do not leak their presentation.
- Pretendard Variable is loaded at runtime from the official Pretendard jsDelivr dynamic-subset stylesheet (`v1.3.9`). It is not installed as a package or bundled into the repository.
- Cinzel remains the display face for selected English labels and numerals.
- The interface falls back to Apple SD Gothic Neo and sans-serif if the runtime font cannot load.
- Dense supporting labels use a practical 9–11 px range, while descriptive copy is generally 11–13 px or larger. Map details, mission rewards, equipment, hero traits, fortress research, achievements, codex entries, battle HUD, and result summaries receive explicit readability sizing on desktop and mobile rather than relying on sub-9 px text.

### Music and sound

- Original procedural background music is implemented with the browser Web Audio API and requires no downloaded or third-party audio assets.
- Menu, battle, victory, and defeat each use a distinct melodic/bass pattern. Battle music uses a faster pulse than the menu theme.
- Browser autoplay policy is respected: the audio context is created and resumed only after the first pointer or keyboard interaction.
- The music pauses while the page is hidden and resumes when the page becomes visible.
- Synthesized effects distinguish melee impacts, ranged shots, Griffin attacks, cavalry/boss/bombardment impacts, fortress hits, and hero skills. Repeated effects are throttled per category so large battles do not create unbounded overlapping voices.
- The sound toggle in both the kingdom-map management hub and battle HUD controls BGM and effects through the same persisted `muted` setting and exposes an accessible on/off label.
- Phaser audio remains disabled because the application-level procedural audio engine owns the audio context.

## 14. Technical architecture

- Package manager: Yarn Classic 1.22.22
- Application: React 19
- Battle: Phaser 3
- State and persistence: Zustand 5
- Build: Vite 8.3
- Language: TypeScript 7.0.2; TypeScript 8 is not published as of this date
- Lint: Oxlint 1.82; ESLint is intentionally excluded
- Test: Vitest 5 with jsdom

Production chunks:

- `index`: menu, progression UI, and game data
- `react-vendor`: React, React DOM, scheduler, and Zustand
- `BattleView`: lazy-loaded battle UI and game integration
- `phaser`: isolated lazy-loaded Phaser runtime; the upstream library is one large module and is not part of initial menu loading

Important paths:

- `.github/workflows/auto-assign-pr-author.yml`: metadata-only GitHub Actions automation that assigns newly opened or reopened pull requests to their authors without checking out pull-request code
- `src/App.tsx`: title, kingdom-map hub, navigation, credits, and persistent progression screens
- `src/components/BattleView.tsx`: React battle HUD and input forwarding
- `src/components/CharacterSprite.tsx`: shared React atlas-frame renderer
- `src/game/BattleScene.ts`: Phaser simulation and visuals
- `src/game/EventBus.ts`: React–Phaser event boundary
- `src/game/controls.ts`: pure keyboard-control mappings
- `src/game/combatMotion.ts`: pure attack-style selection, durations, and allocation-free localized pose sampling
- `src/game/rules.ts`: pure calculations
- `src/game/difficulty.ts`: pure unit-threat and campaign-curve estimator shared by the map's five-tier combat evaluation and the separate balance audit
- `src/data/units.ts`: canonical faction-neutral troop definitions plus hero and boss definitions
- `src/data/characterArt.ts`: canonical troop/hero atlas sheet/frame mapping and Phaser frame dimensions
- `src/data/stages.ts`: campaign waves and stage-level bounded enemy equipment profiles
- `src/data/castle.ts`: fortress technology definitions, prerequisites, cost, and derived battle stats
- `src/data/achievements.ts`: achievement definitions and progress evaluation
- `src/data/codex.ts`: structured soldier, hero, enemy, and boss codex records
- `src/data/economy.ts`: daily reward and permanent battle-speed license balance
- `src/data/features.ts`: stage-unlocked facilities and Hero Training Ground package data
- `src/data/opening.ts`: cinematic scene copy, image paths, order, and timing
- `src/game/daily.ts`: browser-local daily claim date rules
- `src/audio/music.ts`: application-level procedural background music engine and scene patterns
- `src/store/useGameStore.ts`: progression and persistence
- `docs/BALANCE.md`: canonical implemented numeric balance reference
- `scripts/balance.test.ts`: standalone campaign difficulty audit run by `yarn balance`; intentionally excluded from the normal app test/build path
- `scripts/unit-efficiency.test.ts`: standalone roster Command-efficiency and deployability audit run by `yarn balance`
- `scripts/progression-power.test.ts`: focused early-equipment rush stress report that compares stage pressure with the strongest affordable one-branch troop build
- `scripts/build-expansion-atlas.mjs`: deterministic RGBA atlas builder that preserves source transparency
- `public/assets/characters/`: generated RGBA sources, optimized runtime atlases, sheet/frame order, and generation prompts
- `public/assets/opening/`: optimized cinematic WebP backgrounds and their generation record

The battle bundle is lazy-loaded so Phaser does not delay the initial menu.

Repository automation status: **Implemented**. Newly opened or reopened pull requests run a least-privilege `pull_request_target` workflow with only pull-request write access. The workflow calls the GitHub API through a full-SHA-pinned official action to assign the pull-request author and deliberately has no checkout or untrusted-code execution step.

The battle scene keeps only active combatants in its targeting collection. Deaths are queued during combat iteration and compacted at the frame boundary, so removing a unit cannot skip the next acting unit and long reinforcement battles do not retain every historical casualty. Cleave, pierce, bombardment, hero targeting, and watchtower selection scan the bounded active collection without sorting the full battlefield roster on each attack.

High-frequency strike, projectile, and deployment-flash visuals use fixed-size scene pools and elapsed-time animation instead of creating and destroying Phaser objects for every attack. Unit hit flashes stay on existing combatants, while each combatant creates its localized attack rig and mutable pose once at spawn; strikes only reset a duration field and sample into that pose without allocating a tween, timer, Phaser object, or per-frame result. When all pooled effects are busy, extra cosmetic effects are skipped without affecting combat damage. Web Audio voices disconnect their oscillator and envelope nodes when playback ends. These bounds keep large multi-body battles from turning short-lived effects into periodic CPU and garbage-collection spikes.

## 15. Explicitly out of scope

- Accounts and server saves
- Multiplayer and PvP
- Payments, ads, and gacha
- Guilds and chat

These require an explicit user request.

## 16. Verification

Every completed change must pass:

```bash
yarn lint
yarn test
yarn balance
yarn build
```

Browser verification is additionally required when an interactive browser is available.

## 17. Changelog

- 2026-09-12: Created the playable campaign MVP.
- 2026-09-12: Extended the battlefield from 1200 × 600 to 1600 × 720 to increase the real distance between fortresses.
- 2026-09-12: Began the three-hero roster, unlock, selection, level, passive, and active-skill expansion.
- 2026-09-12: Completed hero hall and battle integration for all three heroes, including distinct passive, active, respawn, unlock, selection, and upgrade behavior.
- 2026-09-12: Added the cooldown-based fortress bombardment ability.
- 2026-09-12: Migrated to Yarn, Vite 8, TypeScript 7, and Oxlint. TypeScript 8 was unavailable in the registry.
- 2026-09-12: Added mandatory documentation synchronization rules for all future AI agents.
- 2026-09-12: Added persistent career statistics and fourteen claimable achievements covering kills, deaths, wins, losses, streaks, summons, boss victory, and skill use.
- 2026-09-12: Split character growth into paid equipment levels and free usage-based mastery XP with up to 50 mastery levels.
- 2026-09-12: Added the three-branch fortress technology tree and connected all nine research nodes to live battle values.
- 2026-09-12: Replaced the campaign list with an interactive kingdom map and added one-time, data-driven first-clear rewards for units, heroes, and gold.
- 2026-09-12: Split equipment training into independent weapon, armor, and boots branches for every soldier and hero.
- 2026-09-12: Switched Korean UI typography to Pretendard Variable loaded at runtime from the official CDN rather than a package dependency.
- 2026-09-12: Expanded the campaign from 6 to 12 stages; defeating the stage 6 beast now reveals a second, horizontally extended eastern map with five reinforced army stages and a maximum-training final boss.
- 2026-09-12: Added a 12-entry acquisition and encounter-based war codex plus 50% and 100% completion achievements.
- 2026-09-12: Unified player and enemy soldiers into eight faction-neutral troop definitions, added encounter-based recruitment and four-slot formations, and moved enemy power scaling into stage equipment profiles.
- 2026-09-12: Changed new profiles to start with militia only and moved Guardian, Archer, and Lancer acquisition to the first three stage rewards.
- 2026-09-12: Added non-purchasable Royal Gems, once-per-local-day attendance claims, and dual gold/gem achievement rewards.
- 2026-09-12: Added `docs/BALANCE.md` as the canonical numeric balance reference.
- 2026-09-12: Split production output into initial app, React/Zustand vendor, lazy battle UI, and isolated Phaser runtime chunks.
- 2026-09-12: Added continuous, alive-capped enemy reinforcement rotations after every normal stage's opening waves.
- 2026-09-12: Increased small supporting text throughout the map, progression menus, battle HUD, and result screen, with mobile-specific minimums for stage and unit labels.
- 2026-09-12: Expanded the fortress from nine three-rank nodes to fifteen five-rank nodes and added paid tier 2/3 promotions that unlock advanced battle effects and enemy-troop recruitment permits.
- 2026-09-12: Added original Web Audio procedural BGM for menu, battle, victory, and defeat states and connected the persisted music toggle to real playback.
- 2026-09-12: Added current-versus-base growth deltas to every owned troop and hero stat card so equipment and mastery gains are visible at a glance.
- 2026-09-12: Replaced shared percentage equipment scaling with role-specific flat attack, HP, defense, and movement gains while retaining percentage-based usage mastery.
- 2026-09-12: Lowered late reinforcement density, strengthened every Command-economy research rank, and reduced the Lancer summon cost/cooldown.
- 2026-09-12: Added tier-signature Royal Cavalry and Griffin Riders, real charge and flying-target rules, late-stage enemy usage, expanded the codex to 14 entries, and synthesized combat sound effects controlled by the shared sound toggle.
- 2026-09-12: Strengthened the shared beast base and made its telegraphed stomp scale with stage training, accelerated the phase-two threat pattern, and added click-safe pointer dragging to the horizontally scrollable campaign map.
- 2026-09-12: Fixed expanded-map stage selection by delaying pointer capture until a real drag begins, restoring access to cleared western stages after a boss clear.
- 2026-09-12: Grandfathered previously researched fortress nodes across requirement changes and added save migration that restores the minimum tier proven by existing high-tier research.
- 2026-09-12: Repaced eastern enemy composition so stage 7 is a familiar-roster recovery battle, Royal Cavalry debuts midway through stage 8, Griffin Riders debut late in stage 10, and stage 11 becomes their first combined challenge.
- 2026-09-12: Added the five-rank tier-2 `군수 표준화` research, which reduces actual soldier Command costs by up to 15% with the discounted values shown directly on battle cards.
- 2026-09-12: Added `Q` as the visible primary hero-skill hotkey while retaining `Space` as a compatibility shortcut.
- 2026-09-12: Clarified every fortress prerequisite with the required and current research ranks, including the Black Powder rank-2 requirement for Wide Blast.
- 2026-09-12: Removed mastery from all computer-controlled soldiers and bosses and capped enemy weapon/armor/boots upgrades at rank 5; later UI revisions keep this finite profile internal rather than exposing its numbers on the map.
- 2026-09-12: Rebuilt the fortress workshop as data-derived, horizontally scrollable prerequisite trees with visible branches and connectors.
- 2026-09-12: Initialized the project as a Git repository on the `main` branch and added repository-safe ignore rules.
- 2026-09-12: Rebalanced basic troops into multi-body deployments, added data-driven two/three-target pierce and melee-cleave attacks, and exposed both traits on owned-unit cards.
- 2026-09-12: Reworked battle rewards, recruitment, equipment, fortress research, and promotion prices into readable arithmetic sequences; battle rewards now rise by exactly 100 gold per stage.
- 2026-09-12: Added named single-body elite defenders to selected fortress stages, hid exact enemy equipment ranks from the map, and strengthened the final beast with explicit stage modifiers.
- 2026-09-12: Added the standalone `yarn balance` difficulty audit, which estimates objective, scripted army, reinforcement, elite, and boss pressure and rejects a non-monotonic or excessively nonlinear campaign curve.
- 2026-09-12: Added original illustrated sprites for all ten troops and three heroes, a tested data-driven 4 × 4 atlas mapping, and shared rendering across progression screens, battle controls, and the Phaser battlefield.
- 2026-09-13: Replaced the Orc Bulwark atlas frame with an open-faced green-skinned design whose broad jaw and tusks remain identifiable at battle-control size; retained the shared 153 × 160 frame contract and recorded the reusable source asset and generation prompt.
- 2026-09-12: Prevented long-battle slowdown by removing defeated combatants from the targeting collection at safe frame boundaries and eliminating repeated full-roster sorting from multi-target attacks and automatic targeting.
- 2026-09-12: Expanded achievements from sixteen to twenty-eight with cumulative long-term ladders for kills, victories, battles, summons, hero skills, and fortress bombardment, including 500- and 1,000-kill rewards.
- 2026-09-12: Added click-safe mouse, pen, and touch drag scrolling to every horizontal fortress technology branch while retaining native scrollbars and vertical page gestures.
- 2026-09-13: Added a rank-5 soldier equipment capstone that grants one extra body per deployment, applies symmetrically to regular stage troops, and remains non-stacking across completed equipment branches.
- 2026-09-13: Reduced large-battle CPU and heap spikes with bounded reusable combat-effect pools, allocation-free unit hit feedback, a reusable attack-target buffer, and prompt Web Audio node disconnection.
- 2026-09-13: Replaced numeric soldier summon countdowns with an animated inactive-to-ready card wipe and completion pulse while retaining exact cooldown information in accessible labels.
- 2026-09-13: Rebalanced ranged roles so two-body Archers dominate range and single-target pressure while the tougher, harder-hitting Crossbow is capped at a lined-up two-target pierce.
- 2026-09-13: Replaced percentage mastery with visible character-specific flat HP/ATK gains and strengthened hero levels with scaling active skills plus bounded respawn-time reduction.
- 2026-09-13: Capped heroes at level 30, added combat-backed awakenings at levels 10/20/30, and introduced the three-use full-gauge `전시 동원령` battle skill with an `E` hotkey.
- 2026-09-13: Expanded the campaign to 30 stages across five progressively revealed regions, added a capped stage-derived fortress-distance curve, converted campaign bosses into boss-plus-fortress objectives, and separated four boss-only encounters into a dedicated challenge roster.
- 2026-09-13: Reframed the campaign as a continental counteroffensive against the Demon Army, replaced current `거신` terminology with varied `마수`, structured stage factions and terrain effects, and introduced terrain-amplified beast challenges that grant unmodified shared troop forms once.
- 2026-09-13: Expanded the shared roster from 12 to 50 troops across eight armory families, added explicit Mage, Archmage, Griffin, and Ifrit roles, distributed every new troop through late-campaign encounter windows or beast challenges, and added family filtering plus derived 54-entry codex achievements.
- 2026-09-13: Reduced the title screen to New Game, Load, Import, and Credits; moved every progression menu, beast challenge, daily claim, and sound setting into the kingdom-map hub; redirected progression and result navigation back to the map; and added normalized JSON save importing.
- 2026-09-13: Separated the kingdom-operation controls from the map canvas as a compact desktop side panel and responsive tablet/phone toolbar, reducing button area while increasing menu-label legibility.
- 2026-09-13: Enlarged the campaign map, replaced the separate beast-challenge menu with milestone-revealed rift nodes inside the draggable world, and added data-driven stage feature rewards beginning with a stage-9 Gold-to-hero-XP Training Ground.
- 2026-09-13: Increased early battlefield fortress separation from 820 to 1,050 virtual units and retuned the distance curve to +25 per stage until it reaches the unchanged 1,390 cap at stage 15, after which it stays constant.
- 2026-09-13: Removed the stage-number-shaped difficulty metadata and connected the map to the live encounter-pressure estimator, presenting data-derived five-tier combat evaluations instead of `stage/30`.
- 2026-09-14: Added small, slow, alive-capped fortress garrisons to all five campaign boss sieges and made destroying the fortress stop their production, while keeping map-rift challenges boss-only.
- 2026-09-14: Promoted the Griffin Rider into a 195-Command top-tier flying assault unit with 520 HP, 6 defense, 82 attack, and stronger cleave; reduced scripted debut counts and removed Griffins from repeating reinforcement rotations to preserve the linear campaign curve.
- 2026-09-14: Added a second character atlas with dedicated Goblin Archer, Goblin Bomber, Orc Berserker, and Orc Shaman art, and generalized React/Phaser rendering to resolve data-driven sheet and frame IDs.
- 2026-09-14: Rebalanced inefficient upper-tier troops, added a separate Command-efficiency regression audit, and capped base troop costs at the unupgraded 200 Command maximum.
- 2026-09-14: Added symmetric per-side living-body limits for exceptional beasts, spirits, and top-tier summons, including HUD/armory disclosure and capstone-aware player and enemy spawn enforcement.
- 2026-09-14: Strengthened all beast-only challenge terrain to visible HP ×10 and ATK ×2.5, redistributed hidden named-boss durability modifiers, and raised combined challenge durability by approximately 11–29% without changing acquired base units.
- 2026-09-14: Extended `yarn balance` with an adversarial focused-upgrade progression report; it demonstrates that a first-clear-only Militia weapon +5 is affordable before stage 4 and that its free fourth body nearly erases the intended stage-3-to-4 relative difficulty increase.
- 2026-09-14: Added a stage-6-revealed permanent 1.5× battle-speed license for 200 Royal Gems, persisted its entitlement and 1×/1.5× preference, and applied the selected speed consistently to simulation delta, timer events, and combat tweens without restarting Phaser.
- 2026-09-16: Replaced the whole-combatant attack squash with allocation-free localized slash, thrust, shoot, cast, crush, and lunge rigs for every player unit, enemy, hero, boss, and fortress strike while retaining the existing single-pose PNG atlas contract.
- 2026-09-16: Made `계속하기` the first and primary title action whenever browser-local progress exists, while retaining confirmed New Game as the second action and the no-save disabled Load state.
- 2026-09-16: Moved player troops, heroes, and enemy-produced squads behind their respective fortresses and added symmetric living-fortress target shielding so ranged units can fire from cover and melee reserves can counterattack through the gate.
- 2026-09-16: Added a default twelve-series stacked achievement view that prioritizes pending rewards and next targets, plus an `전체 보기` toggle that restores all twenty-eight individual cards.
- 2026-09-16: Expanded the twelve achievement series from twenty-eight to sixty-four milestones and moved the stage-6 battle-speed purchase into a dedicated responsive `수수께끼 상인` shop instead of buying directly from the map operations panel.
- 2026-09-16: Added five-rank `전리품 회계` and `왕립 야전 교범` economy branches for +5% battle Gold and battle mastery XP per rank, with reward scaling enforced in the store and shown in map/result/fortress UI.
- 2026-09-16: Added a four-scene keyboard-accessible counteroffensive opening for New Game while preserving direct Continue and Import flows.
- 2026-09-16: Rebuilt New Game's opening as an approximately 21-second auto-playing illustrated cinematic with four original 16:9 scenes, timed copy fades, camera and light movement, animated progress, automatic map entry, optional skip, structured scene data, and recorded generation prompts.
- 2026-09-16: Moved opening copy from an opaque lower-left card into a centered, borderless cinematic lower third with a full-width bottom vignette for stronger readability and immersion.
- 2026-09-16: Enlarged opening narration and softened its bottom vignette so the copy reads as cinematic subtitles rather than a dark in-game dialogue container.
- 2026-09-16: Restored true alpha in the four-frame expansion atlas from its transparent sources and added the deterministic `yarn art:atlas` rebuild workflow.
- 2026-09-16: Expanded the hero roster to five with healer Mirena and commander Bran, added level-10/20/30 stat auras for every hero, converted the shared Priest into a symmetric battlefield healer, and included healing pressure in the offline difficulty model.
- 2026-09-16: Added a least-privilege GitHub Actions workflow that automatically assigns newly opened or reopened pull requests to their authors without checking out pull-request code.
- 2026-09-16: Added versioned portable JSON save export, consolidated import/export into the four-action title screen's Save Management dialog, and replaced browser confirmations with a responsive keyboard-accessible in-game modal.
