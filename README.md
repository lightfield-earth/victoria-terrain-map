# victoria-terrain-map

The grayscale terrain map framed on Greater Victoria, BC, for a bioregional mapping workshop (November
2026): Sooke Lake Reservoir to Sidney, Sooke to Victoria. Live at https://victoria.lightfield.earth.

## How it relates to terrain-bw

This repo has no style of its own. `index.html` loads the global grayscale style live from
https://terrain-bw.lightfield.earth/style.json (repo `copernicus-terrain-map-bw`), so improvements to that
style show up here automatically. What's Victoria-specific lives here:

- the opening view: `bounds` in `index.html`, the workshop extent (123.85–123.18° W, 48.28–48.76° N)
- any Victoria-only customizations colleagues ask for: apply them to the loaded style in `index.html`
  (or, if they grow, in a build step here), never by editing the global style for Victoria's sake

Current customizations (`customizeForVictoria` in `index.html`):

- **Salish Sea label**: larger as you zoom in (14 px at z7 to 22 px at z12) and letter-spaced. The tiles
  class it `strait`, like any narrows, so it is picked out by name.

Before the print, pin the style (copy `style.json` and `sprites/` here) so later changes to the global
style can't alter the printed version. The print pipeline lives in `../../printed-maps/`.

## Run locally

```sh
cd ..   # serve published-maps/ so the sibling bw build is reachable
python3 -m http.server 8012
# http://127.0.0.1:8012/victoria-terrain-map/?style=../copernicus-terrain-map-bw/style.json
```

`?style=<url>` swaps in another style, such as a local bw build while tuning. Without it, the page uses
the live terrain-bw style.
