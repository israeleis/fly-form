#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "error: ImageMagick 'magick' is required" >&2
  exit 1
fi

cd "$REPO_ROOT"

OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fly-form-calibration}"
mkdir -p "$OUTPUT_DIR"

PDF_OUT="$REPO_ROOT/calibration_output.pdf"
FULL_OUT="$OUTPUT_DIR/calibration-full.png"
TOP_OUT="$OUTPUT_DIR/calibration-top.png"
COMMANDER_OUT="$OUTPUT_DIR/calibration-commander.png"

node scripts/calibrate.mjs

magick -density 160 'calibration_output.pdf[0]' -alpha remove "png:$FULL_OUT"
magick "$FULL_OUT" -crop 1250x800+0+180 "$TOP_OUT"
magick "$FULL_OUT" -crop 1250x520+0+700 "$COMMANDER_OUT"

echo "Generated:"
echo "  PDF:        $PDF_OUT"
echo "  Full image: $FULL_OUT"
echo "  Top crop:   $TOP_OUT"
echo "  Commander:  $COMMANDER_OUT"

if [[ "${1:-}" == "--open" ]]; then
  open "$FULL_OUT"
fi
