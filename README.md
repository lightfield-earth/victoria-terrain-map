# victoria-terrain-map

The grayscale terrain map framed on Greater Victoria, BC, for a bioregional mapping workshop (November
2026): Sooke Lake Reservoir to Sidney, Sooke to Victoria. Live at https://victoria.lightfield.earth.

## How it relates to terrain-bw

This repo has no style of its own. `index.html` loads the global grayscale style live from
https://terrain-bw.lightfield.earth/style.json (repo `copernicus-terrain-map-bw`), so improvements to that
style show up here automatically. What's Victoria-specific lives here:

- the opening view: `bounds` in `index.html`, the workshop extent (123.92–123.18° W, 48.28–48.76° N; the west edge clears the
  Leech River watershed, the westernmost part of the water supply area)
- any Victoria-only customizations colleagues ask for: `customize.js`, applied to the loaded style by
  both the page and the print pipeline, never by editing the global style for Victoria's sake

Current customizations (`customize.js`):

- **Salish Sea label**: regular size at z7, growing to 17.5 px at z9.5 and 22 px at z12, letter-spaced. The tiles
  class it `strait`, like any narrows, so it is picked out by name.
- **Roads drawn evenly**: highway, trunk, primary and tertiary roads all take the secondary road's widths
  and grays, so no road class dominates a sheet people draw on.
- **Streams and their names from z11**: the tiles carry only the larger rivers below z13, so from z11 to
  z13 the waterway layers draw from `data/waterways.geojson` (every waterway in the region, taken from the
  tiles at z13) and label along `data/waterway-labels.geojson` (each named waterway smoothed so text can
  follow it). `make_waterways.py` writes both; re-run it when the tile set changes. Outside its box
  (124.10–123.00° W, 48.20–48.85° N), streams appear only from z13.

Before the print, pin the style (copy `style.json` and `sprites/` here) so later changes to the global
style can't alter the printed version. The print pipeline lives in `../../printed-maps/`; the sheet extent is in
`../../printed-maps/sheets/victoria.json`.

## Run locally

```sh
cd ..   # serve published-maps/ so the sibling bw build is reachable
python3 -m http.server 8012
# http://127.0.0.1:8012/victoria-terrain-map/?style=../copernicus-terrain-map-bw/style.json
```

`?style=<url>` swaps in another style, such as a local bw build while tuning. Without it, the page uses
the live terrain-bw style.
