import {
  AUTO_VFX_CATALOG, BASIC_VFX_BY_CLASS, VFX_ELEMENTS,
  getVfxPreset, readVfxOverrides, saveVfxOverrides,
  readVfxClassMappings, saveVfxClassMappings,
} from "../core/vfx/autoVfxLibrary.js";
import { createAutoVfxPlayer } from "../core/vfx/autoVfxPlayer.js";
import "../core/vfx/auto-vfx.css";

export function mountVfxStudio(app) {
  app.innerHTML = `<main class="vfx-studio">
    <header class="vfx-studio__header">
      <div><p>LEGEND OF THE NINE REALMS • DEVELOPMENT TOOL</p>
        <h1>Auto VFX Studio</h1><p>Browse, preview and assign reusable combat effects.</p></div>
      <a href="/">← Back to Battle</a>
    </header>
    <div class="vfx-studio__layout">
      <aside class="vfx-studio__panel">
        <h2>Effect library</h2>
        <label class="vfx-studio__control">Category
          <select data-role="category"><option value="">All effects</option></select>
        </label>
        <p data-role="count" class="vfx-studio__note"></p>
        <div class="vfx-studio__catalog" data-role="catalog"></div>
      </aside>
      <section class="vfx-studio__panel">
        <h2 data-role="title">Preview</h2>
        <div class="vfx-studio__stage" data-role="stage">
          <span class="vfx-studio__anchor" aria-hidden="true"></span>
        </div>
        <p class="vfx-studio__note" data-role="origin"></p>
        <div class="vfx-studio__control-grid">
          <label class="vfx-studio__control">Element
            <select data-role="element"></select>
          </label>
          <label class="vfx-studio__control">Playback speed
            <select data-role="speed"><option value="1">×1</option><option value="2">×2</option></select>
          </label>
          <label class="vfx-studio__control">Effect scale <output data-role="scale-value">1.0×</output>
            <input data-role="scale" type="range" min="0.4" max="3" step="0.1" value="1">
          </label>
          <label class="vfx-studio__control">Duration <output data-role="duration-value">400ms</output>
            <input data-role="duration" type="range" min="100" max="3000" step="50" value="400">
          </label>
        </div>
        <div class="vfx-studio__actions">
          <button class="vfx-studio__action" type="button" data-role="play">▶ Preview</button>
          <button class="vfx-studio__action secondary" type="button" data-role="save">Save preset</button>
          <button class="vfx-studio__action secondary" type="button" data-role="export">Export JSON</button>
        </div>
        <hr style="margin:20px 0;border:0;border-top:1px solid #47606a">
        <h2>Automatic basic-attack mappings</h2>
        <div class="vfx-studio__control-grid" data-role="mappings"></div>
        <p class="vfx-studio__note">Mappings saved here affect this development browser immediately. Export JSON to preserve them for another machine.</p>
        <p data-role="status" class="vfx-studio__status" role="status"></p>
      </section>
    </div>
  </main>`;
  const $ = (role) => app.querySelector(`[data-role="${role}"]`);
  const category = $("category"), list = $("catalog"), element = $("element"),
    speed = $("speed"), scale = $("scale"), duration = $("duration");
  const stage = $("stage");
  const categories = [...new Set(AUTO_VFX_CATALOG.map((p) => p.category))].sort();
  for (const value of categories) category.add(new Option(value, value));
  for (const value of VFX_ELEMENTS) element.add(new Option(value, value));
  element.value = "FIRE";
  const state = { battleSpeedMultiplier: 1, paused: false, disposed: false };
  let player = createAutoVfxPlayer(stage, state);
  let overrides = readVfxOverrides(), mappings = readVfxClassMappings();
  let selected = AUTO_VFX_CATALOG[0]?.id;
  const status = (message) => $("status").textContent = message;
  const renderValues = () => {
    $("scale-value").textContent = Number(scale.value).toFixed(1) + "×";
    $("duration-value").textContent = duration.value + "ms";
  };
  function select(id) {
    if (!AUTO_VFX_CATALOG.some((p) => p.id === id)) return;
    selected = id;
    const preset = getVfxPreset(id, overrides);
    $("title").textContent = preset.name;
    const license = preset.license || "Unspecified";
    $("origin").textContent = `${preset.id} • ${preset.sourceType || "CSS"} • License: ${license}${preset.sourceUrl ? " • " + preset.sourceUrl : ""}`;
    scale.value = String(preset.scale || 1);
    duration.value = String(preset.duration || 400);
    renderValues();
    renderList();
  }
  function renderList() {
    list.replaceChildren();
    const visible = AUTO_VFX_CATALOG.filter((p) => !category.value || p.category === category.value);
    $("count").textContent = `${visible.length} effect(s) • ${AUTO_VFX_CATALOG.filter(p=>p.sourceType==="effekseer").length} imported`;
    for (const preset of visible) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vfx-studio__item";
      button.setAttribute("aria-pressed", String(preset.id === selected));
      const name = document.createElement("strong");
      name.textContent = preset.name;
      const detail = document.createElement("small");
      detail.textContent = `${preset.category} · ${preset.sourceType || "CSS"}`;
      button.append(name, detail);
      button.addEventListener("click", () => select(preset.id));
      list.append(button);
    }
  }
  function renderMappings() {
    const holder = $("mappings");
    holder.replaceChildren();
    for (const role of Object.keys(BASIC_VFX_BY_CLASS)) {
      const label = document.createElement("label");
      label.className = "vfx-studio__control";
      label.textContent = role;
      const control = document.createElement("select");
      control.dataset.mapping = role;
      for (const effect of AUTO_VFX_CATALOG) control.add(new Option(effect.name, effect.id));
      control.value = mappings[role] || BASIC_VFX_BY_CLASS[role];
      control.addEventListener("change", () => {
        mappings = saveVfxClassMappings({ ...mappings, [role]: control.value });
        status(`${role} mapped to ${control.value}. Test in Stage 1-1.`);
      });
      label.append(control);
      holder.append(label);
    }
  }
  async function preview() {
    if (!selected) return;
    state.battleSpeedMultiplier = Number(speed.value);
    const point = { x: stage.clientWidth / 2, y: stage.clientHeight / 2 };
    await player.play(selected, point, {
      element: element.value, scale: Number(scale.value),
      duration: Number(duration.value), speed: Number(speed.value),
    });
  }
  const playClick = () => void preview().catch((error) => status(`Preview failed: ${error.message}`));
  $("play").addEventListener("click", playClick);
  category.addEventListener("change", renderList);
  scale.addEventListener("input", renderValues);
  duration.addEventListener("input", renderValues);
  $("save").addEventListener("click", () => {
    if (!selected) return;
    try {
      overrides = saveVfxOverrides({
        ...overrides, [selected]: { scale: Number(scale.value), duration: Number(duration.value) },
      });
      player.dispose();
      player = createAutoVfxPlayer(stage, state);
      status("Saved for this browser. Export JSON to keep the configuration.");
    } catch (error) { status(`Could not save: ${error.message}`); }
  });
  $("export").addEventListener("click", () => {
    const config = { version: 1, overrides, classMappings: mappings };
    const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "nine-realms-vfx-config.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Exported VFX configuration JSON.");
  });
  renderMappings();
  renderList();
  if (selected) select(selected);
  return {
    destroy() { state.disposed = true; player.dispose(); app.replaceChildren(); },
  };
}
