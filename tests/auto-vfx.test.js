import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTO_VFX_CATALOG, BASIC_VFX_BY_CLASS, getVfxPreset, getClassBasicVfx,
  sanitizeVfxOverrides, sanitizeVfxClassMappings, readVfxClassMappings,
  saveVfxClassMappings, readVfxOverrides, saveVfxOverrides,
} from "../src/core/vfx/autoVfxLibrary.js";

const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key,value) => values.set(key,String(value)) };
};

test("VFX library provides four reusable class templates", () => {
  assert.equal(Object.keys(BASIC_VFX_BY_CLASS).length, 4);
  assert.equal(getClassBasicVfx({role:"WARRIOR"}), "BASIC_WARRIOR_SLASH");
  assert.equal(getClassBasicVfx({role:"SUPPORT"}), "BASIC_SUPPORT_SPIRIT_PULSE");
  assert.ok(AUTO_VFX_CATALOG.length >= 9);
  assert.equal(new Set(AUTO_VFX_CATALOG.map(x=>x.id)).size, AUTO_VFX_CATALOG.length);
});

test("unknown mappings and malformed config are rejected", () => {
  assert.deepEqual(sanitizeVfxClassMappings(null), {});
  assert.deepEqual(sanitizeVfxClassMappings({MAGE:"NOT_A_REAL_EFFECT",TANK:"HIT_IMPACT"}), {TANK:"HIT_IMPACT"});
  assert.deepEqual(sanitizeVfxOverrides([]), {});
  assert.equal(getVfxPreset("NONEXISTENT"), null);
  assert.deepEqual(sanitizeVfxOverrides({ fake: { scale: 1 } }), {});
});

test("scale and timing are clamped; no unrelated values enter presets", () => {
  const result = sanitizeVfxOverrides({BASIC_WARRIOR_SLASH:{scale:120,duration:-5,shape:"unsafe"}});
  assert.deepEqual(result, {BASIC_WARRIOR_SLASH:{scale:3,duration:100}});
  assert.equal(getVfxPreset("BASIC_WARRIOR_SLASH", result).scale, 3);
});

test("VFX options and class selections roundtrip without browser globals", () => {
  const storage=memoryStorage();
  saveVfxOverrides({BASIC_WARRIOR_SLASH:{scale:1.7,duration:420}},storage);
  assert.equal(readVfxOverrides(storage).BASIC_WARRIOR_SLASH.scale,1.7);
  saveVfxClassMappings({WARRIOR:"HIT_IMPACT"},storage);
  const mapping=readVfxClassMappings(storage);
  assert.deepEqual(mapping,{WARRIOR:"HIT_IMPACT"});
  assert.equal(getClassBasicVfx({role:"WARRIOR"},mapping),"HIT_IMPACT");
  assert.equal(getClassBasicVfx({role:"MAGE"},mapping),"BASIC_MAGE_MAGIC_BOLT");
});
