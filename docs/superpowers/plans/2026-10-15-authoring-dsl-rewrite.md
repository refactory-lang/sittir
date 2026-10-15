# Authoring DSL Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every grammar layer becomes a `grammar(base, config)` extension. Each has one `edits` section and one verb set. `bindGrammar`, the bindings record and evaluate's duplicate passes go, and every stage is byte-identical.

**Architecture:**
- A layer function, `dsl/layer.ts`, runs intake, lowering, an eager layer pass, the runtime's `grammar()` and completion.
- The layer records what crosses layers in one `LayerRecord`.
- Verbs record effects that rewrite only inherited records.
- The bindings layer is reshaped first, against the 2b head. The later stages move layer 1 onto the same pass and add the inline and copy verbs.

**Tech Stack:** TypeScript (ESM, `tsx`, erasable syntax in grammar files), tree-sitter CLI 0.26.9, vitest, the sittir codegen pipeline, `validate:native`.

**Spec:** `docs/superpowers/specs/2026-10-15-authoring-dsl-design.md`. Read it with this plan; section numbers below (§N) are the spec's.

## Global Constraints

- **Branch.**
  - Cut `feat/authoring-dsl` from `codex/bindings-parser-layer` at `946114382`, which merges master `c0dbac263`.
  - Each stage is a PR into `feat/authoring-dsl`. Never rebase; master comes in by merge.
  - The branch merges to master on the maintainer's word, carrying 2b.
- **Byte-identical gates.** Every stage leaves generated output byte-identical to the previous stage's commit, except the exceptions the stage names.
  - Stage 1's reference is `scratchpad/handoffs/reshape-gate-manifest-946114382.txt`, with the rows in `scratchpad/handoffs/reshape-gate-rows-946114382.txt`.
  - A failed gate stops the stage for review. Nothing is reverted to make a gate pass.
- **Erasable syntax only** in `grammar.sittir.ts`, `grammar.bindings.ts` and every module they import: no enums, no namespaces with values, no parameter properties.
- **Generated outputs are never hand-edited;** regenerate them. The generated layer is written only by `bindings-inventory --write`.
- **Rule order.** The order of rules in `grammar.json` (symbol ids) never changes in a stage gated byte-identical.
- **Diagnostics, not throws.** Refusals are blocking diagnostics with the codes in the spec: `layer-base-not-enrich-fixpoint`, `edit-site-missing`, `edit-site-conflict`, `edit-entry-invalid`, `alias-target-invalid`, `copy-name-invalid`, `rename-invalid`, `rule-name-taken`, `lead-refused`.
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
  - the Codex adversarial review before each PR opens, with each finding fixed or declined in the PR body.

## Review Focus

1. **Rule order when created rules are declared to the runtime.**
   - Expected: `grammar.json` key order equals 946114382's. Rust's `_parameter_receiver`, `_attributed_parameter_receiver`, `_parameters_elements_receiver` and `parameters_elements_receiver_group` are the last four rules, after `_kw_raw`.
   - Test: in Task 1.3.
2. **A stale generated layer.**
   - Expected: evaluating layer 1 never imports grammar.bindings.ts, and `compile` reports the regenerate command before it evaluates a stale top layer.
   - Test: in Task 1.6.
3. **Shared module instances.**
   - Expected: evaluating layer 1, then layer 2, then layer 1 again gives deep-equal layer-1 results. Layer 2 must not mutate layer 1's grammar or record.
   - Test: in Task 1.2.
4. **Effects rewrite inherited records only.**
   - Expected: a `field()` entry in layer 1 leaves layer 1's own `options` untouched, while the same entry in layer 2 rewrites the inherited option path.
   - Test: in Task 1.1.
5. **The same-site check under two spellings.**
   - Expected: an inline `edit(previous, { '1': field('a') })` and an entry `{ 'body:': field('b') }` that resolve to one member raise `edit-site-conflict`.
   - Test: in Task 3.3.

---

## Stage 0: the gate tool and baselines

No behaviour change. Its deliverables let every later stage prove it is byte-identical.

### Task 0.1: `tool output-gate`

**Files:**
- Create: `packages/tools/src/output-gate/index.ts`
- Create: `packages/cli/src/commands/tool/output-gate.ts`, registered beside the other tool commands
- Modify: `docs/cli-command-glossary.md` (regenerated from the commander tree), `docs/glossary/packages-tools-src.md`
- Test: `packages/tools/src/output-gate/__tests__/output-gate.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GateManifest { readonly entries: ReadonlyMap<string, string> }   // path → git blob id
  export function readGateManifest(path: string): GateManifest;                    // '<blob> <path>' lines, '#' comments
  export function recordGateManifest(paths: readonly string[], rev: string): GateManifest;
  export interface GateException { readonly path: string; readonly dropJsonKeys?: readonly string[] }
  export function checkGate(manifest: GateManifest, rev: string | 'worktree', except: readonly GateException[]): readonly string[];   // the differing paths
  ```
- The blob id of a worktree file is `git hash-object <file>`.
- A `dropJsonKeys` exception compares the file with those top-level keys removed from both sides: parse, delete, re-serialize with the generator's formatting.
- CLI:
  - `tool output-gate --record <out> [--rev <rev>]` records the generated outputs that `generated-manifest.ts` lists;
  - `tool output-gate --check <manifest> [--except <path>[:key,key]]…` prints each differing path and exits 1 if any differ.

- [ ] **Step 1: Write the failing tests.**
  - A manifest written by `recordGateManifest` checks clean against the same revision.
  - Changing one byte of a listed file names that file.
  - `--except packages/x/grammar.json:splitFrom` ignores a difference only in that key, and still reports a difference in `rules`.
- [ ] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/tools/src/output-gate/__tests__/output-gate.test.ts`
- [ ] **Step 3: Implement.** Read the generated-output list from `packages/codegen/src/scripts/generated-manifest.ts`; do not keep a second list.
- [ ] **Step 4: Run the tests, then check the 2b head against itself.** `tool output-gate --check scratchpad/handoffs/reshape-gate-manifest-946114382.txt` at 946114382 prints nothing.
- [ ] **Step 5: Commit** the tool, its command, its test and its glossary entries.

### Task 0.2: evaluated-grammar snapshots

**Files:**
- Modify: `packages/tools/src/output-gate/index.ts`
- Test: `packages/tools/src/output-gate/__tests__/evaluated-snapshot.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function evaluatedSnapshot(grammar: GrammarName, layer: 'sittir' | 'top'): string;   // canonical JSON
  ```
- `evaluatedSnapshot` is `JSON.stringify` of the evaluated grammar as `importAndExtractGrammar` returns it, with keys sorted and `Map` and `Set` canonicalized. It uses the same `canonical()` as `evaluate-for-derivation.ts`; export that one, do not copy it.
- CLI: `tool output-gate --snapshot <dir>` writes `<dir>/<grammar>.<layer>.json`; `--check-snapshot <dir>` compares.

- [ ] **Step 1: Write the failing test.** Two snapshots of one grammar and layer, taken in one process, are equal. A snapshot taken after mutating the result's `options` differs.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Implement.** At 946114382, "sittir" means evaluating with `SITTIR_UNBOUND=1` and "top" without it. After Task 1.6 the layer is chosen by module.
- [ ] **Step 4: Record the baselines.** At 946114382, write the snapshots for rust, typescript, python, scm and regex to `scratchpad/handoffs/reshape-snapshots-946114382/`. Do not commit them.
- [ ] **Step 5: Commit** the code and the test.

### Task 0.3: measure enrich over the bound output (question 3)

- [ ] **Step 1:** At 946114382, for rust, typescript and python, enrich each top-layer result once with its sidecars. Use `assertEnrichFixpoint`'s comparison as a probe; do not change it. List every rule enrich adds, removes or changes.
- [ ] **Step 2:** Send the list to brainstorm, per grammar. An empty list makes the spec's question 3 (a) free. A non-empty list is a finding for the maintainer before Stage 1 starts.

---

## Stage 1: the bindings layer as a `grammar()` layer

This is the reshape. Afterwards grammar.bindings.ts is `export default grammar(sittir, { edits })` plus `export const hash`. grammar.sittir.ts calls `grammar(base, { … edits … })`, and `bindGrammar` and the bindings record are gone.

**Gate:** spec §10. Run:
```
tool output-gate --check scratchpad/handoffs/reshape-gate-manifest-946114382.txt \
  --except packages/rust/grammar.bindings.ts --except packages/typescript/grammar.bindings.ts --except packages/python/grammar.bindings.ts \
  --except packages/rust/.sittir/grammar.js --except packages/typescript/.sittir/grammar.js --except packages/python/.sittir/grammar.js \
  [question 1 (a) only:] --except packages/rust/.sittir/src/grammar.json:splitFrom,leadFrom,bindingEffects (and the same for typescript and python)
```
Also run `tool output-gate --check-snapshot scratchpad/handoffs/reshape-snapshots-946114382/`. Rows must equal `reshape-gate-rows-946114382.txt`.

### Task 1.1: the layer record and the effect table

**Files:**
- Create: `packages/codegen/src/dsl/layer-record.ts`
- Create: `packages/codegen/src/dsl/verbs/effects.ts`
- Modify: `packages/codegen/src/dsl/bind.ts`. Move `renameOptionPaths`, `rewriteOwnedSegments`, `boundSegmentOf`, `boundFieldNameOf`, `inheritSplitOptions`, `renameReparseHosts` and `renameKeys` into `verbs/effects.ts` as the effect table's rewrites, then delete them from `bind.ts`.
- Test: `packages/codegen/src/dsl/__tests__/layer-record.test.ts`, `packages/codegen/src/dsl/__tests__/effects.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Effect =
  	| { readonly kind: 'segment'; readonly owner: string; readonly from: string; readonly to: string }
  	| { readonly kind: 'alias'; readonly from: string; readonly to: string }
  	| { readonly kind: 'rename'; readonly from: string; readonly to: string }
  	| { readonly kind: 'copy'; readonly copy: string; readonly base: string; readonly context: string; readonly by: 'path' | 'substitute' | 'lead' }
  	| LeadEffect;                                          // moved from bind.ts unchanged
  export interface LayerRecord {
  	readonly depth: number;
  	readonly upstream: unknown;
  	readonly sidecars: EnrichSidecars;                     // rule origins, whitespace, automatic variants
  	readonly resolutions: ConflictResolutionsFile;
  	readonly deadMints: ReadonlySet<string>;
  	readonly textTokens: readonly string[];
  	readonly liftNames: ReadonlyMap<string, LiftName>;
  	readonly effects: readonly Effect[];
  	readonly records: LayerRecords;                        // options, groups, renderAs, … (spec §1.5)
  }
  export const LAYER_RECORD_KEY: unique symbol;
  export function layerRecordOf(result: unknown): LayerRecord | undefined;
  export function attachLayerRecord(result: object, record: LayerRecord): void;   // non-enumerable
  export interface EffectCtx { readonly effects: readonly Effect[]; readonly rules: Readonly<Record<string, unknown>> }   // rules: for field-name resolution
  export function rewriteInherited(records: LayerRecords, ctx: EffectCtx): LayerRecords;
  export function provenanceOf(effects: readonly Effect[]): { splitFrom; leadFrom; renamedFrom; bindingEffects };   // the projections
  ```
- `provenanceOf` must reproduce today's `splitFrom`, `leadFrom` and `bindingEffects` values exactly, key order included.
  - `bindingEffects` is the segment and alias effects in recording order, then the lead effects. That is what `bindGrammar` writes today.

- [ ] **Step 1: Write the failing tests** (Review Focus 4).
  - `rewriteInherited` applies a segment effect to an inherited option path, `'item:/separator/","/after'` on owner `o`.
  - It applies an alias effect to a `(from)` segment.
  - It applies a copy effect made `by: 'path'` as `inheritSplitOptions` does today: the base's options and `_labels`, layout included.
  - It leaves a copy effect made `by: 'lead'` alone.
  - A layer's own records passed beside inherited ones are never rewritten.
  - `provenanceOf` on the effects `bindGrammar` recorded for rust at 946114382 deep-equals that grammar's `splitFrom`, `leadFrom` and `bindingEffects`. Capture them from the snapshot.
- [ ] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/codegen/src/dsl/__tests__/layer-record.test.ts packages/codegen/src/dsl/__tests__/effects.test.ts`
- [ ] **Step 3: Implement.** Move the functions listed above; do not rewrite them. Keep `bind.ts` compiling, since its remaining passes still call them until Task 1.7.
- [ ] **Step 4: Run the tests and the existing `split-layout`, `lead-grammar` and `grammar-bindings` tests.** All pass.
- [ ] **Step 5: Write the glossary entries and commit.**

### Task 1.2: the layer function

**Files:**
- Create: `packages/codegen/src/dsl/layer.ts`
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` and `packages/codegen/src/dsl/index.ts`. `grammar` becomes the layer function; `sittirGrammar` and the `bindings` exports go.
- Modify: `packages/codegen/src/dsl/sittir-grammar.ts` (delete the file once `layer.ts` holds its layer-1 path), `packages/codegen/src/dsl/wire/wire.ts` (`wireBindings` goes)
- Test: `packages/codegen/src/dsl/__tests__/layer.test.ts`; migrate `packages/codegen/src/dsl/__tests__/bindings-layer.test.ts` into it

**Interfaces:**
- Consumes: `LayerRecord`, `attachLayerRecord`, `layerRecordOf`, `rewriteInherited` (Task 1.1).
- Produces:
  ```ts
  export interface LayerConfig extends Omit<WireConfig<…>, 'patches'> {
  	readonly name?: string;                       // defaults to the base's
  	readonly edits?: EditsConfig;                 // the old PatchesConfig, renamed
  	readonly resolutions?: ConflictResolutionsInput;   // layer 1 only
  	readonly contexts?: ContextsConfig;           // recorded, never passed to the runtime
  }
  export function grammar<B extends GrammarJson>(base: B | GrammarResult, config: LayerConfig): GrammarResult;
  export interface LayerCtx { /* the one phase ctx of the layer pass: rules, record, effects, created-rule order, symbols */ }
  ```
- Intake: `layerRecordOf(base) === undefined` selects today's `sittirGrammar` layer-1 path, moved here unchanged: enrich, wire, `grammar()`, completion. Otherwise:
  1. the enrich gate (`assertEnrichFixpoint`, moved, reporting `layer-base-not-enrich-fixpoint`);
  2. lowering through wire with the layer's `edits`;
  3. the eager layer pass;
  4. the runtime's `grammar()`, given declared rules in creation order;
  5. completion.
- In this stage only layer 2 takes the eager pass. Layer 1 keeps wire's lazy hook until Stage 2.
- If question 1 is answered (b), completion also writes the three projections (`splitFrom`, `leadFrom`, `bindingEffects`) as enumerable keys on the grammar object, so that `grammar.json` keeps them until a later stage drops them under its own gate.

- [ ] **Step 1: Write the failing tests.**
  - A layer over a completed layer whose `edits` is empty still runs the gate. Feeding it a base whose record's sidecars were dropped reports `layer-base-not-enrich-fixpoint` naming `_layout`.
  - `name` defaults to the base's.
  - **Review Focus 3:** evaluate rust layer 1, then the top layer, then layer 1 again. The two layer-1 snapshots (`evaluatedSnapshot`) are equal.
  - `contexts` given to a layer never reaches the runtime's `grammar()`. Assert with a stub runtime that records its options.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** Move `assertEnrichFixpoint`, `completeLayer`'s shared completion and the conflict application out of `sittir-grammar.ts` into `layer.ts`. The layer record replaces:
  - `completeLayer`'s non-enumerable copy loop;
  - the lift-name merge into the sittir wire context;
  - `markedBindingPatches`.
- [ ] **Step 4: Run the tests.**
- [ ] **Step 5: Glossary entries; commit.**

### Task 1.3: `lead` as an `edits` entry

**Files:**
- Create: `packages/codegen/src/dsl/verbs/lead.ts`. Move `leadGrammar`, its helpers and `LeadRefusal` here as `applyLead(list, ctx: LayerCtx)`. Its refusals become `lead-refused` diagnostics with today's reason text.
- Modify: `packages/codegen/src/dsl/primitives/` to add the `lead` placeholder (`lead(item, field, ...admits)`); `match` moves here from `bind.ts`.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `resolvePatch` hands a `lead` placeholder to the layer pass's whole-grammar queue; it is never applied in place.
- Test: migrate `packages/codegen/src/dsl/__tests__/lead-grammar.test.ts` to entries; extend `packages/codegen/src/bindings/__tests__/production-leads.test.ts`

**Interfaces:**
- Consumes: `LayerCtx`, `Effect` (Task 1.1).
- Produces: `lead(item: string, field: string, ...admits: LeadMatch[]): LeadPlaceholder`, valid only at a list kind's `.`. The lead effect and one `copy` effect `by: 'lead'` per created rule go into `ctx.effects`.

- [ ] **Step 1: Write the failing tests.**
  - Every case in `lead-grammar.test.ts`, rewritten as `edits: { L: { '.': lead(…) } }`, gives the same rules and the same refusal reasons.
  - **Review Focus 1:** the rust top layer's `grammar.json` keys end with `_kw_raw`, `_parameter_receiver`, `_attributed_parameter_receiver`, `_parameters_elements_receiver`, `parameters_elements_receiver_group`, in that order.
  - A `lead` entry at any path but `.` is `edit-entry-invalid`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
  - Map the entry's `item` and admits through the layer's own field effects (`boundFieldNameOf`) before applying, as `bindGrammar` does.
  - Declare the created rules to the runtime in creation order.
  - Replace `bind.ts`'s private shape helpers (`unprecedenced`, `refRule`, `refKind`, its record walkers) with the `rule-patterns.ts` predicates (spec §7). A helper with no shared equivalent moves to `rule-patterns.ts`, where the split code reaches it too in Stage 5.
- [ ] **Step 4: Run the tests and `lead-facts.test.ts`.**
- [ ] **Step 5: Glossary entries; commit.**

### Task 1.4: the grammar files

**Files:**
- Modify: `packages/{rust,typescript,python,scm,regex}/grammar.sittir.ts`. `sittirGrammar` becomes `grammar` and `patches:` becomes `edits:`. In rust, typescript and python, drop `bindings:` and the `grammar.bindings.ts` import.
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`PatchesConfig` → `EditsConfig`, `PatchesCheck` → `EditsCheck`), and every reader of `patches` on the config: `authoredFieldSites`, `assertNoSpacingAddressPatches`, `assertNoDeclaredGroupPatches` and `departsFromBase`.
- Modify: `packages/tools/src/bootstrap/templates.ts` (new grammars start with `grammar(base, { edits })`)

- [ ] **Step 1:** Rename, with no other change. Run `pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src` and the same for regex. `tool output-gate --check` shows no difference for scm and regex.
- [ ] **Step 2:** Type-check the workspace. `EditsCheck` refuses a misspelled key exactly as `PatchesCheck` did; keep the existing type test for it, renamed.
- [ ] **Step 3: Commit.**

### Task 1.5: the generated layer

**Files:**
- Modify: `packages/codegen/src/bindings/module.ts`
  - `printBindingsModule` prints the layer form of spec §2.4: `import sittir from './grammar.sittir.ts'`, `export const hash`, and `export default grammar(sittir, { edits })`. Renames and splits are not printed (questions 2 and §2.4).
  - `loadBindingsModule` becomes `loadBindingsHash(dir): Promise<string | undefined>`, reading the named export.
- Modify: `packages/codegen/src/bindings/hash.ts` (`assertBindingsFresh` takes the hash from `loadBindingsHash`), `packages/codegen/src/compiler/compile.ts`
- Modify: `packages/codegen/src/bindings/grammar-bindings.ts`. `GrammarBindings` loses the record shape; the inventory report keeps reporting renames and splits.
- Regenerate: `packages/{rust,typescript,python}/grammar.bindings.ts` with `pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write`
- Test: `packages/codegen/src/bindings/__tests__/grammar-bindings.test.ts`, `packages/codegen/src/bindings/__tests__/hash.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - The printed module of a fixture with one field patch, one alias patch and one lead equals an expected string in the layer form.
  - `loadBindingsHash` reads `hash`.
  - A module with no `hash` export is `StaleBindingsError` with the regenerate command, as today.
  - The printed module evaluates: write it into a temp package beside a fixture `grammar.sittir.ts`, then evaluate. The existing test at line 335 does this for the record form; port it.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement and regenerate.**
- [ ] **Step 4: Run the tests and `bindings-inventory --check`.**
- [ ] **Step 5: Commit** the code, the tests and the three regenerated layers together.

### Task 1.6: the entry and evaluating up to a layer

**Files:**
- Modify: `packages/codegen/src/grammars.ts`. Add `topLayerPath(pkg)` and `layerPath(pkg, layer: 'sittir' | 'top')`. `GRAMMAR_ENTRY` stays the layer-1 file name and the package marker.
- Modify: `packages/codegen/src/transpile/transpile-overrides.ts` (writes `.sittir/grammar.js` from `topLayerPath`), `packages/codegen/src/compiler/resolve-grammar.ts`
- Modify: `packages/codegen/src/compiler/evaluate.ts`. `evaluateUnboundDsl` imports `layerPath(pkg, 'sittir')`; `importUnbound` and the `?unbound` query go.
- Modify: `packages/codegen/src/transpile/conflict-driver.ts`. The base run generates from a scratch directory whose `grammar.js` re-exports layer 1; reuse `source-parser.ts`'s scratch-entry helper, extracted, not copied.
- Modify: `packages/codegen/src/transpile/source-parser.ts`, `packages/codegen/src/transpile/tree-sitter-cli.ts`, `packages/codegen/src/transpile/evaluate-for-derivation.ts` and its `.child.ts`, `packages/tools/src/inventory/index.ts`. `UNBOUND_ENV` goes from all of them.
- Test: `packages/codegen/src/transpile/__tests__/conflict-driver.test.ts`, `packages/codegen/src/transpile/__tests__/evaluate-for-derivation.test.ts`, a new `packages/codegen/src/compiler/__tests__/layer-selection.test.ts`

- [ ] **Step 1: Write the failing tests** (Review Focus 2).
  - Evaluating rust's layer 1 with a deliberately broken `grammar.bindings.ts` beside it succeeds, because the broken file is never imported.
  - `compile` on a package whose layer's `hash` is stale throws `StaleBindingsError` before any evaluation. Spy on the layer function.
  - `.sittir/grammar.js` for rust names `../grammar.bindings.ts`, and for scm names `../grammar.sittir.ts`.
  - `evaluateForDerivation` returns the same `base` and `bound` hashes as at 946114382, read from `resolutions.json`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** A name search for `SITTIR_UNBOUND` and `UNBOUND_ENV` (Infigraph `search` with `regex=true`) must return no hits outside the glossary's history-free text.
- [ ] **Step 4: Run the tests.**
- [ ] **Step 5: Glossary entries; commit.**

### Task 1.7: removals, and the stage gate

**Files:**
- Modify: `packages/codegen/src/dsl/bind.ts`. Delete `bindings`, `Bindings`, `bindGrammar`, `bindingEffectsForOwners`, `rewriteBindingOptions`, `checkBindingPatches`, `BINDING_SET`, `markBindingSet` and `isBindingSet`.
  - `aliasTargetIssue` moves into the `alias` verb as the layer-above-the-first check (`alias-target-invalid`).
  - `splitGrammar` and `renameGrammar` stay as library code, with their tests, until Stage 5 and question 2.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `transform` loses the `isBindingSet` branch. `recordFieldEffect` and `recordAliasEffect` record into `LayerCtx.effects` in every layer.
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. `wireWithBindingEffects` and `recordingBindingEffects` go; `wireRecordBindingEffect` records unconditionally.
- Migrate tests:
  - `packages/codegen/src/dsl/__tests__/grammar-bindings.test.ts`
  - `packages/codegen/src/dsl/__tests__/bindings-layer.test.ts` (done in Task 1.2)
  - `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`, whose `bindingEffects` and `leadFrom` now come from the projections

- [ ] **Step 1:** Delete, migrate, and run the full suite as its own call. Any new failure is isolated with stash-and-rerun before it is accepted as pre-existing.
- [ ] **Step 2:** Regenerate all five grammars: `pnpm run validate:native`, which generates.
- [ ] **Step 3: Run the stage gate** (above): output-gate, snapshots and rows.
  - A difference outside the named exceptions stops the stage. Report the paths and the first differing rule or key to brainstorm.
- [ ] **Step 4:** Run the standing gates, then the Codex adversarial review. Open the stage PR into `feat/authoring-dsl`. The body starts with `Owner: sittir-coordinate` and gives the gate numbers.

---

## Stage 2: one layer pass for every layer

**Gate:** byte-identical to Stage 1's commit, rows equal, snapshots equal. The exception is `desugarDivergences`, which leaves the snapshots; it is empty in production today.

### Task 2.1: layer 1 on the eager layer pass

**Files:**
- Modify: `packages/codegen/src/dsl/layer.ts`, `packages/codegen/src/dsl/wire/wire.ts`. `wrapRuleHook` goes; its operation (`resolveLiftNames`) becomes the first step of the whole-grammar phase.
- Test: `packages/codegen/src/dsl/__tests__/shared-lift-rename.test.ts`, `packages/codegen/src/dsl/__tests__/transform-enrich-lift.test.ts`, `packages/codegen/src/dsl/__tests__/patch-sites.test.ts` (unchanged expectations)

- [ ] **Step 1:** Add a test that a layer-1 rule callback runs exactly once per evaluation, counted with a spy, in both the stub tree-sitter runtime and sittir's `grammarFn`.
- [ ] **Step 2:** Implement. The layer evaluates callbacks in `Object.entries(rules)` order, the order `wrapRuleHook` used, with a `$` that returns `{ type: 'SYMBOL', name }` for known names. An unknown name is `edit-site-missing` for an entry and tree-sitter's undefined-symbol error for a callback.
- [ ] **Step 3:** Run the suite and the stage gate. Commit.

### Task 2.2: evaluate's duplicate passes go

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts`. Delete `injectSyntheticRules`, the `groups:` body evaluation in `evaluateRulesAndInjectSynthetics` (with its swallowed `catch`), `applyPatternReplacement` and its helpers, and `applyVisibleExternalsRewrite` and its helpers.
- Modify: `packages/codegen/src/compiler/types.ts` (`desugarDivergences` goes; `bodyPatternZeroMatches` is filled by the layer pass's pattern injection), `packages/codegen/src/compiler/link.ts`, `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` (`fromDesugarDivergence` goes)
- Test: `packages/codegen/src/compiler/__tests__/evaluate.test.ts` (the two `desugarDivergences` cases go), `packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`, `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`

- [ ] **Step 1:** Port `evaluate.test.ts`'s `_orphan_group` case into a layer test. A `groups:` entry whose body matches nothing reports `bodyPatternZeroMatches`, from the one pass.
- [ ] **Step 2:** Delete, run the suite, run the stage gate. A rule that moves means the two implementations diverged: stop and report the rule. Commit.

### Task 2.3: the record replaces evaluate's inheritance

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts`
  - `grammarFn` no longer drains the wire context or merges inherited metadata. `inheritedRecord`, `inheritedMap`, `inheritedPatchSites`, the `drain*Metadata` functions and `LayerCtx<T>` go.
  - `importAndExtractGrammar` reads `layerRecordOf` and spreads its records and projections into the evaluated grammar.
- Test: the snapshots. Every key of every grammar's evaluated grammar is unchanged.

- [ ] **Step 1:** Implement, then run `tool output-gate --check-snapshot`. Every snapshot is equal.
- [ ] **Step 2:** Run the suite and the stage gate. Commit.

### Task 2.4: `injects:` and the record form of `groups:` go

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`WireConfig.injects`, `GroupsConfigValue`'s record arm, `declaredPatterns`' inject branch), `packages/codegen/src/compiler/types.ts` (`groups` holds function entries only)

- [ ] **Step 1:** Confirm with Infigraph `search` that no grammar file or test fixture uses `injects:` or a record-valued `groups:` entry. Delete, run the suite and the stage gate, then commit.

---

## Stage 3: inline verbs

**Gate:** byte-identical to Stage 2's commit, rows equal.

### Task 3.1: `edit(rule, sets)`

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Export `edit` as the authoring name; `transform` stays internal, as the lowering's call.
- Modify: `packages/codegen/src/dsl/dsl-authoring.ts` (export `edit`), `packages/python/grammar.sittir.ts` (`tuple_pattern`: `transform(original, …)` becomes `edit(original, …)`, and the direct `transform` import goes)
- Test: `packages/codegen/src/dsl/__tests__/transform-path.test.ts` (an `edit` case per segment form)

- [ ] **Step 1:** Test that an inline `edit` records the same patch sites and effects as the same entry in `edits`.
- [ ] **Step 2:** Implement, migrate python, run the gate. Commit.

### Task 3.2: `variant(name, rule, options?)` and `refine(forms)`

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/variant.ts`. The two-argument form returns `rule` labelled; the layer pass mints it as `resolvePatch` would at that arm.
- Modify: `packages/codegen/src/dsl/primitives/refine.ts`. The one-argument form is an entry valid at `.`.
- Test: `packages/codegen/src/dsl/__tests__/variant-inline.test.ts` (new), `packages/codegen/src/dsl/__tests__/refine-entry.test.ts` (new)

- [ ] **Step 1: Write the failing tests.**
  - A re-authored rule `choice(variant('a', seq('x', $.y)), variant('b', seq('z', $.y)))` yields exactly the rules and annotations that the bare choice plus `edits: { k: { '0': variant('a'), '1': variant('b') } }` yields.
  - `refine(forms)` at `.` records the same forms as typescript's inline `interface_body` call.
- [ ] **Step 2:** Implement and run the gate. Typescript keeps its inline `refine` call: one site, no change needed. Commit.

### Task 3.3: the same-site check

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Applications record their resolved member positions, as index paths into the callback's result, in `LayerCtx`.
- Modify: `packages/codegen/src/dsl/layer.ts`. After lowering, a position written by both an inline application and an entry of the same kind is `edit-site-conflict`.
- Test: `packages/codegen/src/dsl/__tests__/edit-site-conflict.test.ts` (new)

- [ ] **Step 1: Write the failing tests** (Review Focus 5).
  - `rules: { k: ($, p) => edit(p, { '1': field('a') }) }` with `edits: { k: { 'body:': field('b') } }`, where `body:` is member 1, conflicts.
  - Two different members do not conflict.
- [ ] **Step 2:** Implement, run the tests and the gate. Commit.

---

## Stage 4: one alias form, one replacement form

**Gate:** byte-identical to Stage 3's commit, rows equal. The generated layers change text but not their applied result.

### Task 4.1: `alias(name)` everywhere

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `resolveAliasPlaceholder` records the alias effect for a symbol member, and the literal-alias branch of `resolvePatch` goes.
- Modify: `packages/codegen/src/bindings/module.ts` (prints `alias(to)`), `packages/codegen/src/bindings/grammar-bindings.ts`
- Regenerate: the three grammar.bindings.ts.

- [ ] **Step 1:** Test that python's two generated alias sites give the same rule, labels and recorded effect through `alias(name)` as through the literal form. Take the expected values from Stage 3's snapshot.
- [ ] **Step 2:** Implement, regenerate, run the gate. Commit.

### Task 4.2: `substitute`

**Files:**
- Create: `packages/codegen/src/dsl/verbs/substitute.ts`, `packages/codegen/src/dsl/primitives/substitute.ts`
- Modify: `packages/codegen/src/dsl/transform/transform.ts` (a bare rule as an entry is `edit-entry-invalid`), `packages/codegen/src/dsl/wire/wire.ts` (the entry type excludes rules)
- Migrate: every bare-rule entry in the five `grammar.sittir.ts` becomes `substitute(rule)`. List them first, with Infigraph `search` over each `edits` block plus the type errors the new entry type raises.

- [ ] **Step 1:** Test that `substitute(rule)` gives today's literal result, including the alias-of-the-same-symbol case that keeps the member's metadata. Test that `($, member) => rule` receives the member.
- [ ] **Step 2:** Implement, migrate, run the gate. Commit.

---

## Stage 5: the copy primitive and paths that enter rules

**Gate:** byte-identical to Stage 4's commit, rows equal. No split entry is printed yet (spec §2.4). The split behaviour is proved by unit tests equal to `splitGrammar`'s.

### Task 5.1: paths that enter rules, and `copy`

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform-path.ts`. A `(kind)` segment followed by more segments enters the rule, `(kind as name)` names the copy, and hidden rules between visible kinds are entered implicitly.
- Create: `packages/codegen/src/dsl/verbs/copy.ts`
  - `applyCopy(site, ctx: LayerCtx)` handles naming, aliasing back, list enlisting, one copy per base and context, and the copy effect.
  - It is built from `splitGrammar`'s `mint`, `cloneToward`, `mintLists` and `fieldReferences`, moved and not rewritten.
- Create: `packages/codegen/src/dsl/primitives/copy.ts` (`copy(name?, sets?)`)
- Test: port `packages/codegen/src/dsl/__tests__/split-layout.test.ts` to `edits` entries; add `packages/codegen/src/dsl/__tests__/copy.test.ts`

- [ ] **Step 1: Write the failing tests.**
  - Each `split-layout` case, written as a path that enters rules plus `substitute(copy(name))`, gives the rules, `splitFrom` projection, lists and options that `splitGrammar` gives.
  - An unnamed copy of a visible rule aliases back.
  - A named copy that flips hiddenness, or whose name is taken, is `copy-name-invalid`.
  - A second path through the same context reuses the copies.
  - The ruled rust contextual alias, `alias('method_declaration')` at `impl_item_body: 'body:/(declaration_list as extension_declaration_body)/(function_item)'`, yields the ancestor copies with no target copy.
- [ ] **Step 2:** Implement, then delete `splitGrammar`. Run the suite and the gate. Commit.

### Task 5.2: the lead's forms through the primitive

**Files:**
- Modify: `packages/codegen/src/dsl/verbs/lead.ts`. Its mints call `applyCopy` with `by: 'lead'`.

- [ ] **Step 1:** Run the lead tests and the gate. Both are unchanged, which proves the primitive serves the lead. Commit.

---

## Stage 6: the conflict hash keys the derivation's inputs

**Gate:** both resolution arrays in every `resolutions.json` are byte-identical. The `grammarHash` fields change once. A second regeneration reuses every section, with `resolutions reused` printed for both.

### Task 6.1

**Files:**
- Modify: `packages/codegen/src/transpile/evaluate-for-derivation.ts`. `grammarHash` hashes the parser input (rules, extras, externals, inline, supertypes, word, precedences, reserved), the derivation records (`sourceEdges`, `baseNames`, `upstreamConflicts`) and the tree-sitter version. It no longer hashes the whole evaluated grammar.
- Test: `packages/codegen/src/transpile/__tests__/evaluate-for-derivation.test.ts`

- [ ] **Step 1:** Test that adding an option or a patch site leaves the hash unchanged, while changing a rule or a source edge changes it.
- [ ] **Step 2:** Implement, regenerate twice, compare. Commit with the regenerated `resolutions.json` files.

## Stage 7: the deriver writes field entries directly

**Gate:** the three grammar.bindings.ts files are byte-identical to Stage 6's.

### Task 7.1

**Files:**
- Modify: `packages/codegen/src/bindings/grammar-bindings.ts`. Each `FieldRename` and `FieldWrap` request resolves its site's path against layer 1's rules, and the entry is written directly. `grammarBindingsPatches`' diff and the `fielded` grammar go.
- Modify: `packages/codegen/src/dsl/bind.ts`. Delete `fieldRenameGrammar`, `fieldWrapGrammar` and `renameFields`. `fieldRenameIssue`, `fieldWrapIssue`, `sharedHosts` and `childFields` stay, as derivation analysis.

- [ ] **Step 1:** Implement, regenerate the layers, `tool output-gate --check` against Stage 6. Commit.

## Stage 8: renames (after question 2)

- **(a):** delete `renameGrammar`, `rename-grammar.test.ts` and the inventory's printed renames; keep reporting them. The `rename` verb lands with its first user.
- **(b):** a stage of its own, with a census. It reverses the stage-2 ruling and moves every generated surface.

## Stage 9: the enrich check at the top layer (after question 3)

- **(a):** the top layer's completion enriches the rules the layer created, with its sidecars, and reports any change as `layer-base-not-enrich-fixpoint`, naming the layer and the rules.
  - **Gate:** byte-identical, rows equal.
  - Task 0.3 must have shown the check passes. If it found changes, they are fixed in the verb that made the rule first, each as its own reviewed change.
- **(b):** enrich re-runs over every created rule. That moves output, so it needs a census and its own gate.
- **(c):** no stage.

## Then

- The wiring plan's 2b continues on Stage 1's state.
- 2c with 2e builds on Stage 5: contextual aliases, literal splits, one split per site, clone forms. Its census and gate are unchanged.
- The acceptance plan's kind-gap stage builds on Task 3.2.
- The builder contexts build on Task 2.3's record.
