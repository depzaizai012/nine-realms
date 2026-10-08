export const HERO_HUD_CONFIG = Object.freeze({
  hpThresholds: { green: 0.6, yellow: 0.3 },
  maxStatusSlots: 4,
  timings: {
    hpFill: 220,
    hpTrailDelay: 150,
    hpTrail: 500,
    hpColor: 220,
    manaFill: 260,
    readyExit: 200,
    readyBurst: 600,
    readyIdle: 3000,
  },
  // Source PNG measurements are recorded in tests/artifacts/hud-baseline.json.
  frameArtScale: 1.28,
  glowOpacity: 0.55,
  barArt: { left: -6.86, top: -115.36, width: 113.65, height: 316.79 },
  barChannels: {
    hp: { left: 5.5, top: 17, width: 89, height: 38 },
    mana: { left: 8, top: 77, width: 84, height: 16 },
  },
});
