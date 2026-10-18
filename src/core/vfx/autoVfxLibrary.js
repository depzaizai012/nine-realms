import { COLORS } from "../../data/elements/index.js";
import { IMPORTED_VFX_EFFECTS } from "../../data/vfx/generatedEffects.js";

export const VFX_STORAGE_KEY = "nine-realms-vfx-studio-v1";
export const VFX_ELEMENTS = Object.freeze(Object.keys(COLORS));
export const BASIC_VFX_BY_CLASS = Object.freeze({
  TANK: "BASIC_TANK_SHIELD_BASH",
  WARRIOR: "BASIC_WARRIOR_SLASH",
  MAGE: "BASIC_MAGE_MAGIC_BOLT",
  SUPPORT: "BASIC_SUPPORT_SPIRIT_PULSE",
});

// Built-in browser effects are original CSS primitives, not RPG Maker assets.
// Imported licensed Effekseer files are registered separately by the pack scanner.
export const BUILTIN_VFX_EFFECTS = Object.freeze([
  { id: "BASIC_TANK_SHIELD_BASH", name: "Shield Bash", category: "Basic", shape: "shield", duration: 440, scale: 1.1, license: "Project code" },
  { id: "BASIC_WARRIOR_SLASH", name: "Warrior Slash", category: "Basic", shape: "slash", duration: 400, scale: 1.3, license: "Project code" },
  { id: "BASIC_MAGE_MAGIC_BOLT", name: "Magic Bolt", category: "Basic", shape: "orb", duration: 540, scale: 1.15, license: "Project code" },
  { id: "BASIC_SUPPORT_SPIRIT_PULSE", name: "Spirit Pulse", category: "Basic", shape: "pulse", duration: 520, scale: 1.1, license: "Project code" },
  { id: "HIT_IMPACT", name: "Impact Burst", category: "Impact", shape: "impact", duration: 300, scale: 1, license: "Project code" },
  { id: "HEAL_PULSE", name: "Heal Pulse", category: "Support", shape: "heal", duration: 650, scale: 1.15, license: "Project code" },
  { id: "SHIELD_AURA", name: "Shield Aura", category: "Support", shape: "shield", duration: 660, scale: 1.2, license: "Project code" },
  { id: "ULTIMATE_PULSE", name: "Ultimate Pulse", category: "Ultimate", shape: "burst", duration: 780, scale: 1.65, license: "Project code" },
  { id: "ENEMY_STRIKE", name: "Enemy Strike", category: "Enemy", shape: "impact", duration: 380, scale: 1.05, license: "Project code" },
]);

export const AUTO_VFX_CATALOG = Object.freeze([...BUILTIN_VFX_EFFECTS, ...IMPORTED_VFX_EFFECTS]);
const lookup = new Map(AUTO_VFX_CATALOG.map((entry) => [entry.id, entry]));

export function sanitizeVfxOverrides(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
  const safe = {};
  for (const [id, value] of Object.entries(candidate)) {
    if (!lookup.has(id) || !value || typeof value !== "object") continue;
    const scale = value.scale === undefined ? NaN : Number(value.scale);
    const duration = value.duration === undefined ? NaN : Number(value.duration);
    safe[id] = {
      ...(Number.isFinite(scale) ? { scale: Math.min(3, Math.max(0.4, scale)) } : {}),
      ...(Number.isFinite(duration) ? { duration: Math.round(Math.min(3000, Math.max(100, duration))) } : {}),
    };
  }
  return safe;
}

export function readVfxOverrides(storage = typeof localStorage === "undefined" ? null : localStorage) {
  if (!storage) return {};
  try {
    return sanitizeVfxOverrides(JSON.parse(storage.getItem(VFX_STORAGE_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function saveVfxOverrides(overrides, storage = typeof localStorage === "undefined" ? null : localStorage) {
  const safe = sanitizeVfxOverrides(overrides);
  if (storage) storage.setItem(VFX_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function getVfxPreset(id, overrides = {}) {
  const preset = lookup.get(id);
  return preset ? { ...preset, ...(sanitizeVfxOverrides(overrides)[id] || {}) } : null;
}

export const VFX_CLASS_MAPPING_KEY = "nine-realms-vfx-class-mappings-v1";
export function sanitizeVfxClassMappings(candidate) {
  const safe = {};
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return safe;
  for (const role of Object.keys(BASIC_VFX_BY_CLASS)) {
    if (typeof candidate[role] === "string" && lookup.has(candidate[role])) safe[role] = candidate[role];
  }
  return safe;
}

export function readVfxClassMappings(storage = typeof localStorage === "undefined" ? null : localStorage) {
  if (!storage) return {};
  try {
    return sanitizeVfxClassMappings(JSON.parse(storage.getItem(VFX_CLASS_MAPPING_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function saveVfxClassMappings(mapping, storage = typeof localStorage === "undefined" ? null : localStorage) {
  const safe = sanitizeVfxClassMappings(mapping);
  storage?.setItem(VFX_CLASS_MAPPING_KEY, JSON.stringify(safe));
  return safe;
}

export function getClassBasicVfx(hero, mapping = readVfxClassMappings()) {
  const role = hero?.role ?? hero?.classId ?? hero?.class;
  return mapping[role] || BASIC_VFX_BY_CLASS[role] || BASIC_VFX_BY_CLASS.MAGE;
}

export function getElementColor(element) {
  return COLORS[element] || COLORS.LIGHT;
}
