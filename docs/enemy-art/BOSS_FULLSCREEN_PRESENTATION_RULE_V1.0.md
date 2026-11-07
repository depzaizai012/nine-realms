# LOCKED: FULL-STAGE FRONTAL BOSS PRESENTATION — V1.0
Approved user decision: 2026-11-07

## Scope
All Realm main BOSSES are distinct from Normal, Elite and Mini-Boss battle character assets. Bosses are **NOT** to be exported using the normal small 3/4 ground-anchored 1024x1024 enemy sprite template. Boss art production is **DEFERRED** until the owner separately reviews the full-stage composition, renderer and HUD safe area. This note supersedes the generic boss-camera and boss-size defaults in earlier Enemy Art Bible and animation guidance where they conflict; does not change enemy species/metadata, lore, status, abilities, phase thresholds, or battle logic.

## Presentation lock
- Boss is **large, dominant, nearly fills the combat-view area**, and confronts the player's Heroes **head-on**.
- Battle camera should feel **frontal and direct**, unlike the 3/4 portraits used for ordinary enemies.
- Stage remains a mobile match-3 game: keep top Boss HUD, Gem Board and Hero HUD/controls readable and unobscured. "Full-screen" refers to a cinematic, dominant BOSS view within the available encounter composition, not covering vital game UI.
- Art direction is still premium, mature, painterly semi-realistic fantasy with strong Realm DNA, tangible anatomy and sophisticated controlled lighting, no mascot/cartoon.
- Production may require a bespoke large canvas, cropped body composition, segmented foreground/background layers and separate phase transitions, depending on the renderer. **Exact pixel resolutions, image extents, camera/anchor, animation rig, and layering are not locked yet**; do not invent them or force the 1024px ordinary-enemy standard.
- Apply boss Top HUD only. No standard under-foot normal-enemy bar; no contact shadow baked into output.
- Hero-to-Boss interaction is frontal/face-to-face; attack, hit cues, boss phase and VFX are separate production tasks.

## Verdant / Elderheart — anatomy remains locked
Canonical ENEMY_W01_008_MOC_TAN_ANCIENT_TREE_KING; BOSS; WOOD.
Always preserve across states: ancient impassive bark-mask face; unique triple-lobed seed-heart chest core; broken LEFT branch-antler; pillar-like root arms; ancient sacred-tree royal silhouette. Corruption intensities: CORRUPTED 4/5, BREAKING_CORRUPTION 2/5, RESTORED 0/5. Verdant remains a **living** sacred forest, selectively blighted. Restored is a post-victory visual unless gameplay specifies otherwise.

## Approval gate
1. Complete IDLE review for W01's **seven NON-BOSS** enemies: three Normal, three Elite, one Mini-Boss.
2. Boss later: inspect the actual battle screen's boss-area dimensions, camera, top Boss HUD, Hero UI and Gem Board; propose a stage-specific front-facing large art composition.
3. Seek owner approval of the CORRUPTED large-format boss base art before any BREAKING/RESTORED phase alterations or ATTACK production.
4. Do not ship prior regular-sized Elderheart IDLE images, ordinary enemy boss prompt text, or temporary mockups as final boss art.
