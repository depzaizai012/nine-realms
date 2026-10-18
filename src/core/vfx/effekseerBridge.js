/**
 * Optional EffekseerForWeb WebGL player. Only activates when the official
 * runtime files are installed under public/assets/vfx/runtime/.
 * https://github.com/effekseer/EffekseerForWeb (MIT).
 */
export function createEffekseerBridge(layer, state = {}) {
  let stopped = false, canvas = null, context = null, observer = null, frame = 0;
  let lastFrame = 0, loading = null;
  const effects = new Map(), live = new Set();
  const moduleUrl = "/assets/vfx/runtime/effekseer.js";
  const runtimeScript = "/assets/vfx/runtime/effekseer-webgl.js";
  const runtimeWasm = "/assets/vfx/runtime/effekseer-webgl.wasm";

  const resize = () => {
    if (!canvas || !context) return;
    const bounds = layer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * dpr));
    canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    context.setProjectionOrthographic(bounds.width, bounds.height, 1, 2000);
    context.setCameraLookAt(0, 0, 1000, 0, 0, 0, 0, 1, 0);
  };
  const tick = (now) => {
    if (stopped || !context) return;
    const delta = Math.min(100, Math.max(0, now - (lastFrame || now)));
    lastFrame = now;
    const speed = Math.max(0.1, state.battleSpeedMultiplier ?? state.speed ?? 1);
    const elapsed = state.paused ? 0 : delta * speed;
    if (elapsed) context.update(elapsed * 60 / 1000);
    for (const playing of [...live]) {
      playing.elapsed += elapsed;
      if (playing.elapsed >= playing.duration || !playing.handle?.exists) {
        playing.handle?.stop();
        live.delete(playing);
        playing.resolve(true);
      }
    }
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (live.size) context.draw();
    }
    frame = requestAnimationFrame(tick);
  };

  async function boot() {
    if (stopped) throw new Error("VFX player disposed");
    if (!loading) loading = (async () => {
      const response = await fetch(moduleUrl, { method: "HEAD" });
      if (!response.ok) throw new Error("Effekseer runtime is not installed");
      const runtime = await import(/* @vite-ignore */ moduleUrl);
      canvas = document.createElement("canvas");
      canvas.className = "auto-vfx-canvas";
      layer.append(canvas);
      const gl = canvas.getContext("webgl2", { alpha: true, antialias: false }) ||
        canvas.getContext("webgl", { alpha: true, antialias: false });
      if (!gl) throw new Error("WebGL unavailable on this device");
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        dispose();
      });
      await runtime.initRuntime({ backend: "webgl", scriptPath: runtimeScript, wasmPath: runtimeWasm });
      context = await runtime.createContext({ backend: "webgl", graphicsContext: gl, instanceMaxCount: 2048 });
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(layer);
      frame = requestAnimationFrame(tick);
      return context;
    })().catch((error) => {
      if (canvas) canvas.remove();
      canvas = null;
      loading = null;
      throw error;
    });
    return loading;
  }

  async function play(url, point, { scale = 1, duration = 500 } = {}) {
    const ctx = await boot();
    if (stopped) return false;
    let effect = effects.get(url);
    if (!effect) {
      // Relative textures/materials stay resolvable from the copied pack.
      effect = await ctx.loadEffect(url);
      if (stopped) { effect.release(); return false; }
      effects.set(url, effect);
    }
    const width = layer.clientWidth, height = layer.clientHeight;
    const handle = ctx.play(effect, point.x - width / 2, height / 2 - point.y, 0);
    if (!handle) throw new Error(`Effekseer could not play: ${url}`);
    handle.setScale(scale, scale, scale);
    return new Promise((resolve) => live.add({ handle, elapsed: 0, duration, resolve }));
  }

  function dispose() {
    stopped = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    for (const record of live) {
      record.handle?.stop();
      record.resolve(false);
    }
    live.clear();
    for (const effect of effects.values()) effect.release();
    effects.clear();
    context?.release();
    context = null;
    canvas?.remove();
    canvas = null;
  }
  return { play, dispose };
}
