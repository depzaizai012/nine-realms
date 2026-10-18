# Nine Realms — Auto VFX Studio v0.1

**Status:** development proof-of-concept on a feature branch, **not deployed**. This change does not update approved gameplay rules, Hero/Enemy IDs, or Stage encounters.

## Available now

- `/dev/vfx-studio` (Vite dev server only) shows a filterable gallery with immediate CSS preview, six element colors, scaling, duration, and playback speed, plus automatic class mappings. Browser settings save to `localStorage`; **Export JSON** produces a portable config snapshot.
- Four class basic templates: TANK / WARRIOR / MAGE / SUPPORT. Existing legacy VFX remain; a supplemental VFX overlay is triggered by hero, enemy, heal, shield, and ultimate *presentation* events. Battle calculations are never controlled by this overlay.
- Optional WebGL Effekseer adapter loads registered `.efkefc` effects only when the official runtime files and valid effect dependencies exist; otherwise a CSS fallback is shown.
- Auto scan and batch import for explicitly licensed effect packs. No RPG Maker MZ proprietary assets are copied.

## Quick start

```bash
npm ci
npm run dev -- --host 0.0.0.0
# on the same network: http://<computer-LAN-IP>:5173/dev/vfx-studio
npm test
npm run build
```

The VFX Studio is intentionally disabled in production builds; it is a developer tool, not a publicly accessible player screen. Existing `/` Battle is unchanged except for the supplemental visual-only VFX.

## Install an official EffekseerForWeb runtime (once)

Obtain the official WebGL distribution archive from [EffekseerForWeb](https://github.com/effekseer/EffekseerForWeb), build according to its own README if binaries are not provided, then extract it. The extracted folder must contain `effekseer.js`, `effekseer-webgl.js`, and `effekseer-webgl.wasm`.

```bash
npm run vfx:runtime -- "/path/to/EffekseerForWeb-distribution"
```

This copies the runtime files into `public/assets/vfx/runtime/`. Keep a copy of the upstream MIT LICENSE when redistributing the runtime. **No WASM binary is bundled with the initial feature branch**, so native `.efkefc` playback has not been validated.

## Batch import properly licensed effects

Get CC0 effects from [Effekseer Sample Effects](https://effekseer.github.io/en/contribute.html). Use only the clearly labeled **CC0** section; the page also has an **Old License** section, which is **not automatically eligible**. Extract a licensed pack and retain all subfolders, textures, materials and models with the same relative paths. At the root of the extracted folder, add a single `vfx-pack.json` (one per pack, **not** one per effect):

```json
{
  "id": "cc0-magic-pack",
  "license": "CC0-1.0",
  "sourceUrl": "https://effekseer.github.io/en/contribute.html",
  "licenseEvidence": "Effekseer CC0 Sample Effects collection on the source page",
  "category": "Magic"
}
```

Check the actual pack's license before creating metadata; this file **records** the evidence, not independently verifies a third party's rights.

```bash
npm run vfx:import -- "/path/to/extracted-pack"
# or, for already installed folders:
npm run vfx:scan
```

The importer copies a pack only once (refuses overwrites), preserves dependent resources and generates `src/data/vfx/generatedEffects.js` listing every `.efkefc` effect. Restart Vite if the new entries do not appear. Keep pack metadata and asset files together in version control. Large packs increase git and mobile download footprint; lazy-load effects and curate the final selection.

### Important limitations

1. CSS previews work without any external files; currently **no CC0 effect pack or native WASM runtime is installed by this branch**.
2. Imported Effekseer effects do not all support arbitrary tint changes; element-color selection always affects the CSS fallback, but native visual colors depend on the source effect itself.
3. Runtime WebGL performance, material loading and phone-specific behavior require a real phone test **after installing binaries and at least one licensed pack**.
4. This branch's old repository Stage 1-1 fixture still has five Verdant Heroes. This VFX feature does not claim to implement the separately approved Faylen/Kavia stage/roster revisions.
5. An on-disk pack is not automatically downloaded from RPG Maker MZ. Do not move stock MZ assets into this repo without separate appropriate permission.
6. Browser timing uses the existing battle-clock animation helper for CSS; Effekseer applies the same state speed/pause to its playback. The 300-second timer and combat math remain separate.

## Rollback

Removing `createAutoVfxPlayer` calls in `src/core/vfx/battleVfxController.js` and `src/core/vfx/heroActionVfxController.js` restores legacy VFX unchanged. All new files live under `src/core/vfx/`, `src/screens/vfxStudioScreen.js`, `src/data/vfx/` and `scripts/*vfx*`.

## Next acceptance gates

- Import a real CC0 effect pack and test its dependent resources against the verified runtime.
- Compare gameplay and VFX output at x1, x2, Pause, Restart on Android/iOS.
- Check that no extra draw loop survives battle teardown or context loss.
- Review the first six basic-element combinations and selected Hero/Enemy event anchors at Stage 1-1.
- Only then permit preview deployment/merge and long-term skill-to-effect assignments.
