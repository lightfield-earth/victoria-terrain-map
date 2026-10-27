// Victoria-only changes to the global grayscale style (terrain-bw.lightfield.earth/style.json).
// Shared by this page (index.html) and the print pipeline (../../printed-maps), so the web map and the
// printed sheet get the same tweaks. Defines window.customizeForVictoria(style), which edits in place.
// Each change targets a layer by id; if the global style renames or drops one, the change is skipped
// with a console warning rather than breaking the map.
const SCRIPT = document.currentScript.src;   // data files are found next to this script

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

  // Roads for a drawing base: every class from highway to tertiary looks like a secondary road (same
  // width and grays), so no road class dominates the sheet.
  const ROAD = /^(Highway|Trunk|Primary|Tertiary) (road|bridge|road link|link bridge|link)( outline)?$/;
  const secondary = { road: layer("Secondary road"), "road outline": layer("Secondary road outline"),
                      bridge: layer("Secondary bridge"), "bridge outline": layer("Secondary bridge outline") };
  for (const l of style.layers) {
    const m = l.id.match(ROAD);
    if (!m) continue;
    const like = secondary[(m[2].includes("bridge") ? "bridge" : "road") + (m[3] ?? "")];
    if (!like) continue;
    l.paint["line-color"] = like.paint["line-color"];
    l.paint["line-width"] = like.paint["line-width"];
  }

  // Streams and their names. Below z13 the tiles carry only the larger rivers, so from z11 to z13 the
  // waterway layers draw from data/waterways.geojson instead: every waterway in the region, taken from
  // the same tiles at z13 by make_waterways.py. Labels follow a smoothed copy of each named waterway
  // (data/waterway-labels.geojson); text can't follow a stream's every bend.
  const data = (f) => ({ type: "geojson", data: new URL(`data/${f}`, SCRIPT).href });
  style.sources["waterways"] = data("waterways.geojson");
  style.sources["waterway-labels"] = data("waterway-labels.geojson");
  for (const l of style.layers.filter((l) => l["source-layer"] === "waterway")) {
    if ((l.minzoom ?? 0) >= 13) continue;
    const { "source-layer": _, ...copy } = structuredClone(l);
    const below = { ...structuredClone(l), id: `${l.id} (below z11)`, maxzoom: 11 };
    const region = { ...copy, id: `${l.id} (Victoria)`, source: l.type === "symbol" ? "waterway-labels" : "waterways",
                     minzoom: Math.max(l.minzoom ?? 0, 11),
                     maxzoom: 13 };
    if (l.type === "symbol") region.layout["text-max-angle"] = 60;   // let names bend a little more with the stream
    l.minzoom = 13;
    const i = style.layers.indexOf(l);
    style.layers.splice(i, 0, ...((below.minzoom ?? 0) < 11 ? [below] : []), region);
  }
};
