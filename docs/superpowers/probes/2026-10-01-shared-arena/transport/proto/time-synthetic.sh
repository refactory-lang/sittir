#!/bin/sh
# Release compile time of the synthetic crate under each expansion (sccache off, dependencies
# already built). Two builds per variant; prints both wall times in seconds.
cd "$(dirname "$0")"
for v in plain napi napi_serde transport_words transport_napi transport_json transport_all; do
  python3 gen_synthetic.py $v > /dev/null
  for run in 1 2; do
    touch synthetic/src/lib.rs
    start=$(python3 -c 'import time; print(time.time())')
    RUSTC_WRAPPER= CARGO_TARGET_DIR=$PWD/target ${CARGO:-cargo} build --release --offline -p synthetic > /dev/null 2>&1 || echo "build failed: $v"
    end=$(python3 -c 'import time; print(time.time())')
    python3 -c "print('$v run $run: %.2f s' % ($end - $start))"
  done
done
python3 gen_synthetic.py plain > /dev/null
