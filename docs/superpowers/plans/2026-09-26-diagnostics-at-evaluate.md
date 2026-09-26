# Diagnostics at Evaluate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** grammar diagnostics become checks over the evaluated rule tree, and link runs only when no blocking final-stage record is unresolved outside the declared floors.

**Architecture:** one inline predicate over a `SymbolSource` (predicted from the rules for checks, catalog from parser.c for link, asserted equal); a rule-check phase that walks a splice view of each evaluated stage and calls the same classifier functions collect-slots calls; a gate between the checks and link; the 6b record derivation re-landed on the evaluate-level stages.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, tsx; the sittir CLI (`pnpm exec tsx packages/cli/src/cli.ts`).

**Spec:** `docs/superpowers/specs/2026-09-22-unsupported-shape-diagnostics-design.md` §4 (where diagnostics run) and §5 (records); §1–§3 already landed on `feat/unsupported-shape-diagnostics`.

## Global Constraints

- No check reads link, normalize or assemble output; no check needs the parser's generated id tables.
- Gate: an unresolved final-stage record with a blocking code (`canProceed: false`) not covered by `expectDiagnostics` stops the compile before link.
- Non-blocking codes (`union-slot-routed`) are recorded, never gated.
- `expectDiagnostics` floors only shrink; final-stage floors unchanged or smaller.
- A catalog/prediction disagreement is a predictor bug, fixed in the predictor; never absorbed by moving a floor.
- `ruleProvenance` is required: the owner kind's origin (`upstream` raw-declared, `enrich` enrich-minted, else `wire`).
- Record key `(code, ruleId, slotName?)`, `ruleId` the owner kind's root rule id; all stages use evaluate-time kind names.
- DRY: one inline predicate, one member-shape classifier, one storage-name derivation.
- No source comments in `packages/codegen/src/`; document every new declaration in `docs/glossary/`. No planning/issue numbers in comments or glossary text.
- Refactor tasks (Task 2) are gated on byte-identical regen for all five grammars.
- Commits use pathspecs (`git commit -- <paths>`); a failed gate is preserved for review, never reverted.
- Three-way verification before every commit: targeted probes; `sittir validate history` numbers compared; full unit suite with new failures isolated by stash-and-rerun.

## Review Focus

- A hidden rule that references itself through an inlined chain: the splice view must terminate (reuse `cyclicInlineTargets`), not recurse. Test in Task 3.
- An aliased hidden rule (`alias($._x, $.x)` everywhere): predicted `isHidden` is false exactly where the catalog says `alias === true`. Test in Task 2.
- An external token without an underscore and no rule body: predicted `isVisibleExternal` true, matching the catalog. Test in Task 2.
- An owner floored for one blocking code that also fires an unfloored blocking code: the compile still stops before link. Test in Task 5.
- A patch that resolves a lift-owned key through a lift renamed by a variant hoist (ts `export_statement_arm5`): the record's `resolvedBy.by` names that patch. Test in Task 6.

---

### Task 1: Diagnose the two live invariants

The spec makes the derive-shape postconditions assertions; two fire today. Each needs its grammar-level cause mapped to a §4.2 check before Task 5 turns them into assertions.

**Files:**
- Read only: `packages/codegen/src/compiler/diagnostics/derive-shapes.ts`, `packages/codegen/src/compiler/collect-slots.ts`
- Modify: `docs/superpowers/plans/2026-09-26-diagnostics-at-evaluate.md` (record the findings under this task)

**Interfaces:**
- Produces: for each of scm `seq-with-nested-seq` and rust `choice-with-multiple-arm-shapes`, the owner kind, the evaluated rule shape that produces it, and the §4.2 code that reports that shape (existing, or a new code named here and implemented in Task 3).

- [ ] **Step 1: Reproduce both**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics -g scm` and `-g rust`
Expected: one `seq-with-nested-seq` (scm) and one `choice-with-multiple-arm-shapes` (rust) in the output, with owner kinds.

- [ ] **Step 2: Trace each to its evaluated rule**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool probe-kind -g <grammar> --kind <owner>` and read the evaluated body. Identify which normalize step should have flattened the shape and why it did not.

- [ ] **Step 3: Record the finding and stop for review**

Write under this task: owner, shape, why normalize leaves it, and the check that reports it. Send it to sittir-brainstorm and wait for the ruling before Task 5.

---

### Task 2: One inline predicate over a SymbolSource; link asserts the prediction

**Files:**
- Modify: `packages/codegen/src/dsl/rule-patterns.ts` (`SymbolSource`, `predictedSymbolSource`, `symbolSourceOf`; move `inlinesAtReference` here)
- Modify: `packages/codegen/src/compiler/diagnostics/*` home of `catalogSymbolSource` (extend it)
- Modify: `packages/codegen/src/compiler/link.ts` (`inlinesAtReference`, `ReferenceInlineCtx`, `isModelableKind`, `stampParserVisibility`, `collapseRenamedRules`)
- Test: `packages/codegen/src/dsl/__tests__/symbol-source.test.ts` (create)
- Docs: `docs/glossary/dsl.md`, `docs/glossary/compiler.md`

**Interfaces:**
- Produces:

```ts
export interface SymbolSource {
	readonly rules: Readonly<Record<string, AnyRule>>;
	readonly externals: ReadonlySet<string>;
	readonly isTerminal: (name: string) => boolean;
	readonly isInlined: (name: string) => boolean;
	readonly isHidden: (name: string) => boolean;
	readonly isSupertype: (name: string) => boolean;
	readonly isVisibleExternal: (name: string) => boolean;
}
export interface InlineAtReferenceCtx {
	readonly symbols: SymbolSource;
	readonly inlineNames: ReadonlySet<string>;
	readonly selfReferencing: Map<string, boolean>;
}
export function inlinesAtReference(name: string, ctx: InlineAtReferenceCtx): boolean;
export function predictedRenames(rules: Readonly<Record<string, AnyRule>>, symbols: SymbolSource): ReadonlyMap<string, string>;
export function assertPredictionAgrees(predicted: SymbolSource, catalog: SymbolSource, renames: { predicted: ReadonlyMap<string, string>; catalog: ReadonlyMap<string, string> }): void;
```

`isHidden` is the parser's hiddenness excluding an aliased hidden rule (today `parserHiddenOf`: `entry.alias !== true && entry.hidden === true`). `isVisibleExternal` is today's `findOwnKindEntry(...).visibleExternal`. `assertPredictionAgrees` throws one error listing every `(fact, name, predicted, catalog)` disagreement over all rule names and externals.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { predictedSymbolSource, inlinesAtReference } from '../rule-patterns.ts';
import { blank, choice, seq, sym, str, alias } from './rule-builders.ts';

describe('predicted symbol facts', () => {
	const rules = {
		source: seq(sym('_item'), alias(sym('_named'), 'named'), sym('word')),
		_item: choice(str('a'), sym('word')),
		_named: seq(str('('), str(')')),
		word: str('w')
	};
	const symbols = predictedSymbolSource(rules, ['_ext', 'visible_ext'], []);

	it('an aliased hidden rule is not hidden', () => {
		expect(symbols.isHidden('_item')).toBe(true);
		expect(symbols.isHidden('_named')).toBe(false);
	});
	it('an external without an underscore and no body is a visible external', () => {
		expect(symbols.isVisibleExternal('visible_ext')).toBe(true);
		expect(symbols.isVisibleExternal('_ext')).toBe(false);
	});
	it('the inline predicate reads only the source', () => {
		const ctx = { symbols, inlineNames: new Set<string>(), selfReferencing: new Map<string, boolean>() };
		expect(inlinesAtReference('_item', ctx)).toBe(true);
		expect(inlinesAtReference('word', ctx)).toBe(false);
	});
});
```

If `rule-builders.ts` does not exist under `dsl/__tests__/`, use the builders the neighbouring `rule-patterns` tests already import.

- [ ] **Step 2: Run to see it fail**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/symbol-source.test.ts`
Expected: FAIL, `isHidden` / `isVisibleExternal` not a function; `inlinesAtReference` not exported.

- [ ] **Step 3: Implement**

Extend both sources. Move `inlinesAtReference` into `rule-patterns.ts`, rewritten over the source:

```ts
export function inlinesAtReference(name: string, ctx: InlineAtReferenceCtx): boolean {
	const { symbols } = ctx;
	if (symbols.isSupertype(name)) return false;
	const target = symbols.rules[name];
	if (target !== undefined && isSelfReferencing(name, target, ctx)) return false;
	if (ctx.inlineNames.has(name)) return true;
	if (!symbols.isHidden(name)) return false;
	if (symbols.isTerminal(name) && (target !== undefined || symbols.isVisibleExternal(name))) return false;
	return !(target !== undefined && isLiteralChoiceContent(target));
}
```

Link builds `catalogSymbolSource` once per link and passes it; delete link's private copy and `isModelableKind`. `catalogSymbolSource.isTerminal` must keep today's `entry.terminal === true` answer for non-inlined names so the predicate is unchanged.

- [ ] **Step 4: Add the link assertion**

In link, after `collapseRenamedRules` has computed its renames and before stamping visibility, build the predicted source and renames from the evaluated rules and call `assertPredictionAgrees`. Run all five grammars:

Run: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for each of rust, python, typescript, scm, regex.
Expected: no assertion error. If the assertion fires, fix `predictedSymbolSource` / `predictedRenames` until it agrees; if a fact cannot be predicted from the rules, stop and report the name and fact to sittir-brainstorm with the failing state intact.

- [ ] **Step 5: Verify byte-identical and the tests**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/symbol-source.test.ts` → PASS.
Run: `git status --short packages/*/src rust/crates` → only manifests change.
Run: `pnpm run validate:native` → rows unchanged.

- [ ] **Step 6: Glossary and commit**

Add glossary sections for every new or moved declaration. Commit:

```bash
git commit -m "refactor(compiler): one inline predicate over a SymbolSource; link asserts the prediction" -- packages/codegen/src/dsl packages/codegen/src/compiler docs/glossary
```

---

### Task 3: The rule-check phase and the splice view

**Files:**
- Create: `packages/codegen/src/compiler/diagnostics/splice-view.ts`
- Create: `packages/codegen/src/compiler/diagnostics/rule-checks.ts`
- Modify: `packages/codegen/src/compiler/collect-slots.ts` (`resolveMember`, `recordUnclassifiableShape`: detection out, classification shared)
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (storage-name derivation shared; `storagename-collision` at :1601 and `union-slot-content-collision` at :484 become asserted verdicts)
- Modify: `packages/codegen/src/compiler/diagnostics/slot-grouping.ts`, `packages/codegen/src/types/parsekind-collisions.ts`, `packages/codegen/src/compiler/link.ts` (`inline-array-visible-name` at :184, `displayUnions`, `contentAliasedTo` checks)
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/rule-checks.test.ts` (create)

**Interfaces:**
- Consumes: `SymbolSource`, `inlinesAtReference`, `predictedSymbolSource` (Task 2).
- Produces:

```ts
export interface SpliceView {
	body(kind: string): Rule<'evaluate'>;
}
export function spliceView(rules: Readonly<Record<string, Rule<'evaluate'>>>, symbols: SymbolSource): SpliceView;

export interface RuleCheckCtx {
	readonly symbols: SymbolSource;
	readonly view: SpliceView;
	readonly inlineNames: ReadonlySet<string>;
}
export function checkRules(grammar: RawGrammar, ctx: RuleCheckCtx): readonly GrammarDiagnostic[];
```

- [ ] **Step 1: Map the classifier's inputs**

`resolveMember` classifies `SimplifiedRule` (normalize output). List every normalize transform whose result the classifier, the storage-name derivation, `diagnoseSlotGrouping` and `diagnoseParseKindCollisions` depend on (hidden splicing, repeat lowering, flattening, field hoisting). For each, decide: the splice view performs it (by calling the same transform function normalize calls), or the classifier already accepts the unlowered form. Write the table under this task and send it to sittir-brainstorm before Step 3; a transform that would need a second implementation is a stop.

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { checkRules } from '../rule-checks.ts';
import { spliceView } from '../splice-view.ts';
import { predictedSymbolSource } from '../../../dsl/rule-patterns.ts';
import { grammarOf } from './grammar-fixtures.ts';

describe('rule checks over evaluated rules', () => {
	it('reports an unclassifiable member through a spliced hidden kind', () => {
		const grammar = grammarOf({
			host: seq(str('('), sym('_arm'), str(')')),
			_arm: choice(seq(sym('a'), sym('b')), sym('c')),
			a: str('a'), b: str('b'), c: str('c')
		});
		const symbols = predictedSymbolSource(grammar.rules, [], []);
		const found = checkRules(grammar, { symbols, view: spliceView(grammar.rules, symbols), inlineNames: new Set() });
		expect(found).toContainEqual(expect.objectContaining({ code: 'unclassifiable-shape', ownerKind: 'host' }));
	});
	it('terminates on a hidden rule that reaches itself through an inlined chain', () => {
		const grammar = grammarOf({
			host: sym('_a'),
			_a: choice(str('x'), seq(str('('), sym('_b'), str(')'))),
			_b: sym('_a')
		});
		const symbols = predictedSymbolSource(grammar.rules, [], []);
		expect(() => checkRules(grammar, { symbols, view: spliceView(grammar.rules, symbols), inlineNames: new Set() })).not.toThrow();
	});
});
```

Use the fixture helper the existing `grammar-diagnostics.test.ts` uses to build a `RawGrammar`; create `grammar-fixtures.ts` only if none exists.

- [ ] **Step 3: Implement the view and the checks**

`spliceView` walks with `inlinesAtReference`, guarding cycles with `cyclicInlineTargets`. `checkRules` runs every §4.2 family: alias sites (display-union-*, content-alias-noninjective, alias-distributed, parsekind-noninjective), slot shapes (the collect-slots codes, content-collision, multi-slot-nested-seq, storagename-collision, union-slot-content-collision), and `inline-array-visible-name` with predicted visibility. Each check calls the shared classifier / storage-name function; the old emit sites keep the classification and drop the detection.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/rule-checks.test.ts`
Expected: PASS.

- [ ] **Step 5: Parity on the real grammars**

For each grammar, compare `checkRules` on the final evaluated stage with today's final `grammarDiagnostics` restricted to the §4.2 codes, keyed by `(code, ownerKind, slotName)`.
Expected: identical sets. ts `enum_body_elements` and scm `named_node` must not appear (Task 2's assertion guarantees the facts). Any difference: stop, keep the state, report the key and both verdicts to sittir-brainstorm.

- [ ] **Step 6: Glossary and commit**

```bash
git commit -m "feat(compiler): shape checks run over the evaluated rules" -- packages/codegen/src docs/glossary
```

---

### Task 4: single-literal-choice replaces assemble's enum throw

**Files:**
- Modify: `packages/codegen/src/compiler/diagnostics/rule-checks.ts`
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (`AssembledEnum` constructor, the `values.length < 2` throw at ~:1964)
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/rule-checks.test.ts`

**Interfaces:**
- Consumes: `checkRules` (Task 3).
- Produces: code `single-literal-choice`, blocking, owner = the enum-classified kind, message naming the resolving form (`variant(...)` per arm, as ts `grammar.sittir.ts:680` does).

- [ ] **Step 1: Find the predicate**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics -g typescript --stage raw` and trace why upstream `meta_property` (`choice(seq('new','.','target'), seq('import','.','meta'))`) is enum-classified yet yields fewer than two `values`. State the rule-level predicate that is exactly "assemble would build an `AssembledEnum` with fewer than two values" and record it under this task.

- [ ] **Step 2: Write the failing test**

```ts
it('reports a literal choice that reduces to fewer than two values', () => {
	const grammar = grammarOf({
		host: sym('meta'),
		meta: choice(seq(str('new'), str('.'), str('target')), seq(str('import'), str('.'), str('meta')))
	});
	const symbols = predictedSymbolSource(grammar.rules, [], []);
	expect(checkRules(grammar, { symbols, view: spliceView(grammar.rules, symbols), inlineNames: new Set() })).toContainEqual(
		expect.objectContaining({ code: 'single-literal-choice', ownerKind: 'meta', canProceed: false })
	);
});
```

Adjust the fixture to the predicate found in Step 1 so it reproduces the same classification.

- [ ] **Step 3: Implement; assemble asserts**

Add the check. Change the `AssembledEnum` throw's message to state it is unreachable past the gate (`single-literal-choice`), keeping it a throw.

- [ ] **Step 4: Run tests; the ts raw stage now yields records**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/rule-checks.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(compiler): single-literal-choice is a rule check" -- packages/codegen/src docs/glossary
```

---

### Task 5: The gate and the reclassification

**Files:**
- Modify: `packages/codegen/src/compiler/compile.ts` (order: evaluate → `checkRules` → gate → link)
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` (`collectGrammarDiagnosticsForGrammar` no longer links/normalizes/assembles; `isBlockingAssembleWarningCode` goes)
- Modify: the owners of the §4.4 invariants (each becomes a throw in its phase), `typename-collision` (naming event), `kindid-*` (post-generate ratchet only)
- Test: `packages/codegen/src/compiler/__tests__/generate-diagnostics-gate.test.ts`

**Interfaces:**
- Consumes: `checkRules` (Tasks 3–4); Task 1's findings.
- Produces: `assertGatePasses(records: readonly GrammarDiagnostic[], floors: ExpectDiagnostics): void`, throwing the existing blocking-diagnostics error before link.

- [ ] **Step 1: Write the failing tests**

```ts
it('stops before link on an unfloored blocking record', async () => {
	const link = vi.spyOn(linkModule, 'link');
	await expect(compileFixture({ blocking: ['unclassifiable-shape'], floors: {} })).rejects.toThrow(/unclassifiable-shape/);
	expect(link).not.toHaveBeenCalled();
});
it('a floor for one code does not cover another code on the same owner', async () => {
	await expect(
		compileFixture({ blocking: ['unclassifiable-shape', 'union-slot-mixed-row'], floors: { 'unclassifiable-shape': ['host'] } })
	).rejects.toThrow(/union-slot-mixed-row/);
});
it('a non-blocking record never stops the compile', async () => {
	await expect(compileFixture({ nonBlocking: ['union-slot-routed'], floors: {} })).resolves.toBeDefined();
});
```

Build `compileFixture` on the helpers `generate-diagnostics-gate.test.ts` already uses.

- [ ] **Step 2: Run to see them fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/generate-diagnostics-gate.test.ts` → FAIL (link runs first).

- [ ] **Step 3: Implement the gate and move the codes**

Gate as in the spec §4.1. Invariants become throws in their owning phase, applying Task 1's ruling for the two live ones. `typename-collision` moves to codegen output as a naming event. `kindid-*` leave `grammarDiagnostics` and stay in the phantom-kind ratchet. Delete `upstream-compile-failed` and every per-stage compile.

- [ ] **Step 4: Run the tests and all five grammars**

Run the gate test → PASS. Regen all five → generated sources unchanged; final floors unchanged or smaller; `pnpm run validate:native` rows unchanged.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(compiler): link is gated on unresolved blocking diagnostics" -- packages/codegen/src packages/*/grammar.sittir.ts docs/glossary
```

---

### Task 6: Re-land the 6b records on the evaluate stages

**Files:** the parked 6b changes (coordinate's worktree): `deriveDiagnosticRecords`, `recordLiftRewrite` via `wireSetLiftBody` and `wireRenameLift`, `UpstreamStages`, labels from records, `override-census`, `--stage raw|enriched`. Drop `compileStage` and the collapse-rename canonicalization.

**Interfaces:**
- Consumes: `checkRules` per stage (Task 3); the gate (Task 5).
- Produces: `Compilation.diagnosticRecords: readonly DiagnosticRecord[]` with the spec §5 shape; `stageDiagnostics { raw, enriched, final }` with `final` the same object as `grammarDiagnostics`.

- [ ] **Step 1: Rebase the parked work onto Tasks 2–5**

Replace every stage compile with `evaluate` + `checkRules`. `ruleOrigin` loses its `undefined` paths; delete the "provenance is absent when the raw stage failed" test.

- [ ] **Step 2: Write the renamed-lift test**

```ts
it('a patch through a lift renamed by a variant hoist claims the lift-owned key', async () => {
	const records = await recordsFor('typescript');
	const key = records.find((r) => r.ownerKind === 'export_statement_arm5' && r.resolved);
	expect(key?.resolvedBy?.by).toContainEqual(expect.objectContaining({ patch: expect.objectContaining({ ownerKind: 'export_statement' }) }));
});
```

If `export_statement_arm5` owns no resolved key after Task 3, pick the renamed-lift key the census shows and name it here.

- [ ] **Step 3: Census and glossary**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool override-census` for all five. Send sittir-brainstorm: counts by provenance and resolved/unresolved per grammar, and the lift-owned keys with their claiming sites. Correct the `labelPatchSites` glossary claim; mark python's enriched records provisional (adopted groups).

- [ ] **Step 4: Regenerate the CLI glossary and commit**

Regenerate `docs/cli-command-glossary.md` from the commander tree (never hand-edit).

```bash
git commit -m "feat(compiler): diagnostic records over the evaluated stages" -- packages/codegen/src packages/cli packages/tools docs
```

---

### Task 7: Ratchet and PR

The plan's earlier Task 7 (ratchet + PR for `feat/unsupported-shape-diagnostics`), unchanged, run after Task 6 with the spec's §6 acceptance list as the PR checklist.
