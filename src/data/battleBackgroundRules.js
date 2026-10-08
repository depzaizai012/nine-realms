export const BATTLE_BACKGROUND_RULES = {
  VERDANT_REALM: {
    normal: {
      assetKey: "BG_W01_COMMON_WHISPERING_WILDS",
      groundBottomPercent: 18,
    },
    elite: {
      assetKey: "BG_W01_ELITE_THORNROOT_CROSSING",
      groundBottomPercent: 18,
    },
    boss: {
      assetKey: "BG_W01_BOSS_BRIARHEART_SANCTUARY",
      groundBottomPercent: 16,
    },
  },
};
export function resolveBattleBackground(stage) {
  const number = Number(String(stage.id).split("-")[1]);
  const tier =
    stage.backgroundTier ??
    (number === 10 ? "boss" : number >= 7 && number <= 9 ? "elite" : "normal");
  return {
    tier,
    ...(BATTLE_BACKGROUND_RULES[stage.realm]?.[tier] || {
      assetKey: stage.background,
      groundBottomPercent: 18,
    }),
  };
}
