import { STAGES } from "./index.js";

// Navigation metadata is independent of Battle configuration. Unbuilt stages
// remain visible on the route but can never start a fabricated battle.
export const STAGE_SELECT_BY_REALM = Object.freeze({
  VERDANT_REALM: Object.freeze(
    Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      const id = `1-${number}`;
      return Object.freeze({
        id,
        realm: "VERDANT_REALM",
        number,
        title: STAGES[id]?.name ?? (number === 10 ? "The Realm Guardian" : "Uncharted Path"),
        tier: number === 10 ? "BOSS" : number >= 7 ? "ELITE" : "NORMAL",
        playable: Boolean(STAGES[id]),
        // Snaking path, starting at the bottom-left and ending top-right.
        row: 5 - Math.floor(index / 2),
        column: (Math.floor(index / 2) % 2 === 0)
          ? (index % 2) + 1
          : 2 - (index % 2),
      });
    }),
  ),
});

export function getRealmStages(realmId) {
  return STAGE_SELECT_BY_REALM[realmId] ?? [];
}
