export const REALMS = [
  "Verdant",
  "Crimson",
  "Frostbound",
  "Golden Dune",
  "Netherveil",
  "Stormforge",
  "Abyssal Tide",
  "Celestial",
  "Void",
].map((name, i) => ({
  id: `${name.toUpperCase().replaceAll(" ", "_")}_REALM`,
  name: `${name} Realm`,
  world: i + 1,
  iconAsset: i === 0 ? "GEM_WOOD" : `ICON_W0${i + 1}_REALM`,
}));
