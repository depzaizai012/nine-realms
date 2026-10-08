const specs = [
  [
    "ARIA",
    "Aria",
    "WOOD",
    "SUPPORT",
    "SSR",
    760,
    105,
    "WOOD_LEAF_BOLT",
    { heal: 260 },
  ],
  [
    "FENRIR",
    "Fenrir",
    "FIRE",
    "WARRIOR",
    "SSR",
    980,
    185,
    "FIRE_SLASH",
    { damage: 3.8, crit: true },
  ],
  [
    "ROWAN",
    "Rowan",
    "EARTH",
    "TANK",
    "SR",
    1420,
    95,
    "EARTH_SHARD",
    { damage: 2, shield: 240 },
  ],
  [
    "SYLVA",
    "Sylva",
    "DARK",
    "MAGE",
    "SR",
    820,
    165,
    "DARK_BOLT",
    { damage: 3.5, debuff: 0.2 },
  ],
  [
    "PIP",
    "Pip",
    "LIGHT",
    "SUPPORT",
    "R",
    700,
    85,
    "LIGHT_BOLT",
    { heal: 180, revive: 220, buff: 0.2 },
  ],
];
export const HEROES = Object.fromEntries(
  specs.map((s, i) => {
    const id = `HERO_00${i + 1}_${s[0]}`;
    return [
      id,
      {
        id,
        assetId: id,
        name: s[1],
        element: s[2],
        role: s[3],
        rarity: s[4],
        realm: "VERDANT_REALM",
        baseStats: { hp: s[5], atk: s[6] },
        attackVfx: s[7],
        ultimate: s[8],
      },
    ];
  }),
);
export function calculateStats(hero, m = {}) {
  const scale = 1 + (m.level || 0) * 0.04 + (m.stars || 0) * 0.08;
  return {
    hp: Math.round(hero.baseStats.hp * scale + (m.equipment?.hp || 0)),
    atk: Math.round(
      (hero.baseStats.atk * scale + (m.equipment?.atk || 0)) *
        (1 + (m.buff || 0) - (m.debuff || 0)),
    ),
  };
}
