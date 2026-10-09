import { STARTER_HERO_IDS } from "../starterRoster.js";
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
    team: [...STARTER_HERO_IDS],
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
