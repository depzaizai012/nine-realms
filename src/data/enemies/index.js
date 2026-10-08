export const ENEMIES = Object.fromEntries(
  [
    "FOREST_SLIME",
    "THORN_WOLF",
    "LEAF_GOBLIN",
    "POISON_SPIDER",
    "ANCIENT_GUARDIAN",
  ].map((name, i) => {
    const id = `ENEMY_W01_00${i + 1}_${name}`;
    return [
      id,
      {
        id,
        assetId: id,
        name: name.replaceAll("_", " "),
        element: "WOOD",
        maxHp: 850 + i * 200,
        attack: 55 + i * 15,
        defense: 0,
        attackVfx: "SLIME_SPLASH",
        deathVfx: "GREEN_DISSOLVE",
        multiAttack: false,
        render: {
          idleScale: 1,
          attackScale: i === 0 ? 1.1 : 1,
          idleOffsetX: 0,
          idleOffsetY: i === 0 ? 8.85 : 0,
          attackOffsetX: 0,
          attackOffsetY: i === 0 ? 5.96 : 0,
          anchorX: 0.5,
          anchorY: 1,
        },
      },
    ];
  }),
);
