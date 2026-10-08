import { MATCH_CONFIG as C } from "../../data/boardConfig.js";
import { calculateStats } from "../../data/heroes/index.js";
import { getElementMultiplier } from "../../data/elementalMatchups.js";
export function selectedEnemy(s) {
  return (
    s.enemies.find((e) => e.uid === s.selected && e.hp > 0) ||
    s.enemies.find((e) => e.hp > 0)
  );
}
export function heroAttack(s, match) {
  const hero = s.heroes.find((h) => h.element === match.element && h.hp > 0),
    target = selectedEnemy(s);
  if (!hero || !target) return null;
  hero.stats = calculateStats(hero, hero.modifiers);
  const tier = Math.min(2, Math.max(0, match.count - 3)),
    amount = Math.max(
      1,
      Math.round(
        hero.stats.atk *
          C.damage[tier] *
          getElementMultiplier(hero.element, target.element) -
          target.defense,
      ),
    );
  target.hp = Math.max(0, target.hp - amount);
  hero.energy = Math.min(C.maxEnergy, hero.energy + C.energy[tier]);
  return {
    kind: "damage",
    source: hero.id,
    target: target.uid,
    amount,
    vfx: hero.attackVfx,
    element: hero.element,
    dead: target.hp === 0,
  };
}
export function chooseHero(s, previous, rng = Math.random) {
  const living = s.heroes.filter((h) => h.hp > 0),
    pool = living.length > 1 ? living.filter((h) => h.id !== previous) : living;
  return pool[Math.floor(rng() * pool.length)];
}
export function enemyAttack(s, enemy, hero) {
  const damage = Math.max(
      1,
      Math.round(
        enemy.attack *
          (1 - (enemy.debuff || 0)) *
          getElementMultiplier(enemy.element, hero.element),
      ),
    ),
    absorbed = Math.min(hero.shield, damage);
  hero.shield -= absorbed;
  hero.hp = Math.max(0, hero.hp - (damage - absorbed));
  return {
    kind: "damage",
    source: enemy.uid,
    target: hero.id,
    amount: damage - absorbed,
    vfx: enemy.attackVfx,
    element: enemy.element,
    dead: hero.hp === 0,
  };
}
export function ultimate(s, hero) {
  if (hero.hp <= 0 || hero.energy < C.maxEnergy) return [];
  hero.energy = 0;
  const events = [],
    skill = hero.ultimate;
  if (skill.damage) {
    const target = selectedEnemy(s);
    if (target) {
      const amount = Math.round(
        calculateStats(hero, hero.modifiers).atk *
          skill.damage *
          getElementMultiplier(hero.element, target.element),
      );
      target.hp = Math.max(0, target.hp - amount);
      events.push({
        kind: "damage",
        source: hero.id,
        target: target.uid,
        amount,
        element: hero.element,
        vfx: hero.attackVfx,
        crit: !!skill.crit,
        dead: target.hp === 0,
      });
      if (skill.debuff) target.debuff = skill.debuff;
    }
  }
  for (const target of s.heroes) {
    if (target.hp === 0 && skill.revive) {
      target.hp = skill.revive;
      events.push({
        kind: "heal",
        source: hero.id,
        target: target.id,
        amount: skill.revive,
        element: hero.element,
      });
      continue;
    }
    if (target.hp <= 0) continue;
    if (skill.heal) {
      const amount = Math.min(skill.heal, target.stats.hp - target.hp);
      target.hp += amount;
      if (amount)
        events.push({
          kind: "heal",
          source: hero.id,
          target: target.id,
          amount,
          element: hero.element,
        });
    }
    if (skill.shield) {
      target.shield += skill.shield;
      events.push({
        kind: "shield",
        source: hero.id,
        target: target.id,
        amount: skill.shield,
        element: hero.element,
      });
    }
    if (skill.buff) target.modifiers.buff = skill.buff;
  }
  return events;
}
