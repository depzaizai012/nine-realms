import { MATCH_CONFIG } from "../../data/boardConfig.js";
import { HERO_HUD_CONFIG } from "../../data/heroHudConfig.js";
import { STATUS_EFFECTS, STATUS_CATEGORIES } from "../../data/statusEffects.js";
const number = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value) => Math.max(0, Math.min(1, value));
export function getHeroVitals(hero) {
  const maxHp = Math.max(0, number(hero.stats?.hp ?? hero.maxHp)),
    hp = Math.max(0, number(hero.hp)),
    alive = hp > 0;
  const mana = Math.max(
      0,
      number(hero.currentMana ?? hero.mana ?? hero.energy),
    ),
    maxMana = Math.max(
      1,
      number(hero.maxMana ?? hero.maxEnergy, MATCH_CONFIG.maxEnergy),
    );
  const ultimateCost = Math.max(
    0,
    number(
      hero.ultimate?.manaCost ??
        hero.ultimate?.energyCost ??
        hero.ultimateManaCost,
      MATCH_CONFIG.maxEnergy,
    ),
  );
  const hpRatio = maxHp > 0 ? clamp(hp / maxHp) : 0;
  return {
    hp: alive ? hp : 0,
    maxHp,
    hpRatio,
    hpTone:
      hpRatio >= HERO_HUD_CONFIG.hpThresholds.green
        ? "GREEN"
        : hpRatio >= HERO_HUD_CONFIG.hpThresholds.yellow
          ? "YELLOW"
          : "RED",
    mana,
    maxMana,
    manaRatio: clamp(mana / maxMana),
    ultimateCost,
    alive,
    ready: alive && mana >= ultimateCost,
  };
}
export function getHeroStatuses(hero) {
  const source = hero.statuses ?? hero.statusEffects ?? [];
  const list = Array.isArray(source)
    ? [...source]
    : source instanceof Map
      ? [...source.values()]
      : Object.values(source);
  // Adapt existing combat fields read-only; never create or apply combat effects here.
  const hasType = (type) =>
    list.some(
      (s) =>
        s &&
        s.active !== false &&
        s.durationTurns !== 0 &&
        String(s.type ?? s.category).toUpperCase() === type,
    );
  if (hero.shield > 0 && !hasType("SHIELD"))
    list.push({
      id: "combat-shield",
      type: "SHIELD",
      name: "Shield",
      amount: hero.shield,
    });
  if (hero.modifiers?.buff > 0 && !hasType("BUFF"))
    list.push({
      id: "combat-attack-buff",
      type: "BUFF",
      name: "Attack up",
      amount: hero.modifiers.buff,
    });
  if (hero.modifiers?.debuff > 0 && !hasType("DEBUFF"))
    list.push({
      id: "combat-attack-debuff",
      type: "DEBUFF",
      name: "Attack down",
      amount: hero.modifiers.debuff,
    });
  return list
    .filter((s) => s && s.active !== false && s.durationTurns !== 0)
    .map((s, index) => {
      const rawType = String(s.type ?? s.category ?? "UNKNOWN").toUpperCase();
      const category = String(s.category ?? "").toUpperCase();
      const type = STATUS_EFFECTS[rawType]
          ? rawType
          : STATUS_EFFECTS[category]
            ? category
            : STATUS_CATEGORIES[rawType] || "UNKNOWN",
        definition = STATUS_EFFECTS[type] || STATUS_EFFECTS.UNKNOWN;
      return {
        ...s,
        id: s.id ?? `${type}-${index}`,
        type,
        effectType: rawType,
        name: s.name ?? definition.name,
        priority: number(s.priority, definition.priority),
        tone: definition.tone,
        iconSvg: definition.iconSvg,
        order: index,
      };
    })
    .sort((a, b) => b.priority - a.priority || a.order - b.order);
}
export function getStatusSlots(statuses, max = HERO_HUD_CONFIG.maxStatusSlots) {
  const overflowCount = statuses.length > max ? statuses.length - (max - 1) : 0;
  return {
    visible: statuses.slice(0, overflowCount ? max - 1 : max),
    overflowCount,
    totalCount: statuses.length,
  };
}
