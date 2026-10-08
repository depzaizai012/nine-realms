import { ELEMENTS } from "./elements/index.js";
// Current combat has no elemental multiplier; never invent advantage rules.
export const ELEMENTAL_MATCHUPS = Object.freeze({
  enabled: false,
  defaultMultiplier: 1,
  elements: ELEMENTS,
  advantages: [],
});
export const getElementMultiplier = (attacker, target) =>
  ELEMENTAL_MATCHUPS.enabled
    ? (ELEMENTAL_MATCHUPS.advantages.find(
        (rule) => rule.attacker === attacker && rule.target === target,
      )?.multiplier ?? ELEMENTAL_MATCHUPS.defaultMultiplier)
    : ELEMENTAL_MATCHUPS.defaultMultiplier;
