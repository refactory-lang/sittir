# Threading probes

These measurements test how close sittir's read-render pipeline gets to oxlint and oxfmt over a whole repository. The probe covers four things:
- where one file's time goes on one thread;
- two ways to spread files over threads;
- a per-thread pool for record chunks;
- where one tree's render time goes.

Nothing here is a production change. The harness and the napi probe functions exist only on the probe branch. Every number was taken on a loaded local machine, so the results are diagnosis only.

## Setup

- **Corpus:** matter.js at `2078d6648`, every `.ts` file except `.d.ts`, outside `node_modules` and `.git`: 2,410 files, 17.6 MB, listed in byte order. The four largest (`models/src/v1.1/chip.ts` and three `spec.ts`) hold 35% of the bytes.
- **Machine:** local M4 (14 cores), Homebrew rustc, release natives.
  - Every row from shape (a) on records the load average when its round began. Step 1 predates that field.
  - Loads ran from 13 to 33.
  - Each run interleaves its cells rep by rep. Compare rows within one run, not across runs.
- **Loader:**
  - Step 1 ran the TypeScript sources through `scripts/loader/` (esbuild with keepNames off; tsx forces keepNames on).
  - Every later result runs the built dist on plain node: `NODE_ENV=production node --expose-gc packages/tools/dist/profile/threading/pipeline.js '<options>'`.
- **Byte identity:** every cell hashes its renders in path order. Every row of every run has the same sha, `7e77e3de0abc`, and no file is refused.

## Tools

| what | does |
| --- | --- |
| `packages/tools/src/profile/threading/pipeline.ts` | The harness, built to dist. It takes one JSON argument and prints one JSON result. Per file it runs: read, parse, deep read, a walk with a lint-shaped kind check, a rename pass, and the root's render. It refuses object storage by name for `batchThreads` and `inventoryDepth`. Options: `storage` (`arena` or `object`); `files` (a list, one path a line); `warmup`; `rounds`; `limit`; `loopStage` and `loopSeconds` (repeat one stage for a sampler); `yieldEvery`; `batchThreads` (shape a); `workers` (shape b); `release` (dispose each tree once rendered); `schedule` (`size`, the default, or `path`); `inventoryDepth` (target 2). |
| `parseRenderBatch`, `renderInventory`, `chunkPoolStats` | Napi probe functions on the arena engine, in `rust/crates/sittir-core/src/napi_engine.rs`. They hold shape (a)'s Rust-pool batch, target 2's inventory (the trivia table's step counts included), and the chunk pool's counters. |
| `SITTIR_CHUNK_POOL=1` | Turns on the per-thread chunk pool in `rust/crates/sittir-core/src/arena/memory.rs`. The switch is read once per process. |
| `scripts/rounds.py` | Runs interleaved reps of named cells, one process per cell: `serial-<storage>`, `batch-<threads>`, `pool-<storage>-<workers>`, with the suffixes `-release`, `-path` and `-chunkpool`. It prints one row per cell and rep. |
| `scripts/inventory.py` | Turns render inventories into Amdahl ceilings for splitting one tree. It also prints the trivia table's step counts when the rows carry them. |
| `scripts/ox.py` | Times `oxfmt --check` and `oxlint` (default rules, and one rule) over the same list at 1, 2, 4, 8 and 14 threads. It runs from an empty directory so that no config applies. |
| `scripts/sample_main.py` | Splits the main thread of a macOS `sample` report by napi entry and by image. With `--inclusive`, it splits one entry's samples by the frames under it. |
| `scripts/symbolize.py` | Names a stripped addon's frames from build-native's unstripped copy (`node_modules/.cache/sittir/native-build/<grammar>/`) using `nm`. `atos` can't read that copy. |
| `scripts/cpuprof_top.py`, `scripts/permb.py` | Step 1's helpers: the top self frames of a V8 `.cpuprofile`, and a round's stage times per MB. |

## Commands

Run these from the root of a `probe/threading` checkout. `D` is this folder and `S` a scratch folder, both as absolute paths.

```bash
pnpm -C rust/crates/sittir-typescript run build && pnpm -C packages/tools run build
(cd <matter.js> && find "$PWD" \( -name node_modules -o -name .git \) -prune -o -name '*.ts' ! -name '*.d.ts' -print | LC_ALL=C sort) > $S/files.txt
python3 -I $D/scripts/rounds.py $PWD $S/files.txt $S/rounds.jsonl 3 serial-arena,serial-arena-release,batch-1,batch-8,pool-arena-8-release,pool-arena-8-release-chunkpool
for i in 1 2 3; do NODE_ENV=production node --expose-gc packages/tools/dist/profile/threading/pipeline.js "{\"storage\":\"arena\",\"files\":\"$S/files.txt\",\"warmup\":0,\"rounds\":1,\"inventoryDepth\":6}" > $S/inventory-$i.json; done
python3 -I $D/scripts/inventory.py $S/inventory-*.json
python3 -I $D/scripts/ox.py <oxc bin dir> $S/files.txt $S/ox.json 3
```

To profile, run the harness with `loopStage` and `loopSeconds` and record it with `sample <pid> <seconds> -file $S/sample.txt`. Then run `symbolize.py` with the unstripped addon, and `sample_main.py`.

## Results

| file | measured at | what |
| --- | --- | --- |
| `full3-arena.json`, `full3-object.json`, `sample-arena.txt`, `sample-object.txt`, `ox1.json` | `65c9bc2b7` | Step 1: single-threaded stage times, main-thread samples, and oxc on the same files. |
| `batch-rounds.*` | `8e1f752b4` | Shape (a), the native batch. |
| `pool-gc-path.*`, `pool-release-path.*`, `pool-size-vs-path.*`, `pool-final.*` | `c9e3f2f24` | Shape (b), worker_threads: without release, with release, size-first against path order, and the final run. |
| `chunk-pool.*` | `8e1813c94` | The chunk pool, off and on. |
| `render-inventory.txt`, `render-inventory-big.json`, `sample-render-big.txt` | `690ca8c45` | Target 2: three inventories of the corpus, one 14-level inventory of the four largest files, and a symbolized sample of a pipeline loop over them. |
| `trivia-steps.txt` | this README's commit | The trivia table's step counts per node, from one run at load 26.5. Only the counts are kept. The run's times are inflated by load; `render-inventory.txt` holds the times. |

## Findings

All measurements are on matter.js and dist, unless a finding says otherwise. Wall times are medians of 3 interleaved reps.

1. **One thread (step 1).**
   - Stage times on the esbuild loader, before dist and before the record-candidate seek fix: arena 4.57 s, of which 2.57 s is the walk; object 7.04 s, of which 2.82 s is the deep read and 2.71 s the walk.
   - Every later row runs dist with the fix. The serial arena pipeline takes 2.58 s there.
2. **Against oxc, on the same list.**
   - `oxfmt --check`: 0.49 s on 1 thread, 0.25 s at best (4 threads).
   - `oxlint` with default rules: 0.38 s on 1 thread, 0.18 s at best.
   - `oxlint` with one rule: 0.25 s on 1 thread, 0.17 s at best.
3. **Shape (a): a native batch on a Rust thread pool** (load 18–19).
   - Each thread builds its own engine over the caller's options and parses, hydrates and renders whole files. Tree ids are claimed on the JS thread before the dispatch, and the answer becomes JS after the join.
   - The native stages take 1.74 / 0.88 / 0.48 / 0.33 s at 1/2/4/8 threads (serial 1.71 s).
   - Peak live trees equal the thread count.
4. **Shape (b): worker_threads running the serial pipeline** (load 15–20).
   - Final run, with release and size-first: arena 2.74 / 1.44 / 0.72 / 0.44 s at 1/2/4/8 workers (serial 2.58 s, 5.9× at 8); object 7.63 / 4.01 / 2.15 / 1.46 s (serial 6.67 s, 4.6× at 8).
   - Pool startup is 0.19–0.27 s.
   - Per-worker heap at 8 workers: arena 45–94 MiB, object 193–445 MiB. The high end is the worker that took a `spec.ts`.
5. **Release is the contract.**
   - With release, each worker holds 1 live tree in every file.
   - Without it, trees go only when a collection finalizes them: a serial round peaks at 280–720 live trees, and an 8-worker pool at 320–360 per worker.
   - Step 1's "at most 4 trees live" is an artifact of its trace, which collects after every file.
6. **Scheduling.**
   - Path-order chunks of 8 files put the three `spec.ts` files in one chunk, so arena stalls at 4 workers (0.92 s at 8).
   - Handing out the largest files first, in chunks of at most 8 files or 128 KiB, removes the stall.
7. **The chunk pool doesn't pay** (load 13–14).
   - 82–98% of chunk allocations are reused.
   - Wall times don't move with the pool on: serial 2.57 → 2.58 s, batch at 8 threads 0.28 → 0.30 s, 8 workers 0.38 → 0.38 s.
   - Two pins ride it: a stale view throws rather than read reused memory, and a chunk dropped on another thread is freed.
8. **The summed thread time rises at 8 threads (diagnosis only; cause unknown).**
   - With 8 workers, the summed stage time rises by 20–60% for arena and 40% for object.
   - Allocation is ruled out: the chunk pool leaves the summed time flat.
   - The machine was loaded, so the rise isn't attributed to anything further.
9. **Target 2, rendering one tree in parallel: set aside, with no work item.**
   - On hydrated, unedited trees (load 18.5, 3 runs), building the trivia table takes 436 ms (76%) and the first render after it 137 ms (24%). A second render takes 6 ms.
   - The four largest files are each one `export default` of one object literal. Their nodes stay in one unit down to level 7. Level 8 is an array of 71–131 calls, the largest holding 7–10% of the file.
   - The ceiling: with files already spread over 8 workers, the corpus's renders take at least 75.8 ms (set by the largest file), against 71.6 ms for the total over 8. Splitting the large files at level 8 gains about 5% of the render stage.
10. **The first render's cost is the trivia table (diagnosis held for the reformat design).**
    - Why it runs: the first render forces the whole table, through `write_coordinate`'s frames → `side_levels` → `frame_levels` → `trivia_table()` → `TriviaTable::assign`. `frame_levels` reads only the coordinate's own sides and its edge-item chains.
    - Where `assign`'s time goes, in a loop over the four largest files: 44% in the cursor walk that fills its node table, 31% in one map insert per placed gap (whitespace-only gaps included), and about 25% in the rest of the gap loop. Source: `sample-render-big.txt`, 2,004 of `render_candidate`'s 2,680 samples (the walk 875, the inserts 631).
    - The build costs 149 ns per node across the corpus (load 18.5, 3 runs).
    - Steps run about 0.05 per node in every file size. Stretch steps are 0.13–0.16 per node under 20k nodes and 0.00 on the 100k+ files. So the cost is per gap and per node, not the excess machinery.
