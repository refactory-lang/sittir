# Authoring DSL Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every grammar layer becomes `grammar(enrich(base), wire(config))`, with tree-sitter's stock `grammar`, one `edits` section and one verb set. `sittirGrammar`, `bindGrammar`, the bindings record and evaluate's duplicate passes go, and every stage is byte-identical.

**Architecture:**
- `enrich(base)` returns a pending base. Wire's externals callback completes it and runs the layer pass (`dsl/layer.ts`).
- The pass evaluates every callback and verb eagerly, completes the layer, and returns everything through the runtime's callbacks.
- One `LayerRecord` crosses layers, riding on the start rule's body.
- Verbs record effects that rewrite only inherited records. `lead` is a helper over `copy`, `narrow`, `replace` and `alias`.
- Stage 1 reshapes every layer against the 2b head. The later stages:
  - remove evaluate's duplicates;
  - move the fixpoint check to completion;
  - add the inline verbs, paths that enter rules, and `rename`.

**Tech Stack:** TypeScript (ESM, `tsx`, erasable syntax in grammar files), tree-sitter CLI 0.26.9, vitest, the sittir codegen pipeline, `validate:native`.

**Spec:** `docs/superpowers/specs/2026-10-15-authoring-dsl-design.md`. Read it with this plan; section numbers below (§N) are the spec's.

## Global Constraints

- **Branch.**
  - `feat/authoring-dsl`, in the worktree `scratchpad/wt-dsl-authoring`, is cut from master, with the 2b head (946114382, `codex/bindings-parser-layer`) merged in (Task 0.0). `codex/bindings-parser-layer` stays as it is.
  - Stages land back to back on `feat/authoring-dsl`, with no per-stage PR and no review hold. Each stage has its own commits, passes its own gate before the next starts, and carries its gate results in its commit messages. Never rebase; master comes in by merge.
  - One PR, `feat/authoring-dsl` → master, opens when every stage has landed. Its body starts `Owner: sittir-design` and carries a per-stage gate table, the rows compared against master, and a whole-branch Codex adversarial review. Coordinate and brainstorm review it.
  - The branch merges to master on the maintainer's word, carrying 2b.
- **Execution.** The design session executes this plan inline, with superpowers:executing-plans. It uses no subagents.
- **Byte-identical gates.** Every stage leaves generated output byte-identical to the previous stage's commit, except the exceptions the stage names.
  - Stage 1's reference was recorded at Task 0.4 (2867fa8ed, spec §10). Its grammar-level outputs equal 946114382's with each nested alias collapsed, and its rows equal the merge's.
  - A master merge re-records the reference at the merge, and every file the merge moves must be explained by the merged commits. The current reference is 913f2cfec's: Task 1.4's switch, with the two consequences the user accepted (below Task 1.4). Task 1.5 (b2259c7da) moves no output, so it is Stage 2's reference too. The master merges re-recorded it at 777411578 (below Task 1.1) and b56cee690 (below Task 1.4), and Task 1.2 Step 1's accepted consequence at 2adb24cf3.
  - A failed gate stops the stage for review. Nothing is reverted to make a gate pass.
- **Erasable syntax only** in `grammar.sittir.ts`, `grammar.bindings.ts` and every module they import: no enums, no namespaces with values, no parameter properties.
- **Generated outputs are never hand-edited;** regenerate them. The generated layer is written only by `bindings-inventory --write`.
- **Rule order.** The order of rules in `grammar.json` (symbol ids) never changes in a stage gated byte-identical.
- **Diagnostics, not throws.** Refusals are blocking diagnostics with the codes in the spec: `layer-not-enrich-fixpoint`, `edit-site-missing`, `edit-site-conflict`, `edit-entry-invalid`, `alias-target-invalid`, `narrow-invalid`, `rename-invalid`, `rule-name-taken`.
- **Pipeline functions** take `(target, ctx: LayerCtx)`, and the `propose-14` ratchet must not rise.
- **Comments.** Explanatory comments live in the glossary (`docs/glossary/dsl*.md`), one `###` entry per new declaration. No plan, PR or task numbers in code, comments or glossary.
- **Commits.** Pathspec commits only (`git commit -- <paths>`). Never commit validation history jsonl on the branch.
- **Standing gates per stage:**
  - `pnpm run validate:native`, with rows compared by `validate history`;
  - the full unit suite (`pnpm exec vitest run`) as its own shell call;
  - workspace type-check and lint;
  - `cargo test --workspace --no-default-features`;
  - `bindings-inventory --check`;
  - `tool output-gate --check` (Task 0.1);
  - the whole-branch Codex adversarial review before the PR opens, with each finding fixed or declined in the PR body.

## Review Focus

1. **Rule order when created rules are declared to the runtime.**
   - Expected: `grammar.json` key order equals the baseline's. Rust's `_parameter_receiver`, `_attributed_parameter_receiver`, `_parameters_elements_receiver` and `parameters_elements_receiver_group` are its last four rules, after `_kw_raw`. A layer's lead groups follow all of its leads' copies.
   - Test: in Task 1.3, and on production grammars in Task 1.4.
2. **A stale generated layer.**
   - Expected: evaluating layer 1 never imports grammar.bindings.ts, and `compile` reports the regenerate command before it evaluates a stale top layer.
   - Test: in Task 1.4.
3. **Read order and shared instances.**
   - Expected: reading a pending base's rules before wire completes it throws.
   - Expected: evaluating layer 1, then layer 2, then layer 1 again gives deep-equal layer-1 results.
   - Expected: layer 2 never writes into layer 1's grammar, its `reserved` or its record.
   - Test: in Task 1.2.
4. **Effects rewrite inherited records only.**
   - Expected: a `field()` entry in layer 1 leaves layer 1's own `options` untouched, while the same entry in layer 2 rewrites the inherited option path.
   - Test: in Task 1.1 (the inherited records), and in Task 2.2 (a layer's own records, read from the evaluated grammar).
5. **The same-site check under two spellings.**
   - Expected: an inline `edit(previous, { '1': field('a') })` and an entry `{ 'body:': field('b') }` that resolve to one member raise `edit-site-conflict`.
   - Test: in Task 4.4.

---

## Stage 0: the branch, the gate tool and the baselines

No behaviour change. Its deliverables let every later stage prove it is byte-identical.

### Task 0.0: the branch and its merge

**Landed:** merge 590bbe204 on `feat/authoring-dsl`. Every grammar-level output equals its 946114382 blob: the 33 files Step 4 names and the 15 `src/tree_sitter` headers. Of the 145 rows, the 130 in `reshape-gate-rows-946114382.txt` are unchanged and 15 are new from master.

- [x] **Step 1: Create the worktree.**
  `git worktree add -b feat/authoring-dsl scratchpad/wt-dsl-authoring origin/master`
- [x] **Step 2: Merge the 2b head.** `git -C scratchpad/wt-dsl-authoring merge --no-ff 946114382`. A trial merge conflicts in two kinds of file:
  - three source files, resolved by hand, keeping both sides' changes: `packages/codegen/src/bindings/facts.ts`, `packages/codegen/src/bindings/input.ts` and `packages/codegen/src/bindings/__tests__/routes.test.ts`;
  - generated files under `packages/*/src`, resolved by regeneration in Step 3, never by hand.
- [x] **Step 3: Regenerate.** Run `pnpm run validate:native`, which generates, then `bindings-inventory --check`. A failing check means master's bindings changes moved the derivation: stop and report the difference to brainstorm.
- [x] **Step 4: Compare the grammar-level outputs with 946114382's blobs.** These are `grammar.json`, `parser.c`, `node-types.json`, `parser.wasm`, `resolutions.json`, `grammar.bindings.ts` and `.sittir/grammar.js`, for all five grammars.
  - Use `git hash-object` against the manifest's blob ids.
  - Any difference stops the work and is reported.
  - The baseline is recorded (Task 0.1, Step 4) only after every one of these outputs equals its 946114382 blob.
- [x] **Step 5: Run the standing gates.** Compare the rows with `reshape-gate-rows-946114382.txt`, and report any moved row to brainstorm before the baseline is accepted.
- [x] **Step 6: Commit the merge** with the regenerated outputs. Send coordinate the three hand-resolved files for review.

### Task 0.1: `tool output-gate`

**Landed** on `feat/authoring-dsl`: 88a0fa67f, with Task 0.2. The adversarial review's fixes are 7c7a65377, and the tool-list test is 65a8a912c. The baseline `scratchpad/handoffs/reshape-gate-manifest-merge.txt` lists 245 files at 590bbe204: 946114382's 233, the native `index.cjs` and `index.d.ts` of five grammars, and the scm and regex test fixtures.

**Files:**
- Create: `packages/tools/src/output-gate/index.ts`
- Create: `packages/cli/src/commands/tool/output-gate.ts`, registered beside the other tool commands
- Modify: `docs/cli-command-glossary.md` (regenerated from the commander tree); create `docs/glossary/packages-tools-src-output-gate.md`
- Test: `packages/tools/src/output-gate/__tests__/output-gate.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GateManifest { readonly entries: ReadonlyMap<string, string> }   // path → git blob id, sorted by path
  export interface GateException { readonly path: string; readonly dropJsonKeys?: readonly string[] }
  export type GateRevision = string | 'worktree';
  export interface GateDifference { readonly path: string; readonly change: 'changed' | 'missing' | 'added' }
  export function readGateManifest(path: string): GateManifest;                    // '<blob> <path>' lines, '#' comments
  export function printGateManifest(manifest: GateManifest, comment: string): string;
  export async function generatedOutputRoots(): Promise<readonly string[]>;        // generatedRootsFor, plus each grammar's bindings layer
  export function gateBlobs(roots: readonly string[], rev: GateRevision, root?: string): Map<string, string>;
  export function recordGateManifest(roots: readonly string[], rev: string, root?: string): GateManifest;
  export function checkGate(manifest: GateManifest, current: ReadonlyMap<string, string>, rev: GateRevision,
      except: readonly GateException[], root?: string): readonly GateDifference[];
  export function parseGateException(spec: string): GateException;                 // 'path' or 'path:key,key'
  ```
- At a revision the blobs come from `git ls-tree`.
- In the worktree, the bytes on disk are hashed with `git hash-object --no-filters`. The files hashed are every tracked file under the roots, and every untracked one the repository's own `.gitignore` files allow. Local and global excludes do not hide a file.
- A `dropJsonKeys` exception compares the file with those top-level keys removed from both sides.
  - The comparison is exact only for JSON in the form `JSON.stringify(value, null, 2)` prints, with or without one final newline. A file in any other form must match byte for byte.
  - An added file is reported even when a key exception names it.
- CLI:
  - `tool output-gate --record <out> [--rev <rev>]` records the roots `generatedOutputRoots()` lists, at `HEAD` by default;
  - `tool output-gate --check <manifest> [--rev <rev>] [--except <path>[:key,key]]…` prints each changed, missing or added file and exits 1 if there is any. `--except` repeats.

- [x] **Step 1: Write the failing tests.**
  - A manifest written by `recordGateManifest` checks clean against the same revision.
  - Changing one byte of a listed file names that file.
  - `--except packages/x/grammar.json:splitFrom` ignores a difference only in that key, and still reports a difference in `rules`.
- [x] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/tools/src/output-gate/__tests__/output-gate.test.ts`
- [x] **Step 3: Implement.** Read the generated-output list from `packages/codegen/src/scripts/generated-manifest.ts`; do not keep a second list.
- [x] **Step 4: Run the tests, then record the baseline.** Run `tool output-gate --record scratchpad/handoffs/reshape-gate-manifest-merge.txt --rev <Task 0.0's merge>`. Do not commit the manifest. Checking it against the merge prints nothing.
- [x] **Step 5: Commit** the tool, its command, its test and its glossary entries.

### Task 0.2: evaluated-grammar snapshots

**Files:**
- Modify: `packages/tools/src/output-gate/index.ts`
- Test: `packages/tools/src/output-gate/__tests__/evaluated-snapshot.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GateLayer = 'sittir' | 'top';
  export const GATE_LAYERS: readonly GateLayer[];
  export async function evaluatedGrammarOf(grammar: GrammarName, layer: GateLayer): Promise<unknown>;
  export async function snapshotOf(evaluated: unknown): Promise<string>;                          // canonical JSON
  export async function evaluatedSnapshot(grammar: GrammarName, layer: GateLayer): Promise<string>;
  export async function writeSnapshots(dir: string): Promise<readonly string[]>;
  export async function checkSnapshots(dir: string): Promise<readonly string[]>;                 // the files that differ or are missing
  ```
- `snapshotOf` is `JSON.stringify` of `canonical(evaluated)`, indented by 2 and ending in a newline. `canonical()` sorts keys and turns `Map` and `Set` into sorted entry lists. It is the one exported from `evaluate-for-derivation.ts`, not a copy.
- `canonical()` throws on a value that JSON would drop or turn into null: a function, a bigint, a non-finite number, a non-plain object, or an undefined element. Such a value then cannot read like another one in the snapshots or in the conflict hash. The merge's evaluated grammars hold none of these.
- CLI: `tool output-gate --snapshot <dir>` writes `<dir>/<grammar>.<layer>.json`, and `--check-snapshot <dir>` compares.

- [x] **Step 1: Write the failing test.** Two snapshots of one grammar and layer, taken in one process, are equal. A snapshot taken after mutating the result's `options` differs.
- [x] **Step 2: Run it and confirm it fails.**
- [x] **Step 3: Implement.** Until Task 1.4, "sittir" is `evaluateUnboundDsl` and "top" is `evaluateDsl`. From Task 1.4 on, the layer is chosen by module.
- [x] **Step 4: Record the baselines.** Write the snapshots for rust, typescript, python, scm and regex to `scratchpad/handoffs/reshape-snapshots-merge/`. Their grammars are the merge's, since Tasks 0.1 and 0.2 change no grammar. Do not commit them.
- [x] **Step 5: Commit** the code and the test.

### Task 0.3: measure the fixpoint check at completion

**Landed:** the probe `docs/superpowers/probes/2026-10-15-authoring-dsl/` (a7e5a5eca), sent to brainstorm.
- Layer 1 is a fixpoint in all three grammars: `assertEnrichFixpoint` checks it on every bound evaluation.
- The top layer is a fixpoint in rust and typescript.
- On python's top layer enrich throws (`newline displays an inline nonterminal`) on `alias(alias($._newline, newline), newline)`.
  - Cause: wire's visible-externals rewrite descends into an alias's content, and the bindings layer applies it again over layer 1's aliases.
  - Extent: python 10, rust 8 and typescript 8 nested sites in `grammar.json`. They arrived with 64d63fc03.
  - Collapsing them leaves `parser.c` and `node-types.json` byte-identical.
- Ruled: the idempotent rewrite lands before Stage 1 (Task 0.4), and the baseline is re-recorded there.

- [x] **Step 1: List what enrich would change.** For rust, typescript and python, enrich each layer's result once with its sidecars, using `assertEnrichFixpoint`'s comparison as a probe; do not change it.
  - Layer 1 is today's gate and is expected to list nothing.
  - The top layer is the new check (spec §1.3, step 5).
  - List every rule enrich adds, removes or changes.
- [x] **Step 2: Report.** Send the list to brainstorm, per grammar and layer. A non-empty top-layer list blocks Stage 3, not Stage 1, and is a finding for the maintainer.

### Task 0.4: the idempotent visible-externals rewrite, and the baseline

**Landed:** 2867fa8ed. The baseline Stage 1 checks against is recorded there: `scratchpad/handoffs/reshape-gate-manifest-2867fa8ed.txt` (245 files), `reshape-snapshots-2867fa8ed/` and `reshape-gate-rows-2867fa8ed.txt` (rows identical to the merge's).

- `rewriteVisibleExternalRefsRt` leaves an alias whose content is a lone symbol as it is: the alias already names its symbol, and an outer alias decides the displayed name. Every layer's wire can then apply the rewrite over its base's rules without adding a second alias.
- evaluate.ts's copy (`applyVisibleExternalsRewrite` and its helpers) goes, with its glossary entries. It changed no evaluated grammar.
- Test: `packages/codegen/src/dsl/__tests__/visible-externals.test.ts`.
  - A second layer that wires a visible external aliases it once.
  - Rust's and typescript's completed top layers are enrich fixpoints.
  - Python's changes only `expression` and `_expression_within_for_in_clause`: its lambda display merge, pinned until Task 3.0.
- Gate, as ruled:
  - `grammar.json` equals 946114382's with each nested alias collapsed, byte for byte.
  - `parser.c`, `node-types.json` and `parser.wasm` are unchanged.
  - Accepted as consequences:
    - the generated `coerce.ts` and `raw.ts` regain the whitespace members' factory entries, which the nesting had dropped, every added line as on master;
    - `resolutions.json` moves in its grammar hashes only;
    - python's sittir snapshot loses one nested alias in its enriched-stage record.

---

## Stage 1: every layer in the stock shape

This is the reshape. Afterwards:
- every grammar file is `export default grammar(enrich(base), wire({ … }))`;
- grammar.bindings.ts is `export default grammar(enrich(sittir), wire({ edits }))`, beside `export const hash` and `export const renames`;
- `sittirGrammar`, `bindGrammar` and the bindings record are gone.

In this stage, the intake over a completed layer still re-enriches its base with the record's sidecars, as today's gate does. Stage 3 moves the check to completion.

**Gate:** spec §10. Run:
```
tool output-gate --check scratchpad/handoffs/reshape-gate-manifest-2adb24cf3.txt \
  --except packages/rust/grammar.bindings.ts --except packages/typescript/grammar.bindings.ts --except packages/python/grammar.bindings.ts \
  --except packages/rust/.sittir/grammar.js --except packages/typescript/.sittir/grammar.js --except packages/python/.sittir/grammar.js \
  --except packages/rust/.sittir/src/grammar.json:splitFrom,leadFrom,bindingEffects \
  --except packages/typescript/.sittir/src/grammar.json:splitFrom,leadFrom,bindingEffects \
  --except packages/python/.sittir/src/grammar.json:splitFrom,bindingEffects
```
Also run `tool output-gate --check-snapshot scratchpad/handoffs/reshape-snapshots-2adb24cf3/`. The rows must equal `reshape-gate-rows-2adb24cf3.txt`.

### Task 1.1: the layer record and the effect table

**Landed** on `feat/authoring-dsl`: f2d2de021, and 5322cee2c for coordinate's review. Byte-neutral: regen moved no file, and the output gate and the snapshot check match the 2867fa8ed baseline.

- Moved without rewriting:
  - into `verbs/effects.ts`: the seven functions below, their private helpers, `bindingEffectsForOwners` (as `effectsForOwners`), and the types `LeadWithin`, `LeadMatch`, `Lead`, `LeadEffect` and `BindingEffect`;
  - into `rule-patterns.ts`: the record walkers `GrammarRecord`, `isRecord`, `symbolNames`, `fieldNames`, `supertypesOf` and `transparentReach`, which `bind.ts` and the table share without an import cycle.
  - `enrich.ts` gains `EnrichSidecars` and `enrichSidecarsOf`, sharing one key list with `withEnrichSidecarsOf`.
- **Field effects are resolved per owner** over the rules as the edits leave them (`effectsForOwners`), as `bindGrammar` does today. Resolved over the final rules instead, typescript loses `required_parameter`'s `pattern:` → `name:` entry, because the lead's rest side copies `_parameter_name`. The log keeps the resolved entries: `provenanceOf` passes them through, and `rewriteInherited` reads each owner's own.
- **A copy effect records `admitted`,** the admitted kind a narrowing made the copy as the form of. It keys a lead's `variants`: rust's `_attributed_parameter` copy stands for `attributed_parameter`, which its source's name cannot give.
- **`RECORD_RENAMES`** states, for every `LayerRecords` key, what a kind rename does to it, typed so that a new record fails the type-check until it has an entry. `renameRecords` applies it, for `rewriteInherited` and for `renameGrammar`. As ruled, every record that holds a kind name follows a rename, as a key or as a name, except `stages` (spec §1.7), and a test case pins each record the ruling added: rule causes, test-failure expectations, refine forms and external roles by key; diagnostic expectations, patch sites, whitespace collisions and body-pattern zero matches by name.
- `rewriteInherited` takes only inherited records, so a layer's own records never reach it. The test that a layer's own records stay as written moves to Task 2.2, where the record's records reach the evaluated grammar.
- Tests: `provenanceOf` and `rewriteInherited` reproduce the bindings layer byte for byte, key order included, for rust, typescript and python, from a fixture taken from the baseline (`__tests__/fixtures/bindings-layer-effects.json`): its `splitFrom`, `leadFrom` and `bindingEffects`, and its options, reparse hosts, render-as and visible externals.

**Files:**
- Create: `packages/codegen/src/dsl/layer-record.ts`
- Create: `packages/codegen/src/dsl/verbs/effects.ts`
- Modify: `packages/codegen/src/dsl/bind.ts`. Move `renameOptionPaths`, `rewriteOwnedSegments`, `boundSegmentOf`, `boundFieldNameOf`, `inheritSplitOptions`, `renameReparseHosts` and `renameKeys` into `verbs/effects.ts` as the effect table's rewrites, then delete them from `bind.ts`.
- Test: `packages/codegen/src/dsl/__tests__/layer-record.test.ts`, `packages/codegen/src/dsl/__tests__/effects.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type CopyOrigin =
  	| { readonly kind: 'path'; readonly owner: string; readonly path: string }
  	| { readonly kind: 'copy'; readonly owner: string }
  	| { readonly kind: 'narrow'; readonly owner: string; readonly path: string }
  	| { readonly kind: 'lead'; readonly list: string; readonly item: string; readonly field: string; readonly admits: readonly LeadMatch[] };
  export type Effect =
  	| { readonly kind: 'segment'; readonly owner: string; readonly from: string; readonly to: string }
  	| { readonly kind: 'alias'; readonly from: string; readonly to: string }
  	| { readonly kind: 'rename'; readonly from: string; readonly to: string }
  	| { readonly kind: 'copy'; readonly copy: string; readonly source: string; readonly part: string; readonly context: string; readonly display: string | undefined; readonly admitted: string | undefined; readonly origin: CopyOrigin };
  export interface LayerRecord {
  	readonly depth: number;
  	readonly upstream: GrammarJson;
  	readonly sidecars: EnrichSidecars;                     // Stage 3 replaces this with `enrichment` (spec §1.6)
  	readonly resolutions: ConflictResolutionsFile;
  	readonly deadMints: ReadonlySet<string>;
  	readonly textTokens: readonly string[];
  	readonly liftNames: ReadonlyMap<string, LiftName>;
  	readonly effects: readonly Effect[];
  	readonly records: LayerRecords;                        // options, groups, renderAs, … (spec §1.6)
  }
  export const LAYER_RECORD_KEY: unique symbol;
  export function layerRecordOf(result: unknown): LayerRecord | undefined;            // reads the first rule's body
  export function withLayerRecord<R extends object>(body: R, record: LayerRecord): R;  // a fresh copy of the start rule's body, carrying the record
  export interface EffectCtx { readonly effects: readonly Effect[]; readonly rules: Readonly<Record<string, unknown>> }
  export function rewriteInherited(records: LayerRecords, ctx: EffectCtx): LayerRecords;
  export function provenanceOf(effects: readonly Effect[], rules: Readonly<Record<string, unknown>>): Provenance;   // splitFrom, leadFrom, renamedFrom, bindingEffects
  ```
- `provenanceOf` must reproduce the baseline's `splitFrom`, `leadFrom` and `bindingEffects` exactly, key order included (spec §1.7, projections).
  - A lead's `bindingEffects` entry takes its list, item, field and admits from the copy origin.
  - Its `receiver` is the displayed name of the list's copy, and its `variants` map each copy's `admitted` kind to its displayed name.
  - Its `group` and `restField` come from the receiver form's body in `rules`.
  - `renamedFrom` is absent when no rename effect exists.

- [x] **Step 1: Write the failing tests** (Review Focus 4).
  - `rewriteInherited` applies a segment effect to an inherited option path, `'item:/separator/","/after'` on owner `o`.
  - It applies an alias effect to a `(from)` segment.
  - It applies a copy effect with origin `path` as `inheritSplitOptions` does today: the source's options and `_labels`, layout included.
  - It leaves a copy effect with origin `lead` or `narrow` alone.
  - A layer's own records passed beside inherited ones are never rewritten.
  - `layerRecordOf` reads the record from a result whose first rule's body carries it. JSON serialization of that result does not contain the record.
  - On the effects the rust and typescript leads record, `provenanceOf` deep-equals the baseline's `leadFrom` and `bindingEffects`, taken from the snapshot.
- [x] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/codegen/src/dsl/__tests__/layer-record.test.ts packages/codegen/src/dsl/__tests__/effects.test.ts`
- [x] **Step 3: Implement.** Move the functions listed above; do not rewrite them. Keep `bind.ts` compiling, since its remaining passes still call them until Task 1.5.
- [x] **Step 4: Run the tests and the existing `split-layout`, `lead-grammar` and `grammar-bindings` tests.** All pass.
- [x] **Step 5: Write the glossary entries and commit.**

### The master merge after Task 1.1

**Landed** on `feat/authoring-dsl`: fd351a017 merges master at 396d7fb4c (the structure verifier, `ir.synonym` removed, tree-sitter-rust pinned to v0.24.2, the `node_modules` symlinks untracked). 777411578 fixes the from check the merge exposed.
- The from check derived a display-merged node's config under its display name, which has no slot table. Python's `lambda` and `lambda_within_for_in_clause` built empty and passed, until master's `'runtime'` verifier refused them (fromPass 178/180). The check now resolves the storage kind, for the node and every child it holds.
- The reference is re-recorded at 777411578: `scratchpad/handoffs/reshape-gate-manifest-777411578.txt` (255 files), `reshape-snapshots-777411578/` and `reshape-gate-rows-777411578.txt`. Against 2867fa8ed:
  - only rust's grammar-level outputs, its crate and its evaluated grammar move, from the pin;
  - every grammar's emitted package moves, from the verifier and the `ir.synonym` removal, and each grammar gains `.sittir/upstream.json` and `upstream.wasm`;
  - the three bindings layers move in their hash only;
  - the rows equal 2867fa8ed's, except rust's, which add master's deltas.

### Task 1.2: the pending base and the layer pass

**Files:**
- Create: `packages/codegen/src/dsl/layer.ts`
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` and `packages/codegen/src/dsl/index.ts`. Grammar files get `enrich` as `layer.ts`'s `pendingBase` and `wire` as `layer.ts`'s `layerOptions`. The internal two-argument `enrich(base, authored)` in `enrich.ts` and `wireImpl` in `wire.ts` keep their names, and the pass calls them.
- Modify: `packages/codegen/src/dsl/authoring-globals.d.ts`, which declares the global `grammar`, generic over the base (spec §1.1).
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. `wrapRuleHook` goes: the pass evaluates wire's rule callbacks in the externals callback, in `Object.entries(rules)` order.
- Modify: `packages/codegen/src/dsl/wire/dead-mints.ts`. `blankDeadEnrichMints` splits into a pure `deadEnrichMints(rules, lists, opts)` and its application. The pass applies it through the callbacks, and `sittirGrammar` applies it to the result until Task 1.4.
- Modify: `packages/codegen/src/compiler/evaluate.ts`. `grammarFn` reads only the base's `name` and `externals` before it calls the externals callback, and reads the rest after.
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`PatchesConfig` → `EditsConfig`, `PatchesCheck` → `EditsCheck`), every reader of `patches` on the config (`authoredFieldSites`, `assertNoSpacingAddressPatches`, `assertNoDeclaredGroupPatches`, `departsFromBase`), and `packages/{rust,typescript,python,scm,regex}/grammar.sittir.ts` (`patches:` → `edits:`)
- Modify: `packages/{scm,regex}/grammar.sittir.ts`, which become `export default grammar(enrich(base), wire({ … }))`
- Modify: `packages/tools/src/bootstrap/templates.ts`. New grammars start in the stock shape.
- Test: `packages/codegen/src/dsl/__tests__/layer.test.ts`, and a fixture chain under `packages/codegen/src/dsl/__tests__/fixtures/layer-chain/`

**Interfaces:**
- Consumes: `LayerRecord`, `withLayerRecord`, `layerRecordOf`, `rewriteInherited` (Task 1.1).
- Produces:
  ```ts
  export interface LayerConfig extends Omit<WireConfig<…>, 'patches'> {
  	readonly name?: string;                            // defaults to the base's
  	readonly edits?: EditsConfig;
  	readonly resolutions?: ConflictResolutionsInput;   // layer 1 only
  	readonly contexts?: ContextsConfig;                // recorded, never in the options
  }
  export function pendingBase<B extends GrammarJson>(base: B | GrammarResult): PendingBase<B>;   // `enrich` in grammar files
  export function layerOptions<B>(config: LayerConfig): LayerOptions<B>;                        // `wire` in grammar files
  export interface LayerCtx { /* the one phase ctx of the pass: rules, record, effects, created-rule order, symbols */ }
  export function runLayerPass(base: PendingBase<unknown>, config: LayerConfig): LayerOutput;   // called from the externals callback
  ```
- The pass's `$` mirrors tree-sitter's `RuleBuilder`:
  - a known name gives `{ type: 'SYMBOL', name }`;
  - an unknown name gives a `ReferenceError` carrying `.symbol`, which `alias()` accepts and `normalize` throws.
- Intake: a base without a record takes today's layer-1 path, enrich with the config's authored inputs. A base with a record runs today's gate (`assertEnrichFixpoint`, moved here, reporting `layer-not-enrich-fixpoint`) with the record's sidecars.
- Effects: the pass resolves the layer's field effects per owner (`effectsForOwners`) over the rules as its edits leave them, before the whole-grammar phase runs, and logs the resolved entries. `rewriteInherited` takes those rules as `EffectCtx.rules`; `provenanceOf` takes the final rules, where the receiver forms and groups sit.
- Completion, in the pass:
  - `stampWiredVariants`;
  - the dead mints;
  - text tokens;
  - the derivation records;
  - the conflict sets, which the `conflicts` callback returns (spec §6);
  - the record, on the start rule's body.

- [x] **Step 1: Rename `patches` to `edits`, with no other change.** Regenerate all five grammars. `tool output-gate --check` shows no difference. Commit.
  - **Landed:** 2adb24cf3. Accepted as a consequence: the grammar diagnostics name the key in their messages, so the four `grammar-diagnostics.json` files move by that one word (python 4 messages, typescript 3, rust 1, scm 1). Helper names that say patch are unchanged. The reference is re-recorded at 2adb24cf3; its snapshots and rows equal 777411578's.
- [x] **Step 2: Write the failing tests.**
  - Reading a pending base's `rules` before completion throws, while its `name` and `externals` read.
  - **The hook's guards** (spec §1.2):
    - reading `options.rules` before the pass has run throws, naming tree-sitter 0.26.9;
    - calling the externals callback twice with one handle refuses;
    - `enrich(base)` refuses a base that carries an unconsumed handle;
    - the pinned CLI, run over the fixture chain, records the pass running once, before `$` is built. The test asserts the CLI's version is 0.26.9 and says, on failure, that the call order must be verified again.
  - **The record** (spec §1.6):
    - the fixture's `grammar.json` from the CLI carries no trace of the record. Give the record a sentinel string and assert it is absent from the file;
    - a layer whose `rules:` overrides the start rule, and one whose entry edits the start rule, still carry the record on the result's first rule;
    - a start rule whose body is a bare string still carries it.
  - A fixture chain (a small upstream grammar, a layer 1 with a group and an edit, and a layer 2 with a field entry) gives the same rules, rule order and lists from sittir's `evaluate()` and from the pinned CLI's `tree-sitter generate`. Compare `grammar.json` from the CLI with the evaluated grammar's parser input.
  - Layer 2's record is read from the result's start rule in both runtimes.
  - `grammarFn` calls the externals callback before it reads the base's rules. Assert with a spy on a pending base.
  - **Review Focus 3:** layer 1, then layer 2, then layer 1 again give equal snapshots. A layer-2 fixture with a `reserved` set leaves layer 1's `reserved` unchanged.
  - Each config callback runs exactly once per evaluation, counted with a spy.
  - `contexts` given to a layer never reaches the runtime's options.
  - `wire({ edits: { missing: … } })` over a fixture base is a type error. Write it as a type test with `@ts-expect-error`.
- [x] **Step 3: Run them and confirm they fail.**
- [x] **Step 4: Implement.**
- [x] **Step 5: Switch scm and regex** to the stock shape, regenerate both, and run `tool output-gate --check`. There is no difference for scm or regex, and their snapshots are equal.
- [x] **Step 6: Run the suite. Write the glossary entries, and commit.**
  - **Landed:** b30ee9058 on `feat/authoring-dsl`. Every gate is against the 2adb24cf3 reference and equal: the output gate, the snapshots, the rows, the bindings inventory and the grammar type-check ratchet. Where it differs from the steps above:
    - **The type test.** The user ruled (via brainstorm) that `EditsCheck` stays the current check, so an `edits` key that the typed base lacks type-checks. The test pins an `edits` path that a base kind lacks instead (spec §2.1).
    - **`edit-site-missing`.** A key that names no rule when the layer evaluates is now this blocking diagnostic, built in this task: it records on the layer record and reaches the compile gate. Four keys name a kind their own layer mints, and each finds its minted body. The strict check over the layer's whole namespace is filed as an issue; it waits on a typed derivation of enrich's mints.
    - **Evaluation.** Wire's externals entry (`evaluatingExternals`) evaluates the rule callbacks and the `extras`, `supertypes` and `precedences` lists once, and `recordingExternals` goes with `wrapRuleHook`. The record also carries the conflict-derivation records and the pass's diagnostics. `deadEnrichMints` takes the layer's grammar view and the mints.
    - **Extras.** The authored `extras` callback runs once: at the first layer, enrich evaluates it against the base's list, and wire gets no `extras` key.
    - **Not yet once.** `groups`, `visibleExternals` and `renderAs` are still evaluated more than once per evaluation: 4, 5 and 3 times on a fixture layer. evaluate's drains account for some, and wire's own readers of the three keys account for the rest. Task 2.2 Step 2 brings each to one.
    - **Bootstrap test.** The composition test in `bootstrap-templates.test.ts` accepts `sittirGrammar` until the switch, but the template itself must be in the stock shape.

### Task 1.3: `copy`, `narrow` and the `lead` helper

**Files:**
- Create: `packages/codegen/src/dsl/verbs/copy.ts`. `applyCopy(source, part, ctx: LayerCtx)` handles naming, the alias back, list enlisting, one copy per source, part and context, and the copy effect. It is built from `leadGrammar`'s `mint` and `bind.ts`'s `mintLists`, moved and not rewritten.
- Create: `packages/codegen/src/dsl/verbs/narrow.ts`. `applyNarrow(site, admits, direction: 'keep' | 'except', ctx: LayerCtx)` carries the spec §5.1 policies. It is built from `narrowRef`, `narrowWithin`, `admittedInside`, `itemPositions` and `narrowInPlace`, moved.
- Create: `packages/codegen/src/dsl/verbs/lead.ts`. `applyLead(list, entry, ctx: LayerCtx)` composes `applyNarrow`, `applyCopy`, replace and alias, as spec §5.2 lists. The group comes from `visibleGroupSynthName`, as today.
- Create: `packages/codegen/src/dsl/primitives/narrow.ts` (`narrow(...admits)`, `narrow.except(...admits)`) and `packages/codegen/src/dsl/primitives/lead.ts` (`lead(item, field, ...admits)`). `match` moves here from `bind.ts`.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Path mode queues `narrow` and `lead` placeholders for the whole-grammar phase (spec §1.3). A `narrow` entry is queued with the path edits, before the leads, and applies at its site over the rules as the layer's own edits leave them.
- Modify: `packages/codegen/src/dsl/rule-patterns.ts`. `bind.ts`'s private shape helpers (`unprecedenced`, `refRule`, `refKind`, its record walkers) fold into the shared predicates (spec §7). A helper with no shared equivalent moves here.
- Test: migrate `packages/codegen/src/dsl/__tests__/lead-grammar.test.ts` to entries. Add `packages/codegen/src/dsl/__tests__/narrow.test.ts` and `copy.test.ts`. Extend `packages/codegen/src/bindings/__tests__/production-leads.test.ts`.

**Interfaces:**
- Consumes: `LayerCtx` (Task 1.2), `Effect` and `CopyOrigin` (Task 1.1).
- Produces:
  - `lead(item, field, ...admits): LeadPlaceholder`, valid only at a list kind's `.`;
  - `narrow(...admits)` and `narrow.except(...admits): NarrowPlaceholder`;
  - copy effects whose origin is the lead entry;
  - no lead effect.

- [x] **Step 1: Write the failing tests.**
  - Every case in `lead-grammar.test.ts`, rewritten as `edits: { L: { '.': lead(…) } }`, gives the same rules. Each refusal gives the code from spec §5.2's table and keeps today's reason text in its message.
  - **Review Focus 1:** on the rust and typescript layer-1 results, the helper gives exactly `leadGrammar`'s rules, rule order and names. Rust's last rules are `_kw_raw`, `_parameter_receiver`, `_attributed_parameter_receiver`, `_parameters_elements_receiver`, `parameters_elements_receiver_group`.
  - `narrow` keeps only the admits at a site and copies what it changes. `narrow.except` narrows an exclusive hidden rule in place and copies a shared one.
  - Each of `narrow`'s refusals in spec §5.1 is pinned.
  - A whole copy of a supertype member joins the supertype list, and a second copy in one context returns the same reference.
  - A `lead` entry at any path but `.` is `edit-entry-invalid`.
- [x] **Step 2: Run them and confirm they fail.**
- [x] **Step 3: Implement.**
  - Map the entry's `item` and admits through the layer's own field effects (`boundFieldNameOf`) before applying, as `bindGrammar` does.
  - Append the groups after all leads' copies, as `leadGrammar` does.
- [x] **Step 4: Run the tests and `lead-facts.test.ts`.** Then switch `lead-facts.ts` to read the copy effects and the receiver form's body (spec §5.2, facts). Its tests keep their expectations.
- [x] **Step 5: Glossary entries; commit.**
  - **Landed:** 897351f78 (the verbs, the lead entry and the adapter) and 36f1570c4 (the narrow entry) on `feat/authoring-dsl`. For each, every gate is against the 2adb24cf3 reference and equal: the output gate, the snapshots, the rows, the bindings inventory and the grammar type-check ratchet. Where it differs from the steps above:
    - **The verbs' context.** The verbs take a `VerbCtx`, which `LayerCtx` extends, so `leadGrammar` runs them outside a layer until Task 1.5 deletes it. `applyCopy` takes one request (source, part, context, body, origin, and an optional display), and `applyLead` takes the bound `Lead`. A verb refuses with `VerbRefusal`. `refusalOf` undoes everything the refused application did, and `applyEntry` turns the refusal into the entry's diagnostic.
    - **The lead entry.** Wire queues it on the layer at `.`, and refuses it at any other path. `runLayerPass` applies the queue after wire.
    - **The narrow entry** (the user's ruling, via brainstorm): wire queues it with the path edits, and the pass applies it before the leads, at its site over the rules as the layer's own edits leave them. Its path walks the evaluated rule with transform's path model (`applyPathInRules`). A path that names no member is `edit-site-missing`. A test pins that an in-place narrowing keeps an edit the same layer made to the rule.
    - **`lead-facts.ts`** is unchanged. It reads the `LeadEffect` that `provenanceOf` projects from the copy effects and the receiver form's body.
    - **Review Focus 1** is pinned on the evaluated grammar's last rules: the lead's copies, then its group. The evaluated grammar keeps synthesized `_kw_` rules that `grammar.json` lacks, so `_kw_raw`'s place before the copies is pinned by the output gate on `grammar.json`.
    - **For later tasks:**
      - Task 1.4: the authoring surface's `lead` is still `bind.ts`'s record form, which `grammar.bindings.ts` calls. The switch gives the name to the entry form.
      - Task 1.4 and Task 1.5: a layer pass records no field or alias effects yet (`recordingBindingEffects` is off outside a binding set), so the bindings layer's effects reach the record only once recording is unconditional. `resolvedEffects` then resolves them per owner over `{ rules }` alone, so `transparentReach` crosses supertypes, where `bindGrammar`'s resolution stops. Once the effects flow, it takes the layer's view with its supertypes, with a test.
      - The inline `edit()` stage: an inline `transform()` call that holds a `narrow` or `lead` entry queues it against the whole rule of the kind whose callback is running. `edit()` has to carry the site.

### Task 1.4: the switch: three layers, the generated layer, the entry and module selection

**Files:**
- Modify: `packages/{rust,typescript,python}/grammar.sittir.ts`. Each becomes `export default grammar(enrich(base), wire({ … }))`, and drops `bindings:` and the `grammar.bindings.ts` import.
- Modify: `packages/codegen/src/bindings/module.ts`.
  - `printBindingsModule` prints spec §2.4's layer form: `import sittir from './grammar.sittir.ts'`, `export const hash`, `export const renames` as data, and `export default grammar(enrich(sittir), wire({ edits }))` with `lead` entries.
  - Splits are computed and reported, but not printed.
  - `loadBindingsModule` becomes `loadBindingsHash(dir): Promise<string | undefined>`, reading the named export.
- Modify: `packages/codegen/src/bindings/hash.ts` (`assertBindingsFresh` takes the hash from `loadBindingsHash`), `packages/codegen/src/compiler/compile.ts`, and `packages/codegen/src/bindings/grammar-bindings.ts` (`GrammarBindings` loses the record shape; the inventory keeps reporting renames and splits)
- Modify: `packages/codegen/src/grammars.ts`. Add `topLayerPath(pkg)` and `layerPath(pkg, layer: 'sittir' | 'top')`. `GRAMMAR_ENTRY` stays the layer-1 file name and the package marker.
- Modify: `packages/codegen/src/transpile/transpile-overrides.ts` (writes `.sittir/grammar.js` from `topLayerPath`), `packages/codegen/src/compiler/resolve-grammar.ts`
- Modify: `packages/codegen/src/compiler/evaluate.ts`. `evaluateUnboundDsl` imports `layerPath(pkg, 'sittir')`; `importUnbound` and the `?unbound` query go.
- Modify: `packages/codegen/src/transpile/conflict-driver.ts`. The base run generates from a scratch directory whose `grammar.js` re-exports layer 1. Reuse `source-parser.ts`'s scratch-entry helper, extracted, not copied.
- Modify: `packages/codegen/src/transpile/source-parser.ts`, `packages/codegen/src/transpile/tree-sitter-cli.ts`, `packages/codegen/src/transpile/evaluate-for-derivation.ts` and its `.child.ts`, and `packages/tools/src/inventory/index.ts`. `UNBOUND_ENV` goes from all of them.
- Delete: `packages/codegen/src/dsl/sittir-grammar.ts`
- Regenerate: `packages/{rust,typescript,python}/grammar.bindings.ts` with `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`
- Test: `packages/codegen/src/bindings/__tests__/grammar-bindings.test.ts`, `packages/codegen/src/bindings/__tests__/hash.test.ts`, `packages/codegen/src/transpile/__tests__/conflict-driver.test.ts`, `packages/codegen/src/transpile/__tests__/evaluate-for-derivation.test.ts`, and a new `packages/codegen/src/compiler/__tests__/layer-selection.test.ts`

- [x] **Step 1: Write the failing tests** (Review Focus 2).
  - The printed module of a fixture with one field patch, one alias patch and one lead equals an expected string in the layer form, with `renames` as data.
  - `loadBindingsHash` reads `hash`. A module with no `hash` export is `StaleBindingsError` with the regenerate command, as today.
  - The printed module evaluates. Write it into a temp package beside a fixture `grammar.sittir.ts`, then evaluate. Port the existing record-form test at line 335.
  - Evaluating rust's layer 1 with a deliberately broken `grammar.bindings.ts` beside it succeeds, because the broken file is never imported.
  - `compile` on a package whose layer `hash` is stale throws `StaleBindingsError` before any evaluation. Spy on `runLayerPass`.
  - `.sittir/grammar.js` for rust names `../grammar.bindings.ts`, and for scm names `../grammar.sittir.ts`.
  - `evaluateForDerivation` returns the baseline's `base` and `bound` hashes, read from `resolutions.json`.
- [x] **Step 2: Run them and confirm they fail.**
- [x] **Step 3: Implement and regenerate.** A name search for `SITTIR_UNBOUND`, `UNBOUND_ENV` and `sittirGrammar` (Infigraph `search` with `regex=true`) returns no hits outside the glossary's history-free text.
- [x] **Step 4: Run the tests, `bindings-inventory --check`, and the stage gate's `output-gate` and snapshot checks.** A difference outside the named exceptions stops the task. Report the paths, and the first differing rule or key, to brainstorm.
- [x] **Step 5: Glossary entries.** Commit the code, the tests and the three regenerated layers together.
  - **Landed:** 5c20d509e (an inheriting layer rewrites its records and projects its effects) and 913f2cfec (the switch) on `feat/authoring-dsl`, with the master merge b56cee690 between them. The switch's gates are against the b56cee690 reference. The rows, the bindings inventory, the type-check, lint and the grammar type-check ratchet are equal or green. The output gate and the snapshots differ only by the two consequences the user accepted:
    - **The lead patch site.** rust's and typescript's top layers each record one more `patchSites` entry, the lead entry at `.`, and each one's bound `grammarHash` moves in `.sittir/resolutions.json`.
    - **The dead JSX group.** typescript's layer 1 records `bodyPatternZeroMatches: ["_jsx_opening_element_content"]`, `.sittir/grammar-diagnostics.json` gains the `body-pattern-zero-match` warning, and typescript's base and bound `grammarHash` move. A follow-up deletes the dead group from typescript's `grammar.sittir.ts`.

    The reference is re-recorded at 913f2cfec: `scratchpad/handoffs/reshape-gate-manifest-913f2cfec.txt`, `reshape-snapshots-913f2cfec/` and `reshape-gate-rows-913f2cfec.txt`, whose rows equal b56cee690's. Where it differs from the steps above:
    - **The alias-target check** moved into the alias verb here, not in Task 1.5, because deleting `sittirGrammar` removed `checkBindingPatches`' only caller. `WireLayer` carries the layer's depth. Above layer 1, an alias that flips hiddenness or names a rule of the base is the layer's `alias-target-invalid`.
    - **The hash** is read through the pinned TypeScript reader (a new `exportedStrings` mode), not by importing the layer. The parse it shares with the vocabulary reader is `bindings/pinned-typescript.ts`.
    - **`evaluateUnboundDsl`** goes rather than being repointed: layer 1 is `evaluateDsl` of its own file.
    - **The scratch entry** (`transpile/scratch-entry.ts::withScratchEntry`) also serves the conflict loop's base runs, which no longer generate in the package's `.sittir/`.
    - **The spy** counts `evaluatePackage` calls, since `runLayerPass` is called inside `layer.ts`.
    - **A layer above the first is not path-checked by type.** Its base is a `grammar()` result, whose type names no kind, so `BaseEditsCheck` declines it before enriching it; otherwise an editor shows TS2589 at the generated layer's `wire({`. Type checks in a grammar layer file serve IntelliSense (the user's ruling), and evaluation checks the generated layer's paths, so the generated layer stays out of the grammar type-check.
    - **For Task 1.5:** deleting `sittirGrammar` orphans `attachTextTokens`, `wireBindings`, `wireBindingEffects`, `blankDeadEnrichMints`, `attachDerivationRecords`, `applyConflictResolutions` and `applyBoundConflictResolutions`, and evaluate's fallbacks that read their keys (`getDeadEnrichMints`, `getDerivationRecords`, `getTextTokens`). They go with the removals.

### The master merge during Task 1.4

**Landed** on `feat/authoring-dsl`: b56cee690 merges master at 6bf9fcc6b, between Task 1.4's layer-two commit (5c20d509e) and the switch, so that the switch's gates run against current master. It brings the accepts-invalid-syntax rule cause with witness arrays, `c.<slot>.is(flag)`, a newtype for every core id domain, and tree-sitter-javascript pinned to 0.25.0 with rule-level `reserved()`.
- The reference is re-recorded at b56cee690: `scratchpad/handoffs/reshape-gate-manifest-b56cee690.txt` (255 files), `reshape-snapshots-b56cee690/` and `reshape-gate-rows-b56cee690.txt`. Against 2adb24cf3:
  - every grammar's crate and native typings move, from the id newtypes. Every grammar's emitted package moves where master's emitters meet this branch's model: typed ids and slot flags for the receiver kinds and under the bound slot names.
  - typescript's grammar-level outputs and evaluated grammar move, from the JavaScript pin and its grammar edits. python's evaluated grammar moves only by `witness` → `witnesses`. rust's, regex's and scm's are unchanged.
  - the three bindings layers are unchanged.
  - the rows equal 2adb24cf3's, except typescript cov 204 → 206: master's own delta, 201 → 203 from the base.
- Three counts and one test compose both sides. The typescript list-setter census is 31, and the typescript ir entry ceiling is 217 (213 at the base, plus two builders from each side). master's reserved-properties test names the bound slot `optionalChain`.

### Task 1.5: removals, and the stage gate

**Files:**
- Modify: `packages/codegen/src/dsl/bind.ts`. Delete `bindings`, `Bindings`, `bindGrammar`, `rewriteBindingOptions`, `checkBindingPatches`, `leadGrammar`, `LeadRefusal`, `BINDING_SET`, `markBindingSet` and `isBindingSet`. `effectsForOwners` and `LeadEffect` stay in the effect table.
  - `aliasTargetIssue` moves into the `alias` verb as the check for layers above the first (`alias-target-invalid`), reading the member's displayed name.
  - `splitGrammar` and `renameGrammar` stay as library code, with their tests, until Stages 6 and 9.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `transform` loses the `isBindingSet` branch. `recordFieldEffect` and `recordAliasEffect` record into `LayerCtx.effects` in every layer.
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. `wireBindings`, `wireWithBindingEffects` and `recordingBindingEffects` go, and `wireRecordBindingEffect` records unconditionally.
- Migrate tests:
  - `packages/codegen/src/dsl/__tests__/grammar-bindings.test.ts`
  - `packages/codegen/src/dsl/__tests__/bindings-layer.test.ts`, into `layer.test.ts`
  - `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`, whose `bindingEffects` and `leadFrom` now come from the projections

- [x] **Step 1:** Delete, migrate, and run the full suite as its own call. Any new failure is isolated with stash-and-rerun before it is accepted as pre-existing.
- [x] **Step 2:** Regenerate all five grammars with `pnpm run validate:native`, which generates.
- [x] **Step 3: Run the stage gate** (above): output-gate, snapshots and rows.
- [x] **Step 4:** Run the standing gates. Commit, with the stage gate's numbers in the message.
  - **Landed:** b2259c7da on `feat/authoring-dsl`. Against the 913f2cfec reference, the output gate and the snapshots match with no exceptions, and the rows are equal. The bindings inventory, the type-check, lint, the grammar type-check ratchet, the suite and the cargo gates are green. Where it differs from the steps above:
    - **Already gone:** `BINDING_SET`, `markBindingSet`, `isBindingSet`, `wireWithBindingEffects` and `recordingBindingEffects` went with the inheriting layer's commit (5c20d509e), and `checkBindingPatches` with the switch. `transform` had no `isBindingSet` branch left, and `wireRecordBindingEffect` already recorded in every layer.
    - **Also gone:** `rename`, `Rename`, `leadIssue`, `wireBindings` and `wireBindingEffects`, and the sidecars nothing attaches since the switch: the text-token, dead-mint and derivation-record keys with their attach and get functions, and the two functions that applied the conflict resolutions. `evaluate` reads those facts from the layer record only.
    - **The derivation's lead check** applies each lead with the lead verb over one verb context, through `refusalOf`, in place of `leadIssue`.
    - **The authoring `prec`, `token` and `reserved`** read the DSL runtime when they are called. Folding `bindings-layer.test.ts` into `layer.test.ts` showed that the facade, imported outside a DSL window, captured `undefined` for every grammar evaluated after it.
    - **Tests:** beyond the three the steps name, `lead.test.ts`, `dead-enrich-mints.test.ts` and `conflict-resolutions.test.ts` lose the deleted functions' unit tests, and `dead-enrich-mints.test.ts` tests the layer's dead mints in their place.

---

## Stage 2: one pass for both runtimes

**Gate:** byte-identical to Stage 1's commit, rows equal, and snapshots equal. The one exception is `desugarDivergences`, which leaves the snapshots; it is empty in production today.

### Task 2.1: evaluate's duplicate passes go

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts`. Delete `injectSyntheticRules`, the `groups:` body evaluation in `evaluateRulesAndInjectSynthetics` (with its swallowed `catch`), and `applyPatternReplacement` and its helpers. `applyVisibleExternalsRewrite` already went in Task 0.4.
- Modify: `packages/codegen/src/compiler/types.ts` (`desugarDivergences` goes; the pass's pattern injection fills `bodyPatternZeroMatches`), `packages/codegen/src/compiler/link.ts`, `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` (`fromDesugarDivergence` goes)
- Test: `packages/codegen/src/compiler/__tests__/evaluate.test.ts` (the two `desugarDivergences` cases go), `packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`, `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`

- [ ] **Step 1:** Port `evaluate.test.ts`'s `_orphan_group` case into a layer test. A `groups:` entry whose body matches nothing reports `bodyPatternZeroMatches`, from the one pass.
- [ ] **Step 2:** Delete, then run the suite and the stage gate. A rule that moves means the two implementations diverged: stop and report the rule. Commit.

### Task 2.2: the record replaces evaluate's inheritance

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts`.
  - `grammarFn` becomes the counterpart of `dsl.js`'s `grammar()` over evaluate's rule types. It no longer drains the wire context or merges inherited metadata.
  - `inheritedRecord`, `inheritedMap`, `inheritedPatchSites`, the `drain*Metadata` functions and evaluate's `LayerCtx<T>` go.
  - `importAndExtractGrammar` reads `layerRecordOf`, and spreads its records and projections into the evaluated grammar.
- Test: the snapshots. Every key of every grammar's evaluated grammar is unchanged.
- Test (Review Focus 4, a layer's own records): over a fixture chain, a `field()` entry in layer 1 leaves layer 1's own `options` as written, while the same entry in layer 2 rewrites the inherited option path. Both are read from the evaluated grammar.

- [ ] **Step 1:** Write the own-records test and confirm it fails. Implement, then run `tool output-gate --check-snapshot`. Every snapshot is equal.
- [ ] **Step 2: Each config callback once** (spec §1.3). With the drains gone, wire's readers of `groups`, `visibleExternals` and `renderAs` take what its entry evaluated, so each callback runs once per evaluation. Extend `layer.test.ts`'s spy test to the three.
- [ ] **Step 3:** Run the suite and the stage gate. Commit.

### Task 2.3: `injects:` and the record form of `groups:` go

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`WireConfig.injects`, the record arm of `GroupsConfigValue`, and the inject branch of `declaredPatterns`), `packages/codegen/src/compiler/types.ts` (`groups` holds function entries only)

- [ ] **Step 1:** Confirm with Infigraph `search` that no grammar file or test fixture uses `injects:` or a record-valued `groups:` entry. Delete, run the suite and the stage gate, then commit.

---

## Stage 3: the fixpoint check at completion

Task 0.3 must have shown that the top layer's check passes. Otherwise this stage waits for the maintainer. Task 0.4 removed the nested aliases; python's top layer still fails the check on its lambda display merge until Task 3.0.

**Gate:** byte-identical to Stage 2's commit, rows equal, and snapshots equal.

### Task 3.0: a declared display family is not an overload

Ruled (maintainer): a merge a layer declares is not an overload. Enrich splits a display that a grammar overloads by accident (spec §3.2).

**Files:**
- Modify: `packages/codegen/src/dsl/rule-transforms.ts` (`unaliasOverloadedDisplays`). Its detector never matches a display family the layer declared. This narrows what the detector matches; it is not a skip set or a decline.
- Modify: the enrich inputs (`packages/codegen/src/dsl/enrich.ts`) and the completion check (`packages/codegen/src/dsl/layer.ts`). The declared families come from the layer record's alias effects: a display that two or more alias effects name.
- Test: `packages/codegen/src/dsl/__tests__/visible-externals.test.ts`. Python's pin goes, and its completed top layer is a plain fixpoint.

- [ ] **Step 1:** Change python's case to expect no change. It fails on `expression` and `_expression_within_for_in_clause`.
- [ ] **Step 2:** Implement. The test passes, and the output gate against Stage 2's commit shows no difference.
- [ ] **Step 3:** Commit, with the gate in the message.

### Task 3.1

**Files:**
- Modify: `packages/codegen/src/dsl/layer.ts`.
  - Completion runs the check over the layer's own result (spec §1.3, step 5) and stores the checked enrichment in the record.
  - Intake over a completed layer takes the base's enrichment and no longer enriches.
- Modify: `packages/codegen/src/dsl/layer-record.ts`. `sidecars` becomes `enrichment` (spec §1.6).
- Test: `packages/codegen/src/dsl/__tests__/layer.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - A top layer whose created rule enrich would change reports `layer-not-enrich-fixpoint` naming that layer and rule.
  - Counted with a spy, one evaluation of the top layer runs enrich three times: layer 1's intake, layer 1's check, and layer 2's check. Layer 2's intake runs none.
- [ ] **Step 2:** Implement, then run the suite and the gate. Commit.

---

## Stage 4: inline verbs

**Gate:** byte-identical to Stage 3's commit, rows equal.

### Task 4.1: `edit(rule, sets)`

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Export `edit` as the authoring name; `transform` stays internal, as the lowering's call.
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` (export `edit`), and `packages/python/grammar.sittir.ts`: in `tuple_pattern`, `transform(original, …)` becomes `edit(original, …)`, and the direct `transform` import goes.
- Test: `packages/codegen/src/dsl/__tests__/transform-path.test.ts`, with an `edit` case per segment form

- [ ] **Step 1:** Test that an inline `edit` records the same patch sites and effects as the same entry in `edits`.
- [ ] **Step 2:** Implement, migrate python, and run the gate. Commit.

### Task 4.2: `replace`, and the replacing function

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. A function entry `($, member) => rule` replaces the member, and `replace(previous, path, rule)` is exported as the inline spelling.
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` (export `replace`)
- Test: `packages/codegen/src/dsl/__tests__/replace.test.ts` (new)

- [ ] **Step 1: Write the failing tests.**
  - A rule entry gives today's literal result, including the case that aliases the member's own symbol and keeps the member's metadata.
  - `($, member) => rule` receives the member.
  - `replace(previous, path, rule)` gives the entry's result and records the same patch sites.
- [ ] **Step 2:** Implement and run the gate. Commit.

### Task 4.3: `variant(name, rule, options?)` and `refine(forms)`

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/variant.ts`. The two-argument form returns `rule` labelled; the pass mints it as `resolvePatch` would at that arm.
- Modify: `packages/codegen/src/dsl/primitives/refine.ts`. The one-argument form is an entry valid at `.`.
- Test: `packages/codegen/src/dsl/__tests__/variant-inline.test.ts` (new), `packages/codegen/src/dsl/__tests__/refine-entry.test.ts` (new)

- [ ] **Step 1: Write the failing tests.**
  - A re-authored rule `choice(variant('a', seq('x', $.y)), variant('b', seq('z', $.y)))` yields exactly the rules and annotations that the bare choice plus `edits: { k: { '0': variant('a'), '1': variant('b') } }` yields.
  - `refine(forms)` at `.` records the same forms as typescript's inline `interface_body` call.
- [ ] **Step 2:** Implement and run the gate. Typescript keeps its inline `refine` call: it is one site, and needs no change. Commit.

### Task 4.4: the same-site check

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Applications record their resolved member positions, as index paths into the callback's result, in `LayerCtx`.
- Modify: `packages/codegen/src/dsl/layer.ts`. After lowering, a position written by both an inline application and an entry of the same kind is `edit-site-conflict`.
- Test: `packages/codegen/src/dsl/__tests__/edit-site-conflict.test.ts` (new)

- [ ] **Step 1: Write the failing tests** (Review Focus 5).
  - `rules: { k: ($, p) => edit(p, { '1': field('a') }) }` with `edits: { k: { 'body:': field('b') } }`, where `body:` is member 1, conflicts.
  - Two different members do not conflict.
- [ ] **Step 2:** Implement, then run the tests and the gate. Commit.

---

## Stage 5: one alias form

**Gate:** byte-identical to Stage 4's commit, rows equal. The generated layers change text but not their applied result.

### Task 5.1: `alias(name)` everywhere

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `resolveAliasPlaceholder` records the alias effect for a symbol member, and the literal-alias branch of `resolvePatch` goes.
- Modify: `packages/codegen/src/bindings/module.ts` (prints `alias(to)`), `packages/codegen/src/bindings/grammar-bindings.ts`
- Regenerate: the three grammar.bindings.ts.

- [ ] **Step 1:** Test that python's two generated alias sites give the same rule, labels and recorded effect through `alias(name)` as through the literal form. Take the expected values from Stage 4's snapshot.
- [ ] **Step 2:** Implement, regenerate, and run the gate. Commit.

---

## Stage 6: paths that enter rules, and `copy()` for authors

**Gate:** byte-identical to Stage 5's commit, rows equal. No split entry is printed yet (spec §2.4). The split behaviour is proved by unit tests equal to `splitGrammar`'s.

### Task 6.1

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform-path.ts`.
  - A `(kind)` segment followed by more segments enters the rule, and `(kind as name)` stands for `alias(copy(kind), $.name)`.
  - Hidden rules between visible kinds are entered implicitly.
- Modify: `packages/codegen/src/dsl/verbs/copy.ts`.
  - Add part copies and the copy-reference checks.
  - Options inheritance by origin uses `inheritSplitOptions`, from Task 1.1.
  - `splitGrammar`'s `cloneToward` and `fieldReferences` move in, and are not rewritten.
- Create: `packages/codegen/src/dsl/primitives/copy.ts`. `copy(source, path?)` is exported from `dsl-authoring.ts`. It is valid only during the pass; elsewhere it is `edit-entry-invalid`.
- Modify: `packages/codegen/src/dsl/primitives/alias.ts` and `transform.ts`. `alias`, `replace` and `edit` act on a copy reference (spec §4.1).
- Test: port `packages/codegen/src/dsl/__tests__/split-layout.test.ts` to `edits` entries. Extend `copy.test.ts`.

- [ ] **Step 1: Write the failing tests.**
  - Each `split-layout` case, written as a path that enters rules ending in `($) => alias(copy(target), $.name)`, gives the rules, the `splitFrom` projection, the lists and the options that `splitGrammar` gives.
  - An unnamed copy of a visible rule aliases back.
  - A part copy is named `_<source>_<part>_<context>`.
  - A copy name another rule already has is `rule-name-taken`.
  - A second path through the same context reuses the copies.
  - The ruled rust contextual alias yields the ancestor copies with no target copy. It is `alias('method_declaration')` at `impl_item_body: 'body:/(declaration_list as extension_declaration_body)/(function_item)'`.
  - Spec §4.3's typescript literal split gives a hidden copy of `method_definition`, aliased `constructor_declaration`, whose name is the literal.
  - `copy()` outside the pass is `edit-entry-invalid`.
- [ ] **Step 2:** Implement, then delete `splitGrammar`. Run the suite and the gate. Commit.

---

## Stage 6b: TypeScript accessor arity, the new verbs' proof of feature

Ruled (maintainer): the TypeScript grammar authors ECMAScript's productions for accessors. A getter takes `()`. A setter takes exactly one parameter, and never a rest. The TypeScript 1.8 spec's productions judge; newer checker rules are early errors and stay out of scope. This stage carries the acceptance plan's accessor-arity task.

- **Rules:** `method_definition` (class members and object literals), `method_signature` and `abstract_method_signature`. Each takes the same three arms: plain, get and set.
- **Census:** the 11 `accessor-arity` rows, plus `async get x() {}`. A generator getter already errors, and a constructor written as a getter is an early error.
- **Verbs:** the getter and the setter are named arms, `variant(name, rule)` (Stage 4), written with `replace` (Stage 4) and `copy()` (Stage 6). The builder-contexts table then has real accessor kinds.
- **Excluded slots (ruled):** on all three rules, neither the getter nor the setter takes `async`, the generator `*`, type parameters, `?` or `readonly`, and the setter takes no return type. The auto-accessor (`accessor x`, the `declaration.property` claim) takes no `declare`, `readonly` or `?`. `abstract accessor x` is valid and stays. The accessor kinds then hold none of those slots, so their routes drop them, and the vocabulary disagreements stay empty. The red test gains the `?` and `readonly` accessor forms and the auto-accessor's three, with `abstract accessor x` among the valid neighbours.
- **The getter's return type (ruled):** the getter reads its return type as `type`, through a route scoped to the getter's claim (`bindings/routes.ts::membersOf`) and the claim's `return_type: (_)? @type` capture in `packages/typescript/bindings.scm`. Member routes are per grammar kind, so the capture with no claim scope would give `declaration.method` a `type` too.
- **The abstract auto-accessor (ruled):** `abstract accessor x: number` reads as `declaration.property.signature.abstract`, with no value, as an abstract getter does, through a claim on `public_field_definition`'s abstract arm in `packages/typescript/bindings.scm`. It rides with the getter's capture.

**Before it:**
- Merge, never rebase:
  - the JavaScript 0.25 pin (`chore/pin-javascript-reserved`), which the TypeScript rule composes;
  - the acceptance plan's `accepts-invalid-syntax` cause, from master once it lands. After this merge `reauthored` takes witness arrays (`Witnesses<W>`), and `diagnoseRuleCauses` takes `authoredRules`;
  - `feat/ts-accessor-arity`, the red acceptance test `packages/typescript/tests/acceptance.test.ts`.
- Re-record the baseline at the merge. Every file the merge moves must be explained by the merged commits.

**Gate:** valid input parses to identical trees, the accessor census rows close, and the standard gates.

- [ ] **Step 1:** Merge, regenerate, and re-record the baseline. Report any moved file the merged commits don't explain.
- [ ] **Step 2:** Extend the acceptance test by the excluded slots above, and run it. The excluded forms fail and the valid neighbours pass.
- [ ] **Step 3:** Author the three rules and the auto-accessor with the verbs. The acceptance test passes. Check the parse trees of the valid corpus and the rows against the baseline.
- [ ] **Step 3b:** Scope the getter's `type` route to its claim and add the capture, and claim the abstract auto-accessor. `declaration.method` holds no `type`, the getter does, `abstract accessor x: number` reads as `declaration.property.signature.abstract` with no value, and `bindings-inventory --check` reports no disagreement.
- [ ] **Step 4:** Commit, with the gate in the message.

---

## Stage 7: the conflict hash keys the derivation's inputs

**Gate:** both resolution arrays in every `resolutions.json` are byte-identical. The `grammarHash` fields change once. A second regeneration reuses every section, with `resolutions reused` printed for both.

### Task 7.1

**Files:**
- Modify: `packages/codegen/src/transpile/evaluate-for-derivation.ts`. `grammarHash` no longer hashes the whole evaluated grammar. It hashes:
  - the parser input (rules, extras, externals, inline, supertypes, word, precedences, reserved);
  - the derivation records (`sourceEdges`, `baseNames`, `upstreamConflicts`);
  - the tree-sitter version.
- Test: `packages/codegen/src/transpile/__tests__/evaluate-for-derivation.test.ts`

- [ ] **Step 1:** Test that adding an option or a patch site leaves the hash unchanged, while changing a rule or a source edge changes it.
- [ ] **Step 2:** Implement, regenerate twice, and compare. Commit with the regenerated `resolutions.json` files.

## Stage 8: the deriver writes field entries directly

**Gate:** the three grammar.bindings.ts files are byte-identical to Stage 7's.

### Task 8.1

**Files:**
- Modify: `packages/codegen/src/bindings/grammar-bindings.ts`. Each `FieldRename` and `FieldWrap` request resolves its site's path against layer 1's rules, and the entry is written directly. `grammarBindingsPatches`' diff and the `fielded` grammar go.
- Modify: `packages/codegen/src/dsl/bind.ts`. Delete `fieldRenameGrammar`, `fieldWrapGrammar` and `renameFields`. `fieldRenameIssue`, `fieldWrapIssue`, `sharedHosts` and `childFields` stay, as derivation analysis.

- [ ] **Step 1:** Implement, regenerate the layers, and run `tool output-gate --check` against Stage 7. Commit.

## Stage 9: the `rename` verb

**Gate:** byte-identical to Stage 8's commit, rows equal. No layer uses the verb, so it adds no rule, and `parser.c`'s symbol table is unchanged for every grammar.

### Task 9.1

**Files:**
- Create: `packages/codegen/src/dsl/verbs/rename.ts` and `packages/codegen/src/dsl/primitives/rename.ts`, built from `renameGrammar`'s logic, moved. `carryHiddenFacts` is replaced by the effect table.
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` (export `rename`)
- Delete: `renameGrammar` from `bind.ts`. Migrate `rename-grammar.test.ts` to `rename.test.ts`.
- Test: `packages/codegen/src/dsl/__tests__/rename.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - `k: { '.': rename('t') }` appends `t` with `k`'s body, rewrites every reference in rules and in every list, and leaves `k` as a blank rule that nothing reaches.
  - Each refusal in spec §3.3 is `rename-invalid`: the start rule, a hiddenness flip, a taken target, and a source that is no rule or external.
  - The rename effect rewrites every inherited record `RECORD_RENAMES` names (Task 1.1 pins each), and gives `renamedFrom`.
  - A fixture layer with a rename generates with the pinned CLI.
- [ ] **Step 2:** Implement and run the gate. Commit.

## Then

- The wiring plan's 2b continues on Stage 1's state.
- 2c with 2e builds on Stage 6: contextual aliases, literal splits, one split per site and clone forms. Its census and gate are unchanged.
- The acceptance plan's kind-gap stage builds on Task 4.3.
- The builder contexts build on Task 2.2's record.
