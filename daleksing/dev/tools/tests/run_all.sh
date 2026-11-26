#!/bin/sh
# Runs every check. Browser tests print what they observed; read the lines, and "errors []" must be empty.
cd "$(dirname "$0")/.." || exit 1
[ -d assets ] || node gen_assets.js
node tests/unit.js || exit 1
for t in tests/test_*.py; do echo "== $t"; python3 "$t" 2>&1 | grep -v '" [0-9][0-9][0-9] -$\|code 404\|^127\.0\.0\.1'; done
