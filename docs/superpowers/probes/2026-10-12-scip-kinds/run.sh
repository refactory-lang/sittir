#!/usr/bin/env bash
# SCIP's symbol kinds against the ruled vocabulary, which the synonyms probe derives:
#   docs/superpowers/probes/2026-10-12-scip-kinds/run.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
python3 -I "$HERE/scip.py" "$HERE/../2026-10-12-vocabulary-synonyms/results/ruled-kinds.txt" "$HERE/scip-kinds.json" "$HERE/results"
