# Layout table: probes

Measurements for the width setting's layout table. The note is `docs/superpowers/specs/2026-10-02-layout-table-design.md`. The oracle records and logs of the original runs (53 MB) are not kept here; the scripts regenerate them.

- The design note: Its "Tools" section says which of these scripts should become real tools and why; its open questions are at the end.
- `probes/`: every measurement script. Each header says what it measures, how to run it and what it prints.
- `prototype-*.patch`: the variants of the throwaway prototype (below).
- `outputs/`: rendered files (`base-*` is master; `out-<file>-<width>[-<rule>].txt`).
- `logs/`: validator, benchmark, size and test output.
- `oracle/`: the seam oracle's records, reports, parse-state listings and forced-break runs.

## Prototype variants

| Patch | Applies at | What it is | Held by |
|---|---|---|---|
| `prototype-core.patch` + `prototype-generated-hand-edits.patch` | `fd189d4c9` | Measured variant. The table is a type parameter of the writer; the conditional trailing separator is in. Hand-edits generated list views and the root dispatch. | no worktree now |
| `prototype-output-trait-core.patch` + `prototype-generated-hand-edits.patch` | `fd189d4c9` | The measured variant rebuilt on the output trait. Rust and typescript natives built. | `scratchpad/wt-386` |
| `prototype-validation-variant.patch` | `0f9556b17` | No generated edits, so the validators accept it. The table is switched on at run time. Adds the `fill` and `hug` rules. | no worktree now |
| `prototype-oracle-variant.patch` | `0f9556b17` | The validation variant plus the seam oracle and forced line breaks. Typescript, python and rust natives built with it; scm and regex natives are the validation variant's. | `scratchpad/wt-386m` |

Both worktrees are detached and hold nothing but the prototype. Their `scratchpad/layout/` holds generated fixtures and the probes' outputs.

Switches the patches add (environment variables, read by the native code):

- `SITTIR_LAYOUT_WIDTH=<n>` forces the table on every render at that width (validation and oracle variants).
- `SITTIR_LAYOUT_UNSAFE=1` drops the bracket requirement.
- `SITTIR_LAYOUT_STATS=1` prints writer time and table size per render; `SITTIR_LAYOUT_DUMP=1` prints the table of a small render; `SITTIR_LAYOUT_ROWS=1` prints rows by kind.
- `SITTIR_SEAM_ORACLE=<dir>` records every gap of every render and what the parser could read there; `SITTIR_SEAM_WATCH=<names>` names the tokens to look for (oracle variant).
- `SITTIR_FORCE_LINE_SITE=<site>` and `SITTIR_FORCE_LINE_SITES=<file>` force a line break at one site, or at every site listed in a file (oracle variant).

## The scripts

All in `probes/`. Every script runs from the root of the checkout it measures, so one copy serves any worktree. In the commands below `P` is this folder's `probes/` and `D` this folder, as absolute paths:

```bash
D=$PWD/docs/superpowers/probes/2026-10-02-layout-table; P=$D/probes     # from the main checkout
```

| Script | Measures |
|---|---|
| `make-fixtures.sh` | (support) the factory rebuilds of `probes/fixtures/*` that the render probes build their trees from |
| `render-files.mts` | four real files at a width and rule: bytes, line widths, render time split into projection and native |
| `writer-stats.mts`, `writer-stats.py` | the native writer's own time per render and the table's size (`SITTIR_LAYOUT_STATS`) |
| `example-conditional-separator.mts` | the trailing separator that is written only when its list is broken |
| `example-explicit-site.mts` | an explicitly set site wins over the pass |
| `example-python.mts` | python: lists inside brackets break, lists outside do not |
| `statement-runs.mts` | blank lines within runs and at run boundaries of statement lists, under four keyings (parser kind; through wrappers; role; rust attributes seated onto their item), on the corpora and on real-world files; python import-to-definition boundaries. Needs only the parsers (`packages/<g>/.sittir/parser.wasm`). Output: `outputs/statement-runs.txt` |
| `example-fstring.mts` | python: the f-string field the bracket rule alone gets wrong |
| `example-table-dump.mts` | the table of a small render, row by row (`SITTIR_LAYOUT_DUMP`) |
| `validate-through-table.sh` | validator counts with the table off, on with nothing to break, and with everything broken |
| `binary-size.sh`, `writer-code-size.py` | library and `.node` size, writer symbol counts, code bytes per writer instantiation |
| `build-time.sh` | release rebuild time, wall clock and CPU |
| `site-admission.py` | per grammar, which arms each spacing site admits and holds by default |
| `oracle-run.sh` | runs the seam oracle over the validators' renders; one record per gap |
| `oracle-report.py` | sites by whether a line-sensitive token is valid at their gaps; lists by bracket position |
| `forced-sites.py`, `forced-run.sh`, `forced-report.py` | one validator run per site with a line break forced there, crossed with the oracle's class |
| `forced-sets.py`, `forced-all.sh` | every site of a set forced in one run (the proposed gate 6) |
| `state-report.sh`, `static-admission.py` | admission derived from tree-sitter's parse states alone, compared with the oracle |
| `build-native-direct.mts` | (support) builds a grammar's native binding without going through pnpm |
| `root.mts`, `oracle_lib.py`, `line-tokens.json` | (support) shared code, and each grammar's line-sensitive tokens |

## Reproduce

### Rendering and cost: `scratchpad/wt-386` (measured variant, output trait)

```bash
cd scratchpad/wt-386
# fixtures: only in a checkout whose generated files are unmodified, so before
# the generated hand edits are applied (wt-386 already has its fixtures)
sh $P/make-fixtures.sh
# the four files: off, or a width and a rule (fill and hug need the validation variant)
./node_modules/.bin/tsx $P/render-files.mts off
./node_modules/.bin/tsx $P/render-files.mts 100
# writer-only time and table size, three runs, then the summary
for run in 1 2 3; do SITTIR_LAYOUT_STATS=1 ./node_modules/.bin/tsx $P/writer-stats.mts off 100 2> $D/logs/stats-output-trait-$run.log; done
python3 $P/writer-stats.py $D/logs/stats-output-trait-*.log
# single behaviours
./node_modules/.bin/tsx $P/example-conditional-separator.mts
./node_modules/.bin/tsx $P/example-explicit-site.mts
# size and build time (each rebuilds; binary-size.sh also rebuilds the .node)
sh $P/binary-size.sh output-trait rust typescript
python3 $P/writer-code-size.py target/release/libsittir_rust.dylib
sh $P/build-time.sh output-trait rust typescript
cargo test --workspace --no-default-features
```

Logs of the earlier runs: `logs/stats-base-*.log` (master), `logs/stats-proto-*.log` (type parameter), `logs/stats-output-trait-*.log`; `logs/size-master.log`, `logs/sizes-prototype.log`, `logs/time-*.log` (made by earlier forms of `binary-size.sh` and `build-time.sh`); `logs/cargo-workspace-tests*.log`.

### Validators through the table: `scratchpad/wt-386m`

```bash
cd scratchpad/wt-386m
sh $P/make-fixtures.sh
sh $P/validate-through-table.sh $D/logs/through-table            # all five grammars; about four validator passes
SITTIR_LAYOUT_UNSAFE=1 sh $P/validate-through-table.sh $D/logs/through-table-unsafe python typescript rust
./node_modules/.bin/tsx $P/render-files.mts 100 fill
./node_modules/.bin/tsx $P/example-python.mts
./node_modules/.bin/tsx $P/example-fstring.mts
SITTIR_LAYOUT_DUMP=1 ./node_modules/.bin/tsx $P/example-table-dump.mts
```

Logs of the earlier runs: `logs/validate-*.log` (at `fd189d4c9`), `logs/master-0f9556b17/`.

### Which arms a site admits: `scratchpad/wt-386m` (oracle variant)

```bash
cd scratchpad/wt-386m
python3 $P/site-admission.py .                                    # what sites admit today
for g in typescript python rust; do
  sh $P/oracle-run.sh $g $D/oracle/$g                             # one validator pass each; writes <g>.jsonl
  python3 $P/oracle-report.py . $g $D/oracle/$g/$g.jsonl - --depth --list --lists > $D/oracle/report-$g.txt
  python3 $P/forced-sites.py $D/oracle/$g/$g.jsonl > $D/oracle/forced/$g-sites.txt
  sh $P/forced-run.sh $g $D/oracle/forced/$g-sites.txt $D/oracle/forced/$g 6      # one validator pass per site; resumable
  python3 $P/forced-report.py . $g $D/oracle/$g/$g.jsonl $D/oracle/forced/$g - --list > $D/oracle/forced-report-$g.txt
  python3 $P/forced-sets.py $g $D/oracle/$g/$g.jsonl $D/oracle/forced/$g - $D/oracle/forced/$g
  sh $P/forced-all.sh $g $D/oracle/forced/$g-unchanged.txt $D/oracle/forced/$g-all-unchanged.txt
  sh $P/forced-all.sh $g $D/oracle/forced/$g-free-unchanged.txt $D/oracle/forced/$g-all-free-unchanged.txt
done
for g in python typescript; do
  sh $P/state-report.sh $g $D/oracle/states
  python3 $P/static-admission.py . $g $D/oracle/states/$g-states.txt $D/oracle/$g/$g.jsonl > $D/oracle/static-$g.txt
done
```

## Rules for rerunning

- `sittir validate counts` records a commit on the checkout it runs in unless `SITTIR_HISTORY_NO_COMMIT=1` is set. The drivers set it. A bare validator run in a worktree needs it too.
- `pnpm exec` can wait for minutes while another session runs pnpm. The scripts call `./node_modules/.bin/tsx` and napi directly.
- Site ids and parse-state numbers belong to the checkout the records were made in. Pass that checkout (`scratchpad/wt-386m` for the records kept here) as the root argument of the report scripts, not the main checkout.
- `tree-sitter generate --report-states-for-rule` needs `'*'`; with `-` it prints only counts. The CLI rebuilds its cached parsers in `~/.cache/tree-sitter/lib/` when `tree-sitter parse --grammar-path` is used.
- `emit-factory-source` refuses a checkout whose generated files are hand-edited, so fixtures are made before the measured variant's generated edits are applied.
- The oracle sees root renders that reparse cleanly unless `--all-renders` is given; some contexts appear only in the validators' fragment renders.

## Switching variants, and discarding

To switch a worktree to another variant: `git checkout -- rust/crates`, delete the files the patch added (`rust/crates/sittir-core/src/layout.rs`, and `oracle.rs` for the oracle variant; they are added with intent-to-add, so `git reset -q -- <file>` first), `git apply` the wanted patch or pair, then `./node_modules/.bin/tsx $P/build-native-direct.mts <grammar> --release` for each grammar used.

To discard everything: in each worktree run `git checkout -- .` and delete the added files as above, then `git worktree remove scratchpad/wt-386` and `git worktree remove scratchpad/wt-386m`, and delete this folder.
