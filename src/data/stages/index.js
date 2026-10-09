const slime = "ENEMY_W01_001_FOREST_SLIME";
export const STAGES = {
  "1-1": {
    id: "1-1",
    name: "Whispers in the Canopy",
    realm: "VERDANT_REALM",
    background: "VERDANT_VILLAGE",
    subtitle: "THE FIRST PATH",
    // Canonical five Crystal Echoes given by the free beginner ritual.
    // SSR Aria and Fenrir join the story later instead of at Stage 1-1.
    team: [
      "HERO_003_ROWAN",
      "HERO_006_EMBER",
      "HERO_007_TIKO",
      "HERO_004_SYLVA",
      "HERO_005_PIP",
    ],
    hazards: [],
    waves: [
      [{ id: slime }, { id: slime }],
      [{ id: slime }, { id: slime }, { id: slime }],
      [
        { id: slime },
        { id: slime },
        { id: slime, elite: true, stats: { maxHp: 1250, attack: 80 } },
      ],
    ],
  },
};
