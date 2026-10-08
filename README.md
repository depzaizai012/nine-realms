# Legend of the Nine Realms

A new Vite / vanilla JavaScript mobile battle game. Only Stage 1-1, **Whispers in the Canopy**, is playable.

```sh
npm install
npm run dev
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

On Windows with PowerShell script execution disabled, use `npm.cmd` and `npx.cmd`. Browser tests start or reuse Vite on port 5175. Set `PLAYWRIGHT_CHROME_PATH` to use an installed Chrome executable.

Swipe adjacent gems, or tap two adjacent cells. Arrow keys swap the focused cell. Tap an enemy to select it. Match a hero's element to attack and gain energy. A gold energy bar marks an available ultimate; tap the hero to activate it. Pause remains in the top HUD. `AUTO OFF` reserves the future Auto Battle control and is disabled; combat stays manual.

## Architecture

| Area               | Responsibility                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/data/`        | Canonical realms, bosses, heroes, enemies, stages, elements, board configuration and themes                      |
| `src/data/assets/` | Generated asset catalog, central manifest, helpers, per-image fallback and stage preloader                       |
| `src/core/match3/` | Pure matching, specials, chain reactions, gravity, refill, move detection, shuffle; pointer input and idle hints |
| `src/core/battle/` | State creation, stat calculation, damage, energy, skills, sequential phases and persistent wave state            |
| `src/core/vfx/`    | Promise-based visual effects, timing configuration, registry, floating numbers, hit stop and shake               |
| `src/components/`  | Stable board cells, hero cards and selectable enemy sprites                                                      |
| `src/screens/`     | Data-driven battle layout and orchestration                                                                      |
| `src/styles/`      | Portrait layout and RPG styling                                                                                  |
| `tests/`           | Engine tests, browser verification, screenshots and automated balance evidence                                   |

Combat results are calculated in the battle engine. VFX consumes those results; it never decides damage, targets, HP or energy. A valid board gesture increments the turn once, resolves all cascades and hero actions, then awaits each living enemy action sequentially. Invalid moves animate back without spending a turn.

HP, energy, death, shields and modifiers persist when spawning a new wave. Enemy targeting selects a random living hero and excludes the previously attacked hero when another living hero exists. Ultimates are explicit charged actions; they do not spend a match gesture.

## Production assets

56 original PNGs are preserved under `public/assets`. Optimized derivatives under `public/assets/optimized` use the same production artwork. All 24 assets required by Stage 1-1 preload successfully, including the five ultimate art choices. Unused cut-ins, non-stage enemies, backgrounds and bosses are registered but not preloaded.

Run `npm run assets:prepare` after updating the asset pack to rebuild the optimized assets and generated catalog. Optimization reduces the full pack from 146,703,613 bytes to 3,351,314 bytes. Components request logical assets through manifest helpers.

The supplied pack lacks `HERO_004_SYLVA_FULL_BODY.png`. Sylva's HUD uses her avatar and her ultimate uses the existing `ULTIMATE_CUTIN`. The manifest resolves ultimate assets in order: full body → ultimate cut-in → battle cut-in → avatar, including a load-error fallback. Missing preferred art logs a development warning. Future realms and bosses have canonical data records; their artwork and stages are outside this slice.

The original `GEM_SPECIAL_LINE_H` image is vertical; `GEM_SPECIAL_LINE_V` is horizontal. The board renderer rotates these two overlays 90° while retaining canonical asset names. Logical Line H always clears a row and Line V always clears a column.

## Evidence and scope

See [POLISH_REPORT.md](POLISH_REPORT.md) for the current hero/ultimate/board polish report and [VERIFICATION.md](VERIFICATION.md) for the original vertical-slice acceptance report. Screenshots cover 390×844, 360×800 and 412×915. The automated balance smoke check is reproducible with `node scripts/balance-smoke.js`; it is not a measured new-player clear rate.

Normal hero actions raise the active card 28 px and scale it to 1.08, then play their element-specific attack and return. Full-body ultimates have their own 2.3-second presentation. Timing lives in `src/core/vfx/vfxConfig.js`; board and hero presentation controllers share the existing VFX primitives. Gravity uses before/after gem IDs and animates only moved/refilled cells with no opacity sweep.

`src/core/battle/autoBattleAdapter.js` exposes legal moves, special metadata, generic target features and ready ultimates. Its actions reference the public human controller directly. `src/data/autoBattleConfig.js` keeps availability and default enablement false. There is no Auto scheduler or move policy yet.

The development-only `window.__battle` exposes state and controllers for browser tests. Vite excludes this handle from the production build. There is no backend or external account dependency. Stage 1-2 is not implemented.
