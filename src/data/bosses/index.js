import { REALMS } from "../realms/index.js";
const names = [
  "THORNHEART",
  "IGNIVAR",
  "VAELITH",
  "SAHMURET",
  "NOCTHAR",
  "VOLTARIS",
  "NERATHYS",
  "SERAPHEL",
  "VHARON",
];
const titles = [
  "Sovereign of the Ancient Grove",
  "Tyrant of the Ember Throne",
  "Queen of the Eternal Frost",
  "Warden of the Sunken Crown",
  "Keeper of the Veil",
  "Titan of the Stormforge",
  "Empress of the Drowned Deep",
  "Arbiter of the Celestial Gate",
  "Devourer of the Nine Realms",
];
export const BOSSES = Object.fromEntries(
  names.map((name, i) => {
    const id = `BOSS_W0${i + 1}_${name}`;
    return [
      id,
      {
        id,
        name,
        realm: REALMS[i].id,
        title: titles[i],
        phases:
          i === 0
            ? ["Ancient Grove Guardian", "Void Corruption", "Heart of the Void"]
            : [],
        deathDuration: 1500,
      },
    ];
  }),
);
