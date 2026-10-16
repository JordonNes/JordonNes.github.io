#!/usr/bin/env bash
set -euo pipefail
INPUT="${1:?input folder required}"
OUT="${2:?output folder required}"
mkdir -p "$OUT"
mapfile -d '' TIFS < <(find "$INPUT" -type f \( -iname '*.tif' -o -iname '*.tiff' \) -print0)
if [ "${#TIFS[@]}" -eq 0 ]; then echo "No GeoTIFF found in DWR ZIP" >&2; exit 2; fi
printf 'Found %s GeoTIFF files\n' "${#TIFS[@]}"
# Source elevation: NAVD88 metres, NAD83 UTM zone 10N. Never claim tide-relative charted depths.
# Richmond + San Pablo Bay / western Carquinez: geographic crop, read from the official DEM.
gdalbuildvrt "$OUT/source.vrt" "${TIFS[@]}"
gdalwarp -overwrite -multi -wo NUM_THREADS=2 -t_srs EPSG:3857 \
  -te_srs EPSG:4326 -te -122.53 37.77 -122.12 38.14 \
  -tr 12 12 -r bilinear -dstnodata -9999 -co COMPRESS=DEFLATE \
  "$OUT/source.vrt" "$OUT/richmond-elevation.tif"
# Fixed bathymetric colors; no claims of absolute depth relative to present tide.
cat > "$OUT/bathymetry-colors.txt" <<'COLORS'
-100 14 26 72
-50 20 57 105
-30 23 91 143
-20 25 129 166
-10 45 169 183
-5 88 193 177
-2 150 207 163
0 210 219 170
3 224 198 142
15 180 155 117
50 129 121 106
100 91 101 91
nv 0 0 0 0
COLORS
gdaldem color-relief "$OUT/richmond-elevation.tif" "$OUT/bathymetry-colors.txt" \
  "$OUT/relief-rgba.tif" -alpha -co COMPRESS=DEFLATE
# gdal2tiles accepts RGBA rasters; output standard XYZ z/x/y PNG.
gdal2tiles.py --xyz --processes=2 --zoom=9-14 --resampling=bilinear \
  "$OUT/relief-rgba.tif" "$OUT/tiles"
cat > "$OUT/provenance.json" <<'JSON'
{"dataset":"DWR Bay-Delta DEM Version 4.3","resource":"dem_bay_delta_10m_20250312.zip","datum_horizontal":"NAD83 / UTM Zone 10N (source metadata)","datum_vertical":"NAVD88 metres","published":"2025-03","warning":"Historical modeled topography/bathymetry; west of Carquinez Strait is largely inherited from prior USGS-derived data. Not nautical chart depths; not for navigation.","status":"Preview tiles only; not automatically published"}
JSON
du -sh "$OUT/tiles" || true
