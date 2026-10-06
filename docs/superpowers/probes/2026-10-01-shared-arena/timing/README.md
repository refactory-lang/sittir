# Build and type-check timing

Like-for-like timings of the typed reader's 1b against the master it was cut from: the same
script, inputs and population at both copies, run on copies outside every watched tree (a
worktree's index watcher re-indexes while a build writes into it and takes half the cores).

- `idle.sh <copies-dir> [min-idle]` waits for at least 75 % idle and no live infigraph process
  under the copies. Gate each timed run on it.
- `build-time.sh <checkout> <target-dir> <grammar> <dev|release> [runs]` warms the
  dependencies, then times the grammar crate's build alone (its `transport.rs` touched) with
  `/usr/bin/time -l`: wall, user+sys and peak RSS per run, and the medians.
- `typecheck-time.sh <checkout> [runs]` times the type-check command as it stood before
  `type-check:native` was chained in, so both copies time the same work.

The render-neutrality rounds use `../transport/layout-rounds.sh` and `layout-report.py`.
