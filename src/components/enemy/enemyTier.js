export const getEnemyTier = (enemy) =>
  enemy.isBoss || enemy.tier === "BOSS"
    ? "BOSS"
    : enemy.elite || enemy.tier === "ELITE"
      ? "ELITE"
      : "NORMAL";
