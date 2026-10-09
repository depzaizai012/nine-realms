# Legend of the Nine Realms

A Vite / vanilla JavaScript fantasy mobile match-3 RPG prototype. The default entry screen is the Verdant Realm Stage Select. Only Stage 1-1, **Whispers in the Canopy**, has a playable Battle; Stage 1-2 through 1-10 appear as locked route nodes and are not fake battles.

```sh
npm install
npm run dev
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

On Windows with PowerShell script execution disabled, use `npm.cmd` and `npx.cmd`. Browser tests start or reuse Vite on port 5175. Set `PLAYWRIGHT_CHROME_PATH` to use an installed Chrome executable.

## Development, production build and Vercel

Use Node.js **24.x** and npm; keep `package-lock.json` committed. For a clean checkout run `npm ci --include=dev`, then `npm run dev`. Production verification:

```sh
npm run check:secrets
npm test
npm run build
npm run check:deployment
npm run test:production
```

`test:production` uses the built `dist` files and a local case-sensitive routing preview; it does not deploy. `npm run preview` is available for a normal local Vite build preview. The app currently needs **no application environment variables or API credentials**.

Confirmed targets: GitHub [depzaizai012/nine-realms](https://github.com/depzaizai012/nine-realms), Vercel project **9realms**, requested personal account **depzaizai012**, preferred production address **https://9realms.vercel.app**. No push or deployment is performed by preparation scripts.

After explicit approval to publish, push the `main` branch and import that repository in Vercel. Select project `9realms`, root directory `.`, Vite, Node 24.x, and production branch `main`. `vercel.json` sets install `npm ci --include=dev`, build `npm run build`, output `dist`, and SPA rewrites. Files under `/assets` and missing filenames with extensions stay outside the SPA fallback, so a wrong asset path cannot silently return HTML. These settings follow [Vercel's Vite SPA guidance](https://vercel.com/docs/frameworks/frontend/vite) and [Node.js version settings](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

The Battle/Town/Stage Select router keeps screen state in memory. The root URL `/` launches Stage Select, and `/battle/1-1` or `/?screen=battle` launches the existing playable Battle directly (used by legacy tests). Direct non-asset URL refreshes load the SPA entry; unsupported deep URLs fall back to Stage Select. The requested `.vercel.app` address must be available and assigned by Vercel when the project is created/linked.

See [DEPLOYMENT_PREPARATION.md](DEPLOYMENT_PREPARATION.md) for exact commit/push commands, destination checks and iOS/Android testing steps. Do not commit `.env` files, credentials or `.vercel` linkage files.

Swipe adjacent gems, or tap two adjacent cells. Arrow keys swap the focused cell. Tap an enemy to select it. Match a hero's element to attack and gain energy. A gold energy bar marks an available ultimate; tap the hero to activate it. The top HUD has production Help, x2 and Pause controls. Pause offers Replay and Back to Town; outside/Escape resumes. See [BATTLE_PRESENTATION_REPORT.md](BATTLE_PRESENTATION_REPORT.md) for current asset/background/grounding updates.

## Verdant Realm Stage Select (prototype)

- The default `/` route shows a portrait fantasy route map with ten data-driven stages. Stage 1-1 is the only battle that can be launched; all later stages are visible, locked, or marked "Coming soon" when unlocked.
- The victory result now records a local save in `localStorage`, key `nine-realms.progress.v1`, with `saveVersion`, unlocked/cleared stages, best stars and best turn count. A victory unlocks the next stage's path without pretending its Battle exists. Defeat does not change progression.
- Use the result dialog's **Stage Select** button to return from Battle, or **Pause → Back to Town → Stage Select**. The Town placeholder is preserved for backwards compatibility. The real Home Screen can later replace this placeholder.
- The stage definitions in `src/data/stages/stageSelect.js` are separate from Battle configurations in `src/data/stages/index.js`. The saved progression API in `src/core/progression/gameSaveService.js` can later use a cloud-backed adapter.
- All images in this screen use existing Verdant assets or CSS ornaments; it does not depend on uncommitted Home or map assets.
- Prototype saves are per-browser and can be cleared by the user. There is no database, user login, rewards server, or cross-device sync.

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

The current inventory contains 79 source PNGs and 56 existing derivatives. Stage 1-1 preloads 36 unique URLs for its current artwork, Hero HUD and controls. Unused enemies, backgrounds and boss art are registered without preloading the full pack.

Run `npm run assets:scan` after replacing production assets to register actual files and measure sprite bounds. It creates no bitmap copies, reuses verified unchanged derivatives and routes changed art to its current source. Components request logical assets through manifest helpers. Older acceptance reports describe earlier snapshots; the current presentation report and inventory reflect the latest pack.

The newly supplied `HERO_004_SYLVA_FULL_BODY.png` is registered and used for her ultimate. All Hero HUDs still use avatars. The manifest retains the fallback order full body → ultimate cut-in → battle cut-in → avatar. Missing preferred art logs a development warning; future realms/stages are outside this slice.

The original `GEM_SPECIAL_LINE_H` image is vertical; `GEM_SPECIAL_LINE_V` is horizontal. The board renderer rotates these two overlays 90° while retaining canonical asset names. Logical Line H always clears a row and Line V always clears a column.

## Evidence and scope

See [POLISH_REPORT.md](POLISH_REPORT.md) for the current hero/ultimate/board polish report and [VERIFICATION.md](VERIFICATION.md) for the original vertical-slice acceptance report. Screenshots cover 390×844, 360×800 and 412×915. The automated balance smoke check is reproducible with `node scripts/balance-smoke.js`; it is not a measured new-player clear rate.

Normal hero actions raise the active card 28 px and scale it to 1.08, then play their element-specific attack and return. Full-body ultimates have their own 2.3-second presentation. Timing lives in `src/core/vfx/vfxConfig.js`; board and hero presentation controllers share the existing VFX primitives. Gravity uses before/after gem IDs and animates only moved/refilled cells with no opacity sweep.

`src/core/battle/autoBattleAdapter.js` exposes legal moves, special metadata, generic target features and ready ultimates. Its actions reference the public human controller directly. `src/data/autoBattleConfig.js` keeps availability and default enablement false. There is no Auto scheduler or move policy yet.

The development-only `window.__battle` exposes state and controllers for browser tests. Vite excludes this handle from the production build. There is no backend or external account dependency. Stage 1-2 is not implemented.
