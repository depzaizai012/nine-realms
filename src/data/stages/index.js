const slime = "ENEMY_W01_001_FOREST_SLIME";
export const STAGES = {
  "1-1": {
    id: "1-1",
    name: "Whispers in the Canopy",
    realm: "VERDANT_REALM",
    background: "VERDANT_VILLAGE",
    subtitle: "THE FIRST PATH",
    team: [
      "HERO_001_ARIA",
      "HERO_002_FENRIR",
      "HERO_003_ROWAN",
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
