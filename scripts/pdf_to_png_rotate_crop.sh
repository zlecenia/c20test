#!/usr/bin/env bash
# Extract PDF pages to PNG, rotate by 270 degrees, and crop bottom half
# Dependencies: poppler-utils (pdftoppm), ImageMagick (mogrify or convert)
# Usage:
#   scripts/pdf_to_png_rotate_crop.sh input.pdf output_dir [dpi=200] [rotate_deg=270] [crop_bottom_percent=50]
# Example:
#   scripts/pdf_to_png_rotate_crop.sh menu.pdf frontend/pages/png 200 270 50

set -Eeuo pipefail

usage() {
  echo "Usage: $0 input.pdf output_dir [dpi=200] [rotate_deg=270] [crop_bottom_percent=50]" >&2
  exit 1
}

if [[ $# -lt 2 ]]; then
  usage
fi

PDF="$1"
OUTDIR="$2"
DPI="${3:-200}"
ROTATE_DEG="${4:-270}"
CROP_PCT="${5:-50}"

if [[ ! -f "$PDF" ]]; then
  echo "ERROR: input PDF not found: $PDF" >&2
  exit 2
fi

# Check tools
if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "ERROR: 'pdftoppm' not found. Install poppler-utils (e.g., apt-get install poppler-utils)." >&2
  exit 3
fi

MOGRIFY_CMD=""
if command -v mogrify >/dev/null 2>&1; then
  MOGRIFY_CMD="mogrify"
elif command -v magick >/dev/null 2>&1; then
  # ImageMagick 7
  MOGRIFY_CMD="magick mogrify"
fi

CONVERT_CMD=""
if command -v convert >/dev/null 2>&1; then
  CONVERT_CMD="convert"
fi

if [[ -z "$MOGRIFY_CMD" && -z "$CONVERT_CMD" ]]; then
  echo "ERROR: ImageMagick not found. Install 'imagemagick' (provides mogrify/convert)." >&2
  exit 4
fi

mkdir -p "$OUTDIR"

# Extract all pages as PNGs (page-1.png, page-2.png, ...)
echo "[1/3] Extracting PNGs from $PDF at ${DPI} DPI → $OUTDIR"
pdftoppm -png -r "$DPI" "$PDF" "$OUTDIR/page" >/dev/null

shopt -s nullglob
PNG_LIST=("$OUTDIR"/page-*.png)
COUNT=${#PNG_LIST[@]}
if (( COUNT == 0 )); then
  echo "ERROR: No PNGs produced. Check input PDF and tools." >&2
  exit 5
fi

echo "[2/3] Rotating ${COUNT} image(s) by ${ROTATE_DEG}°"
if [[ -n "$MOGRIFY_CMD" ]]; then
  # In-place rotate
  $MOGRIFY_CMD -rotate "$ROTATE_DEG" "${PNG_LIST[@]}"
else
  # Fallback: convert per file
  for img in "${PNG_LIST[@]}"; do
    tmp="${img}.tmp"
    $CONVERT_CMD "$img" -rotate "$ROTATE_DEG" "$tmp" && mv "$tmp" "$img"
  done
fi

KEEP_PCT=$((100 - CROP_PCT))
echo "[3/3] Cropping bottom ${CROP_PCT}% (keeping top ~${KEEP_PCT}%)"
if [[ -n "$MOGRIFY_CMD" ]]; then
  # Remove bottom portion: gravity south + chop height percentage
  $MOGRIFY_CMD -gravity south -chop 0x${CROP_PCT}% "${PNG_LIST[@]}"
else
  for img in "${PNG_LIST[@]}"; do
    tmp="${img}.tmp"
    $CONVERT_CMD "$img" -gravity south -chop 0x${CROP_PCT}% "$tmp" && mv "$tmp" "$img"
  done
fi

echo "Done. Output in: $OUTDIR"
