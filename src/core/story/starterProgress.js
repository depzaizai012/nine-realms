import { STARTER_HERO_IDS, STARTER_SUMMON_ID } from "../../data/starterRoster.js";

export const STARTER_SAVE_KEY = "nine-realms:starter-roster:v1";

/** Minimal local prototype. Backend ownership must supersede localStorage later. */
export function grantStarterHeroes(storage, now = Date.now()) {
  let record = { summonId: STARTER_SUMMON_ID, heroIds: [] };
  try {
    const previous = JSON.parse(storage.getItem(STARTER_SAVE_KEY) || "null");
    if (previous && Array.isArray(previous.heroIds)) {
      record.heroIds = previous.heroIds.filter((id) => typeof id === "string");
      if (typeof previous.grantedAt === "number") record.grantedAt = previous.grantedAt;
    }
  } catch { /* New player or storage unavailable */ }
  record.heroIds = [...new Set([...record.heroIds, ...STARTER_HERO_IDS])];
  record.grantedAt ||= now;
  try { storage.setItem(STARTER_SAVE_KEY, JSON.stringify(record)); } catch { /* Offline fallback */ }
  return record;
}
