// Victoria-only changes to the global grayscale style (terrain-bw.lightfield.earth/style.json).
// Shared by this page (index.html) and the print pipeline (../../printed-maps), so the web map and the
// printed sheet get the same tweaks. Defines window.customizeForVictoria(style), which edits in place.
// Each change targets a layer by id; if the global style renames or drops one, the change is skipped
// with a console warning rather than breaking the map.
window.customizeForVictoria = function (style) {
  const layer = (id) => style.layers.find((l) => l.id === id)
    || console.warn(`victoria: layer "${id}" not in the global style; customization skipped`);

  // The Salish Sea names the bioregion: draw it larger as you zoom in, letter-spaced like a sea.
  // (The tiles class it `strait`, like any narrows, so it can only be picked out by name.)
  const ocean = layer("Ocean labels");
  if (ocean) {
    const salish = ["==", ["get", "name"], "Salish Sea"], base = ocean.layout["text-size"] ?? 12;
    // regular size out at z7, where it competes with city names; ~17.5 px at the z9.4 regional view
    ocean.layout["text-size"] = ["interpolate", ["linear"], ["zoom"],
      7, base, 9.5, ["case", salish, 17.5, base], 12, ["case", salish, 22, base]];
    ocean.layout["text-letter-spacing"] = ["interpolate", ["linear"], ["zoom"],
      7, ["case", salish, 0.1, 0], 9.5, ["case", salish, 0.25, 0]];
    ocean.layout["text-max-width"] = ["case", salish, 20, ocean.layout["text-max-width"] ?? 10];   // one line
  }
};
