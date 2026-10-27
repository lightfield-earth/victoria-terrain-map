"""Extract every waterway around Greater Victoria into data/waterways.geojson.

    python3 make_waterways.py

Below z13 the vector tiles carry only the larger rivers, so creeks and streams vanish at the zooms the
regional view and the printed sheet use. This pulls the waterway layer from the same tiles at z13 (where
every stream is present), joins the pieces that tile boundaries cut apart, and writes two GeoJSON files
that customize.js draws from z11 to z13: waterways.geojson (the lines) and waterway-labels.geojson (each
named waterway smoothed, since labels can't follow a stream's every bend).
Needs GDAL's ogr2ogr and shapely. Re-run when the tile set (TILES) changes.
"""
import json
import math
import subprocess
import tempfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

from shapely.geometry import mapping, shape
from shapely.ops import linemerge, unary_union

TILES = "https://tiles.lightfield.earth/2026-05-01-planet-osm/{z}/{x}/{y}.mvt"
Z = 13
# the printed sheet's extent (-123.92, 48.28, -123.18, 48.76) plus a margin for panning the web map
BBOX = (-124.10, 48.20, -123.00, 48.85)
KEEP = ("class", "brunnel", "intermittent", "name", "name:en", "name:latin")
UA = {"User-Agent": "lightfield-make-waterways"}   # the tile server refuses urllib's default
DATA = Path(__file__).parent / "data"
LABEL_SMOOTHING = 0.002    # degrees, ~150 m (2 mm at 1:64,000): enough to straighten a stream for text


def tile_range(z, w, s, e, n):
    def xy(lon, lat):
        k = 2 ** z
        return (int((lon + 180) / 360 * k),
                int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * k))
    (x0, y0), (x1, y1) = xy(w, n), xy(e, s)
    return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]


def waterways(xy, tmp):
    x, y = xy
    mvt = Path(tmp) / f"{x}_{y}.mvt"
    mvt.write_bytes(urlopen(Request(TILES.format(z=Z, x=x, y=y), headers=UA)).read())
    if "waterway" not in subprocess.run(["ogrinfo", "-q", mvt], capture_output=True, text=True).stdout:
        return []   # a tile with no waterways has no layer for them
    # the tile's address tells the MVT driver where its coordinates are
    run = subprocess.run(["ogr2ogr", "-f", "GeoJSON", "-t_srs", "EPSG:4326", "-oo", f"Z={Z}", "-oo", f"X={x}",
                          "-oo", f"Y={y}", "/vsistdout/", mvt, "waterway"], capture_output=True, text=True, check=True)
    return json.loads(run.stdout)["features"]


def main():
    tiles = tile_range(Z, *BBOX)
    with tempfile.TemporaryDirectory() as tmp, ThreadPoolExecutor(16) as pool:
        feats = [f for fs in pool.map(lambda t: waterways(t, tmp), tiles) for f in fs]
    groups = defaultdict(list)
    for f in feats:
        props = {k: f["properties"][k] for k in KEEP if f["properties"].get(k) not in (None, "")}
        groups[json.dumps(props, sort_keys=True)].append(shape(f["geometry"]))
    lines, labels = [], []
    for key, geoms in groups.items():
        props, merged = json.loads(key), unary_union(geoms)
        if merged.geom_type == "MultiLineString":
            merged = linemerge(merged)
        lines.append(feature(props, merged.simplify(0.00002)))   # ~2 m: well under a printed line width
        if "name" in props:
            labels.append(feature(props, merged.simplify(LABEL_SMOOTHING)))
    DATA.mkdir(exist_ok=True)
    print(f"{len(tiles)} z{Z} tiles, {len(feats)} pieces")
    write(DATA / "waterways.geojson", lines)
    write(DATA / "waterway-labels.geojson", labels)


def feature(props, geom):
    return {"type": "Feature", "properties": props, "geometry": mapping(geom)}


def write(path, features):
    raw = path.with_suffix(".raw.geojson")
    raw.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
    # trim coordinates to ~1 m
    subprocess.run(["ogr2ogr", "-f", "GeoJSON", "-lco", "COORDINATE_PRECISION=5", "-lco", "RFC7946=YES",
                    path, raw], check=True)
    raw.unlink()
    print(f"  {len(features)} features, {path.stat().st_size / 1e6:.1f} MB: {path}")


if __name__ == "__main__":
    main()
