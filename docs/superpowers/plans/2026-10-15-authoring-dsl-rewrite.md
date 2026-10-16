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
  - Each stage is a PR into `feat/authoring-dsl`. Never rebase; master comes in by merge.
  - The branch merges to master on the maintainer's word, carrying 2b.
  - PR bodies start `Owner: sittir-design`. Coordinate reviews the stages.
- **Execution.** The design session executes this plan inline, with superpowers:executing-plans. It uses no subagents.
- **Byte-identical gates.** Every stage leaves generated output byte-identical to the previous stage's commit, except the exceptions the stage names.
  - Stage 1's reference is the baseline recorded at Task 0.0's merge (spec §10). That baseline's grammar-level outputs equal 946114382's (`scratchpad/handoffs/reshape-gate-manifest-946114382.txt`). Its rows equal `scratchpad/handoffs/reshape-gate-rows-946114382.txt`, unless Task 0.0 reports a moved row.
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
  - the Codex adversarial review before each PR opens, with each finding fixed or declined in the PR body.

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
   - Test: in Task 1.1.
5. **The same-site check under two spellings.**
   - Expected: an inline `edit(previous, { '1': field('a') })` and an entry `{ 'body:': field('b') }` that resolve to one member raise `edit-site-conflict`.
   - Test: in Task 4.4.

---

## Stage 0: the branch, the gate tool and the baselines

No behaviour change. Its deliverables let every later stage prove it is byte-identical.

### Task 0.0: the branch and its merge

- [ ] **Step 1: Create the worktree.**
  `git worktree add -b feat/authoring-dsl scratchpad/wt-dsl-authoring origin/master`
- [ ] **Step 2: Merge the 2b head.** `git -C scratchpad/wt-dsl-authoring merge --no-ff 946114382`. A trial merge conflicts in two kinds of file:
  - three source files, resolved by hand, keeping both sides' changes: `packages/codegen/src/bindings/facts.ts`, `packages/codegen/src/bindings/input.ts` and `packages/codegen/src/bindings/__tests__/routes.test.ts`;
  - generated files under `packages/*/src`, resolved by regeneration in Step 3, never by hand.
- [ ] **Step 3: Regenerate.** Run `pnpm run validate:native`, which generates, then `bindings-inventory --check`. A failing check means master's bindings changes moved the derivation: stop and report the difference to brainstorm.
- [ ] **Step 4: Compare the grammar-level outputs with 946114382's blobs.** These are `grammar.json`, `parser.c`, `node-types.json`, `parser.wasm`, `resolutions.json`, `grammar.bindings.ts` and `.sittir/grammar.js`, for all five grammars.
  - Use `git hash-object` against the manifest's blob ids.
  - Any difference stops the work and is reported.
  - The baseline is recorded (Task 0.1, Step 4) only after every one of these outputs equals its 946114382 blob.
- [ ] **Step 5: Run the standing gates.** Compare the rows with `reshape-gate-rows-946114382.txt`, and report any moved row to brainstorm before the baseline is accepted.
- [ ] **Step 6: Commit the merge** with the regenerated outputs. Send coordinate the three hand-resolved files for review.

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
- [ ] **Step 4: Run the tests, then record the baseline.** Run `tool output-gate --record scratchpad/handoffs/reshape-gate-manifest-merge.txt --rev <Task 0.0's merge>`. Do not commit the manifest. Checking it against the merge prints nothing.
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
- `evaluatedSnapshot` is `JSON.stringify` of the evaluated grammar as `importAndExtractGrammar` returns it, with keys sorted and `Map` and `Set` canonicalized. It uses the same `canonical()` as `evaluate-for-derivation.ts`: export that one, do not copy it.
- CLI: `tool output-gate --snapshot <dir>` writes `<dir>/<grammar>.<layer>.json`, and `--check-snapshot <dir>` compares.

- [ ] **Step 1: Write the failing test.** Two snapshots of one grammar and layer, taken in one process, are equal. A snapshot taken after mutating the result's `options` differs.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Implement.** Until Task 1.4, "sittir" means evaluating with `SITTIR_UNBOUND=1` and "top" without it. From Task 1.4 on, the layer is chosen by module.
- [ ] **Step 4: Record the baselines.** Write the snapshots for rust, typescript, python, scm and regex to `scratchpad/handoffs/reshape-snapshots-merge/`. Their grammars are the merge's, since Tasks 0.1 and 0.2 change no grammar. Do not commit them.
- [ ] **Step 5: Commit** the code and the test.

### Task 0.3: measure the fixpoint check at completion

- [ ] **Step 1: List what enrich would change.** For rust, typescript and python, enrich each layer's result once with its sidecars, using `assertEnrichFixpoint`'s comparison as a probe; do not change it.
  - Layer 1 is today's gate and is expected to list nothing.
  - The top layer is the new check (spec §1.3, step 5).
  - List every rule enrich adds, removes or changes.
- [ ] **Step 2: Report.** Send the list to brainstorm, per grammar and layer. A non-empty top-layer list blocks Stage 3, not Stage 1, and is a finding for the maintainer.

---

## Stage 1: every layer in the stock shape

This is the reshape. Afterwards:
- every grammar file is `export default grammar(enrich(base), wire({ … }))`;
- grammar.bindings.ts is `export default grammar(enrich(sittir), wire({ edits }))`, beside `export const hash` and `export const renames`;
- `sittirGrammar`, `bindGrammar` and the bindings record are gone.

In this stage, the intake over a completed layer still re-enriches its base with the record's sidecars, as today's gate does. Stage 3 moves the check to completion.

**Gate:** spec §10. Run:
```
tool output-gate --check scratchpad/handoffs/reshape-gate-manifest-merge.txt \
  --except packages/rust/grammar.bindings.ts --except packages/typescript/grammar.bindings.ts --except packages/python/grammar.bindings.ts \
  --except packages/rust/.sittir/grammar.js --except packages/typescript/.sittir/grammar.js --except packages/python/.sittir/grammar.js \
  --except packages/rust/.sittir/src/grammar.json:splitFrom,leadFrom,bindingEffects \
  --except packages/typescript/.sittir/src/grammar.json:splitFrom,leadFrom,bindingEffects \
  --except packages/python/.sittir/src/grammar.json:splitFrom,bindingEffects
```
Also run `tool output-gate --check-snapshot scratchpad/handoffs/reshape-snapshots-merge/`. The rows must equal the baseline's.

### Task 1.1: the layer record and the effect table

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
  	| { readonly kind: 'copy'; readonly copy: string; readonly source: string; readonly part: string; readonly context: string; readonly display: string | undefined; readonly origin: CopyOrigin };
  export interface LayerRecord {
  	readonly depth: number;
  	readonly upstream: unknown;
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
  - Its `receiver` and `variants` come from the displayed names of the lead's copies.
  - Its `group` and `restField` come from the receiver form's body in `rules`.
  - `renamedFrom` is absent when no rename effect exists.

- [ ] **Step 1: Write the failing tests** (Review Focus 4).
  - `rewriteInherited` applies a segment effect to an inherited option path, `'item:/separator/","/after'` on owner `o`.
  - It applies an alias effect to a `(from)` segment.
  - It applies a copy effect with origin `path` as `inheritSplitOptions` does today: the source's options and `_labels`, layout included.
  - It leaves a copy effect with origin `lead` or `narrow` alone.
  - A layer's own records passed beside inherited ones are never rewritten.
  - `layerRecordOf` reads the record from a result whose first rule's body carries it. JSON serialization of that result does not contain the record.
  - On the effects the rust and typescript leads record, `provenanceOf` deep-equals the baseline's `leadFrom` and `bindingEffects`, taken from the snapshot.
- [ ] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/codegen/src/dsl/__tests__/layer-record.test.ts packages/codegen/src/dsl/__tests__/effects.test.ts`
- [ ] **Step 3: Implement.** Move the functions listed above; do not rewrite them. Keep `bind.ts` compiling, since its remaining passes still call them until Task 1.5.
- [ ] **Step 4: Run the tests and the existing `split-layout`, `lead-grammar` and `grammar-bindings` tests.** All pass.
- [ ] **Step 5: Write the glossary entries and commit.**

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
- Completion, in the pass:
  - `stampWiredVariants`;
  - the dead mints;
  - text tokens;
  - the derivation records;
  - the conflict sets, which the `conflicts` callback returns (spec §6);
  - the record, on the start rule's body.

- [ ] **Step 1: Rename `patches` to `edits`, with no other change.** Regenerate all five grammars. `tool output-gate --check` shows no difference. Commit.
- [ ] **Step 2: Write the failing tests.**
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
- [ ] **Step 3: Run them and confirm they fail.**
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Switch scm and regex** to the stock shape, regenerate both, and run `tool output-gate --check`. There is no difference for scm or regex, and their snapshots are equal.
- [ ] **Step 6: Run the suite. Write the glossary entries, and commit.**

### Task 1.3: `copy`, `narrow` and the `lead` helper

**Files:**
- Create: `packages/codegen/src/dsl/verbs/copy.ts`. `applyCopy(source, part, ctx: LayerCtx)` handles naming, the alias back, list enlisting, one copy per source, part and context, and the copy effect. It is built from `leadGrammar`'s `mint` and `bind.ts`'s `mintLists`, moved and not rewritten.
- Create: `packages/codegen/src/dsl/verbs/narrow.ts`. `applyNarrow(site, admits, direction: 'keep' | 'except', ctx: LayerCtx)` carries the spec §5.1 policies. It is built from `narrowRef`, `narrowWithin`, `admittedInside`, `itemPositions` and `narrowInPlace`, moved.
- Create: `packages/codegen/src/dsl/verbs/lead.ts`. `applyLead(list, entry, ctx: LayerCtx)` composes `applyNarrow`, `applyCopy`, replace and alias, as spec §5.2 lists. The group comes from `visibleGroupSynthName`, as today.
- Create: `packages/codegen/src/dsl/primitives/narrow.ts` (`narrow(...admits)`, `narrow.except(...admits)`) and `packages/codegen/src/dsl/primitives/lead.ts` (`lead(item, field, ...admits)`). `match` moves here from `bind.ts`.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `resolvePatch` queues a `lead` placeholder for the whole-grammar phase, and applies a `narrow` placeholder at its site.
- Modify: `packages/codegen/src/dsl/rule-patterns.ts`. `bind.ts`'s private shape helpers (`unprecedenced`, `refRule`, `refKind`, its record walkers) fold into the shared predicates (spec §7). A helper with no shared equivalent moves here.
- Test: migrate `packages/codegen/src/dsl/__tests__/lead-grammar.test.ts` to entries. Add `packages/codegen/src/dsl/__tests__/narrow.test.ts` and `copy.test.ts`. Extend `packages/codegen/src/bindings/__tests__/production-leads.test.ts`.

**Interfaces:**
- Consumes: `LayerCtx` (Task 1.2), `Effect` and `CopyOrigin` (Task 1.1).
- Produces:
  - `lead(item, field, ...admits): LeadPlaceholder`, valid only at a list kind's `.`;
  - `narrow(...admits)` and `narrow.except(...admits): NarrowPlaceholder`;
  - copy effects whose origin is the lead entry;
  - no lead effect.

- [ ] **Step 1: Write the failing tests.**
  - Every case in `lead-grammar.test.ts`, rewritten as `edits: { L: { '.': lead(…) } }`, gives the same rules. Each refusal gives the code from spec §5.2's table and keeps today's reason text in its message.
  - **Review Focus 1:** on the rust and typescript layer-1 results, the helper gives exactly `leadGrammar`'s rules, rule order and names. Rust's last rules are `_kw_raw`, `_parameter_receiver`, `_attributed_parameter_receiver`, `_parameters_elements_receiver`, `parameters_elements_receiver_group`.
  - `narrow` keeps only the admits at a site and copies what it changes. `narrow.except` narrows an exclusive hidden rule in place and copies a shared one.
  - Each of `narrow`'s refusals in spec §5.1 is pinned.
  - A whole copy of a supertype member joins the supertype list, and a second copy in one context returns the same reference.
  - A `lead` entry at any path but `.` is `edit-entry-invalid`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
  - Map the entry's `item` and admits through the layer's own field effects (`boundFieldNameOf`) before applying, as `bindGrammar` does.
  - Append the groups after all leads' copies, as `leadGrammar` does.
- [ ] **Step 4: Run the tests and `lead-facts.test.ts`.** Then switch `lead-facts.ts` to read the copy effects and the receiver form's body (spec §5.2, facts). Its tests keep their expectations.
- [ ] **Step 5: Glossary entries; commit.**

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

- [ ] **Step 1: Write the failing tests** (Review Focus 2).
  - The printed module of a fixture with one field patch, one alias patch and one lead equals an expected string in the layer form, with `renames` as data.
  - `loadBindingsHash` reads `hash`. A module with no `hash` export is `StaleBindingsError` with the regenerate command, as today.
  - The printed module evaluates. Write it into a temp package beside a fixture `grammar.sittir.ts`, then evaluate. Port the existing record-form test at line 335.
  - Evaluating rust's layer 1 with a deliberately broken `grammar.bindings.ts` beside it succeeds, because the broken file is never imported.
  - `compile` on a package whose layer `hash` is stale throws `StaleBindingsError` before any evaluation. Spy on `runLayerPass`.
  - `.sittir/grammar.js` for rust names `../grammar.bindings.ts`, and for scm names `../grammar.sittir.ts`.
  - `evaluateForDerivation` returns the baseline's `base` and `bound` hashes, read from `resolutions.json`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement and regenerate.** A name search for `SITTIR_UNBOUND`, `UNBOUND_ENV` and `sittirGrammar` (Infigraph `search` with `regex=true`) returns no hits outside the glossary's history-free text.
- [ ] **Step 4: Run the tests, `bindings-inventory --check`, and the stage gate's `output-gate` and snapshot checks.** A difference outside the named exceptions stops the task. Report the paths, and the first differing rule or key, to brainstorm.
- [ ] **Step 5: Glossary entries.** Commit the code, the tests and the three regenerated layers together.

### Task 1.5: removals, and the stage gate

**Files:**
- Modify: `packages/codegen/src/dsl/bind.ts`. Delete `bindings`, `Bindings`, `bindGrammar`, `bindingEffectsForOwners`, `rewriteBindingOptions`, `checkBindingPatches`, `leadGrammar`, `LeadEffect`, `LeadRefusal`, `BINDING_SET`, `markBindingSet` and `isBindingSet`.
  - `aliasTargetIssue` moves into the `alias` verb as the check for layers above the first (`alias-target-invalid`), reading the member's displayed name.
  - `splitGrammar` and `renameGrammar` stay as library code, with their tests, until Stages 6 and 9.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. `transform` loses the `isBindingSet` branch. `recordFieldEffect` and `recordAliasEffect` record into `LayerCtx.effects` in every layer.
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. `wireBindings`, `wireWithBindingEffects` and `recordingBindingEffects` go, and `wireRecordBindingEffect` records unconditionally.
- Migrate tests:
  - `packages/codegen/src/dsl/__tests__/grammar-bindings.test.ts`
  - `packages/codegen/src/dsl/__tests__/bindings-layer.test.ts`, into `layer.test.ts`
  - `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`, whose `bindingEffects` and `leadFrom` now come from the projections

- [ ] **Step 1:** Delete, migrate, and run the full suite as its own call. Any new failure is isolated with stash-and-rerun before it is accepted as pre-existing.
- [ ] **Step 2:** Regenerate all five grammars with `pnpm run validate:native`, which generates.
- [ ] **Step 3: Run the stage gate** (above): output-gate, snapshots and rows.
- [ ] **Step 4:** Run the standing gates, then the Codex adversarial review. Open the stage PR into `feat/authoring-dsl`, with a body that starts `Owner: sittir-design` and gives the gate numbers. Ask coordinate to review it.

---

## Stage 2: one pass for both runtimes

**Gate:** byte-identical to Stage 1's commit, rows equal, and snapshots equal. The one exception is `desugarDivergences`, which leaves the snapshots; it is empty in production today.

### Task 2.1: evaluate's duplicate passes go

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts`. Delete `injectSyntheticRules`, the `groups:` body evaluation in `evaluateRulesAndInjectSynthetics` (with its swallowed `catch`), `applyPatternReplacement` and its helpers, and `applyVisibleExternalsRewrite` and its helpers.
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

- [ ] **Step 1:** Implement, then run `tool output-gate --check-snapshot`. Every snapshot is equal.
- [ ] **Step 2:** Run the suite and the stage gate. Commit.

### Task 2.3: `injects:` and the record form of `groups:` go

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`WireConfig.injects`, the record arm of `GroupsConfigValue`, and the inject branch of `declaredPatterns`), `packages/codegen/src/compiler/types.ts` (`groups` holds function entries only)

- [ ] **Step 1:** Confirm with Infigraph `search` that no grammar file or test fixture uses `injects:` or a record-valued `groups:` entry. Delete, run the suite and the stage gate, then commit.

---

## Stage 3: the fixpoint check at completion

Task 0.3 must have shown that the top layer's check passes. Otherwise this stage waits for the maintainer.

**Gate:** byte-identical to Stage 2's commit, rows equal, and snapshots equal.

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
  - The rename effect rewrites inherited option paths, render-as keys and reparse hosts, and gives `renamedFrom`.
  - A fixture layer with a rename generates with the pinned CLI.
- [ ] **Step 2:** Implement and run the gate. Commit.

## Then

- The wiring plan's 2b continues on Stage 1's state.
- 2c with 2e builds on Stage 6: contextual aliases, literal splits, one split per site and clone forms. Its census and gate are unchanged.
- The acceptance plan's kind-gap stage builds on Task 4.3.
- The builder contexts build on Task 2.2's record.
