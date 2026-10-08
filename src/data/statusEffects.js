const svg = (path) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
export const STATUS_CATEGORIES = {
  STUN: "CONTROL",
  FREEZE: "CONTROL",
  SILENCE: "CONTROL",
  POISON: "DOT",
  BURN: "DOT",
  REGEN: "HOT",
  ATTACK_UP: "BUFF",
  ATTACK_DOWN: "DEBUFF",
};
export const STATUS_EFFECTS = {
  CONTROL: {
    name: "Control",
    priority: 100,
    tone: "debuff",
    iconSvg: svg(
      '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    ),
  },
  DOT: {
    name: "Damage over time",
    priority: 90,
    tone: "debuff",
    iconSvg: svg(
      '<path d="M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/><path d="m9 13 6 5m0-5-6 5"/>',
    ),
  },
  DEBUFF: {
    name: "Debuff",
    priority: 85,
    tone: "debuff",
    iconSvg: svg('<path d="M12 3v17m-6-6 6 6 6-6M5 5h14"/>'),
  },
  BUFF: {
    name: "Buff",
    priority: 70,
    tone: "buff",
    iconSvg: svg('<path d="M12 21V4m-6 6 6-6 6 6M5 19h14"/>'),
  },
  SHIELD: {
    name: "Shield",
    priority: 70,
    tone: "buff",
    iconSvg: svg(
      '<path d="m12 2 8 4v7c0 4-4 7-8 9-4-2-8-5-8-9V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
    ),
  },
  HOT: {
    name: "Healing over time",
    priority: 60,
    tone: "buff",
    iconSvg: svg('<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>'),
  },
  UNKNOWN: {
    name: "Effect",
    priority: 10,
    tone: "neutral",
    iconSvg: svg('<path d="m12 2 4 6 6 4-6 4-4 6-4-6-6-4 6-4 4-6Z"/>'),
  },
};
