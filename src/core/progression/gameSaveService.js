import { STAGES } from "../../data/stages/index.js";

export const PROGRESS_KEY = "nine-realms.progress.v1";
const VALID_STAGE_ID = /^[1-9][0-9]*-(?:[1-9][0-9]*)$/;
const baseStage = () => ({ unlocked: false, cleared: false, stars: 0, bestTurns: null });
export function createDefaultProgress() {
  return { saveVersion: 1, stages: { "1-1": { ...baseStage(), unlocked: true } } };
}
function safeStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}
export function loadProgress(storage = safeStorage()) {
  const fallback = createDefaultProgress();
  try {
    const saved = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? "null");
    if (saved?.saveVersion !== 1 || !saved.stages || typeof saved.stages !== "object")
      return fallback;
    // Only restore known progression fields. Do not trust arbitrary saved objects.
    for (const [id, value] of Object.entries(saved.stages)) {
      if (!VALID_STAGE_ID.test(id) || !value || typeof value !== "object") continue;
      fallback.stages[id] = {
        unlocked: Boolean(value.unlocked),
        cleared: Boolean(value.cleared),
        stars: Math.max(0, Math.min(3, Math.trunc(Number(value.stars) || 0))),
        bestTurns: Number.isInteger(value.bestTurns) && value.bestTurns >= 0
          ? value.bestTurns : null,
      };
    }
    fallback.stages["1-1"].unlocked = true;
    return fallback;
  } catch {
    // Private browsing, disabled storage and broken saves must not crash the UI.
    return fallback;
  }
}
export function stageProgress(progress, id) {
  return progress?.stages?.[id] ?? baseStage();
}
export function applyStageVictory(progress, id, { turns = 0, heroesStanding = 1 } = {}) {
  if (!STAGES[id]) return progress;
  const stages = Object.fromEntries(
    Object.entries(progress?.stages ?? {}).map(([key, value]) => [key, { ...value }]),
  );
  const prior = stageProgress(progress, id);
  const stars = heroesStanding >= 4 ? 3 : heroesStanding >= 2 ? 2 : 1;
  const bestTurns = Number.isFinite(turns) && turns >= 0 ? Math.trunc(turns) : null;
  stages[id] = {
    ...prior,
    unlocked: true,
    cleared: true,
    stars: Math.max(prior.stars, stars),
    bestTurns: bestTurns === null ? prior.bestTurns
      : prior.bestTurns === null ? bestTurns : Math.min(prior.bestTurns, bestTurns),
  };
  const [world, stage] = id.split("-").map(Number);
  const nextId = `${world}-${stage + 1}`;
  if (stage < 10) stages[nextId] = { ...baseStage(), ...stages[nextId], unlocked: true };
  return { saveVersion: 1, stages };
}
export function recordStageVictory(id, result, storage = safeStorage()) {
  const next = applyStageVictory(loadProgress(storage), id, result);
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch {
    // Prototype mode can still progress within this render if storage is disabled.
  }
  return next;
}
