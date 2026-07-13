# Hidden-repeat-helper visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the subset of 19 hidden-repeat-helper kinds (rust 11, typescript 3, python 5) that genuinely need it from `AssembledMulti`'s dead-end classification to `AssembledSeparatedList`'s real render/wrap/factory support, so their optional trailing/leading separators and nonterminal separators actually round-trip correctly.

**Architecture:** Two independent tracks converge on the same underlying mechanism (tree-sitter's `alias()` primitive making a hidden kind visible). Track A (16 sittir-enrich-synthesized kinds) qualifies `isInlineSafe`'s repeat early-returns so separator-variable repeats fall through to the existing hidden-rule+alias visible-promotion path `applyClauseHoist` already uses for choice bodies. Track B (3 grammar-authored python kinds) uses hand-authored `alias()` override declarations directly. Both tracks are gated behind two empirical pre-flight checks (reachability, alias-distribution-safety) before any kind is actually promoted.

**Tech Stack:** TypeScript (codegen compiler), tree-sitter grammar DSL (enrich/override layer), Rust (native parser/transport, via `cargo check`), vitest, the project's own `validate:native` round-trip harness.

## Global Constraints

- DRY is the #1 rule.
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `overrides.suggested.ts`) — fix `codegen/` source or `overrides.ts` and regenerate.
- No casts to clear type errors — fix the real type.
- Every codegen-source-touching task must regenerate all 3 grammars and stage the regenerated manifest/fixtures before committing.
- `validate:native` output changes land in dedicated `chore(validator)` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace --features napi-bindings` cleanly.
- Given this touches parser output for potentially up to 19 kinds across 3 grammars: **every** codegen-source-touching or regen-touching task must run the FULL `validate:native` sweep (never a targeted subset) and treat any unexplained regression as stop-and-investigate, not a byte-diff to wave through.
- Run tsgo with explicit flags only: `tsgo --noEmit -p <tsconfig>.json` (never bare `tsgo`) — a repo pre-commit hook enforces this.
- Known-good baseline (reconfirm fresh before Task 1's changes, via `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native`): `read-render-parseAstMatchPass` holds exactly rust=117, typescript=76, python=102, as of commit `7a46f0d02`. Any pre-existing tsgo/vitest failure must be confirmed pre-existing via a `git stash` A/B comparison (stash everything, re-run, compare failure sets) before being dismissed as out of scope — never dismissed on raw counts alone.
- Worktree: `/private/tmp/sittir-worktrees/pr-t`, branch `non-slot-separator-rules` (already set up — do not create a new worktree).

---

### Task 1: Reachability pre-flight — pilot promotion of one representative kind

**Files:**
- Modify (temporarily, reverted at end of task): `packages/codegen/src/dsl/enrich.ts`
- Read: `packages/codegen/src/dsl/group-classify.ts` (`isInlineSafe`, lines 203-252)
- Read: `packages/codegen/src/dsl/enrich.ts` (`applyClauseHoist` lines 1339-1497, `clauseHoistSynthName` lines 1511-1543, `visibleGroupSynthName` lines 1568-1597, `makeVisibleGroupAlias` lines 1678-1686, `listSeparatorOfOptionalSeq`, `peelOptionalSeq`, `absorbTrailingListSeparators` lines 1305-1321)

**Why this task exists:** This plan's two pre-flight checks (reachability, alias-distribution-safety) are NOT separable — you cannot observe whether promoting a kind changes real corpus behavior without also performing the actual grammar-level visibility promotion (the alias), and you cannot observe whether that alias distributes across repeat elements without picking a real kind to promote. This task does both at once, on ONE representative kind, before committing the strategy to the remaining 18.

**Interfaces:**
- Consumes: nothing from earlier tasks (this is the first task).
- Produces: a definitive answer to "does aliasing a symbol reference to a repeat-shaped hidden rule produce one clean container node, or does it distribute across elements" — this determines whether Task 3 uses the alias-reuse strategy (as designed) or a fallback (a plain visible rename with no alias at all, if aliasing turns out to distribute even via symbol-reference indirection). Also produces a real, observed example of the exact DSL rule shape `isInlineSafe` receives for a genuine `_${parentKind}_optionalN` clause-hoisted kind — needed because Task 3's qualification check must operate on ENRICH-phase (pre-link) rule shapes, not the post-link `SeparatorFlankMode` tri-state this plan's originating design dialogue discussed (that tri-state doesn't exist yet at enrich time).

- [ ] **Step 1: Pick the pilot kind and confirm its current classification**

Pilot kind: rust's `_parameters_optional1` (backs `formal_parameters`'s optional-flank list — named directly in the design doc's mechanism section as the representative example).

Run:
```bash
cd /private/tmp/sittir-worktrees/pr-t
sed -n '2320,2340p' packages/rust/src/node-model.json5
```
Confirm the dumped entry shows `"kind": "_parameters_optional1"`, `"modelType": "multi"`, `"hidden": true`, and a `"trailing"` or `"leading"` field set to `"optional"` (or a nonterminal `"separator"`). If the exact kind name/line range has shifted since this plan was written, find it via:
```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/rust/src/node-model.json5', 'utf8');
const idx = content.indexOf('_parameters_optional1');
console.log(content.slice(idx - 50, idx + 300));
"
```

- [ ] **Step 2: Dump the exact rule shape `isInlineSafe` sees for this kind at enrich time**

Add a temporary diagnostic directly inside `isInlineSafe` (`packages/codegen/src/dsl/group-classify.ts`), at the very top of the function body:

```ts
export function isInlineSafe(seqBody: unknown): boolean {
	if (process.env.SITTIR_DIAG_INLINE_SAFE && JSON.stringify(seqBody).includes('parameter')) {
		console.error('DIAGNOSTIC isInlineSafe input:', JSON.stringify(seqBody, null, 2).slice(0, 2000));
	}
	if (!seqBody || typeof seqBody !== 'object') return false;
	// ... rest of function unchanged
```

Run:
```bash
SITTIR_DIAG_INLINE_SAFE=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src 2>&1 | grep -A 40 "DIAGNOSTIC isInlineSafe input" | head -80
```

Read the dumped shape carefully. Confirm: (a) whether the body is a bare `repeat`/`repeat1` (hits `isRepeatLike(t)`) or a `seq` containing a nested repeat (hits `seqHasTopLevelRepeat`), and (b) what the separator member actually looks like at THIS phase — it will NOT have a `.separator.trailing`/`.leading` tri-state field (that's stamped later, in `link.ts`, well after enrich runs); instead the flank will appear as a raw DSL shape, most likely an `optional(STRING)` or `optional(CHOICE(...))` member adjacent to the repeat, or a `repeat(seq(content, optional(SEP)))`-style nesting. Note the exact shape observed — Task 3 depends on this.

- [ ] **Step 3: Remove the diagnostic**

Revert the `console.error` block added in Step 2. Confirm clean:
```bash
git diff --stat -- packages/codegen/src/dsl/group-classify.ts
```
Expected: no output (file back to committed state).

- [ ] **Step 4: Perform the real pilot promotion**

Using the exact shape observed in Step 2, write a **temporary, hardcoded** override directly in `applyClauseHoist` (`packages/codegen/src/dsl/enrich.ts`) that forces `_parameters_optional1` specifically through the visible-alias path instead of the hidden-clause path, regardless of `isInlineSafe`'s normal verdict. Locate the branch at enrich.ts:1372 (`else if (isInlineSafe(recursedSeqBody))`) and temporarily change the condition to:

```ts
} else if (isInlineSafe(recursedSeqBody) && parentKind !== 'parameters') {
```

(Adjust `parentKind !== 'parameters'` to match whatever the actual enclosing `parentKind` value is for `_parameters_optional1` — confirm this from the Step 2 dump or by adding a one-line `console.error(parentKind)` right before the branch if unclear.)

- [ ] **Step 5: Regenerate rust and inspect the resulting CST structure**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
```

Confirm the regen diff shows `_parameters_optional1` no longer appearing as a `'multi'`-classified entry, and instead a new visible kind (something like `parameters_group1` or similar, per `visibleGroupSynthName`'s naming) appears in `packages/rust/src/node-model.json5`.

Then, using a small real rust source snippet with a function signature that has a trailing comma in its parameter list (e.g. `fn foo(a: i32, b: i32,) {}`), run the probe tool to inspect the actual parsed CST shape:

```bash
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar rust --kind parameters_group1 --source 'fn foo(a: i32, b: i32,) {}' 2>&1 | head -60
```

(If `probe-kind` doesn't accept a `--source` flag directly, check `pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --help` for the correct invocation — it may require a fixture file path instead. Use whichever form the tool's `--help` documents.)

**Interpretation — this is the load-bearing check:**
- **PASS (alias-reuse strategy confirmed safe):** the probe shows ONE clean node named after the new visible kind, with the parameter list's elements as ITS children (including the trailing comma token as a child of that ONE node).
- **FAIL (distribution occurred):** the probe shows multiple sibling nodes each individually named after the new visible kind (one per parameter), OR a parse/AST-mismatch error citing the parameters list. If this happens: STOP. Do not proceed to Task 3 as designed. Instead, change strategy for Track A: synthesize the promoted kind under a plain visible name directly (no hidden backing rule, no `alias()` wrapper at all) inside `clauseHoistSynthName`'s sibling logic. Document this pivot explicitly in the task-1 report and flag it for the plan's remaining tasks before continuing.

- [ ] **Step 6: Run the full validate:native sweep and confirm no unrelated regression**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | tail -80
```

Compare rust's `read-render-parseAstMatchPass` against the 117 baseline. Because `_parameters_optional1` is now genuinely visible and captured, expect either: (a) the count holds at 117 (this kind's flank was already rendering correctly by accident, or no corpus fixture exercises the trailing-comma-present case) — in which case this pilot kind counts as **reachable-but-currently-inert for this corpus**, not necessarily dead; or (b) the count changes — investigate whether it's an improvement (a previously-wrong trailing-comma case now round-trips) or a regression (stop and investigate per Global Constraints).

- [ ] **Step 7: Revert the pilot change and record findings**

```bash
git diff --stat -- packages/codegen/src/dsl/enrich.ts packages/rust/src packages/rust/.sittir rust/crates/sittir-rust
git checkout -- packages/codegen/src/dsl/enrich.ts packages/rust/src packages/rust/.sittir rust/crates/sittir-rust
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | grep "read-render-parseAstMatchPass"
```
Confirm rust is back to exactly 117 before proceeding. Write down in the task report: (1) the exact enrich-phase rule shape observed in Step 2 (verbatim JSON), (2) whether the alias-distribution check passed or failed, (3) the validate:native delta observed in Step 6, (4) the exact `parentKind` value and branch condition used in Step 4 (needed verbatim by Task 3).

- [ ] **Step 8: Commit nothing — this is a pure investigation task**

No commit for this task (everything is reverted). The task report (findings from Step 7) is the deliverable, carried forward into Task 2/3's dispatch context.

---

### Task 2: Reachability check for the remaining 18 kinds (lightweight, shape-based)

**Files:**
- Modify (temporarily, reverted at end of task): `packages/codegen/src/compiler/assemble.ts`

**Interfaces:**
- Consumes: nothing structural from Task 1 (this uses a different, cheaper technique — full per-kind promotion+corpus-diff as in Task 1 is too expensive to repeat 18 times; this task checks grammar-shape liveness only, mirroring how `liftCommaSep`'s original Case 3 and `tryFusePair`'s Idiom B were confirmed dead earlier this session — by checking whether the shape is EVER actually constructed during a real 3-grammar regen, not by checking corpus round-trip behavior).
- Produces: a live/dead list for the remaining 18 kinds (rust's other 10, typescript's 3, python's `_collection_elements`/`_patterns`/`_argument_list_optional1`/`_dictionary_optional1` — `_parameters` in python, if present as a 19th distinct occurrence beyond the rust one already piloted, is included here too). This list scopes Tasks 3 and 5 to only the kinds confirmed non-dead.

- [ ] **Step 1: Add a temporary per-kind diagnostic in `classifyNode`**

In `packages/codegen/src/compiler/assemble.ts`, locate the dispatch (around line 1592):
```ts
if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
if (isSeparatedListShape(rule)) return 'separatedList';
```
Temporarily change to:
```ts
if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) {
	if (isSeparatedListShape(rule)) {
		console.error(`DIAGNOSTIC-LIVE: ${kind} — separator=${JSON.stringify((rule as { separator?: unknown }).separator)}`);
	}
	return 'multi';
}
if (isSeparatedListShape(rule)) return 'separatedList';
```

- [ ] **Step 2: Regenerate all 3 grammars and capture every diagnostic line**

```bash
for g in rust typescript python; do
  echo "=== $g ===";
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src 2>&1 | grep "DIAGNOSTIC-LIVE";
done
```

Every one of the 19 kinds is EXPECTED to print here (this just reconfirms the closed set from the design doc — if the count doesn't match 19, STOP and investigate why before continuing; the design doc's scope claim depends on this staying exactly 19).

- [ ] **Step 3: For each kind, confirm the separator fact is non-trivially variable**

For each `DIAGNOSTIC-LIVE` line, inspect the printed `separator` value:
- If `separator.trailing === 'optional'` or `separator.leading === 'optional'` or the separator's `.value` is a nonterminal (`CHOICE`/`SYMBOL`/`PATTERN` type rather than a bare `STRING`) — this kind is **live** (genuinely variable at the grammar level; matches this plan's promotion criteria).
- If none of the above hold (shouldn't happen given `isSeparatedListShape`'s own gating, but confirm defensively) — flag as an anomaly and investigate before including in Task 3/5's scope.

Record the final live-kind list (expect close to all 19, since `isSeparatedListShape` already gates on exactly this condition — this step is a confirmation pass, not expected to prune many).

- [ ] **Step 4: Revert the diagnostic**

```bash
git diff --stat -- packages/codegen/src/compiler/assemble.ts
git checkout -- packages/codegen/src/compiler/assemble.ts
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src
done
git status --short
```
Confirm only `.sittir/generated.manifest.json` / fixture noise remains from the regen, and `assemble.ts` itself shows no diff. Discard any regen noise:
```bash
git checkout -- packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
```

- [ ] **Step 5: No commit — record the live-kind list in the task report**

Carry the confirmed live-kind list forward as the exact scope for Tasks 3 and 5.

---

### Task 3: `isInlineSafe` qualification (Track A mechanism)

**Files:**
- Modify: `packages/codegen/src/dsl/group-classify.ts` (`isInlineSafe`, lines 203-252)
- Test: `packages/codegen/src/dsl/__tests__/group-classify.test.ts` (create if it doesn't already exist — check first: `ls packages/codegen/src/dsl/__tests__/ | grep group-classify`)

**Interfaces:**
- Consumes: Task 1's confirmed enrich-phase rule shape (the exact DSL shape a genuine `_${parentKind}_optionalN` separator-variable repeat body takes at the point `isInlineSafe` examines it) and Task 1's alias-distribution verdict (if Task 1 found distribution occurs, this task's approach changes — see the note below). Consumes Task 2's live-kind list to scope which kinds this change is expected to affect.
- Produces: `isInlineSafe(seqBody: unknown): boolean` with the SAME signature, now returning `false` (not inline-safe) for a repeat-shaped body that has genuine separator variability, gated using the enrich-phase-appropriate shape check confirmed in Task 1 (most likely built on `detectRepeatSeparator`/`listSeparatorOfOptionalSeq`-style primitives from `dsl/list-patterns.ts`, since those are the primitives already used for exactly this kind of pre-link separator-shape detection at enrich time).

  **Explicitly NOT `isSeparatedListShape`** (`compiler/assemble.ts`). This isn't just "a different phase" — it's a different *rule representation*. By the time `isSeparatedListShape` runs in `assemble()`, `wrapper-deletion.ts` has already flattened the rule: `optional`/`repeat`/`field` wrapper *nodes* are gone, pushed down into leaf attributes (`multiplicity`, `separator.trailing`/`.leading` as the resolved `SeparatorFlankMode` tri-state, stamped by `link.ts`). `isInlineSafe`/`applyClauseHoist` at enrich time see the DSL shape *before* any of that: `optional(...)`/`repeat(...)`/`seq(...)` still exist as distinct structural wrapper nodes, and there is no `SeparatorFlankMode` field anywhere yet — separator variability at this phase can only be read off the raw wrapper shape itself (e.g., is there an `optional(SEP)` member adjacent to the repeat; is the separator a `CHOICE` rather than a bare `STRING`). `isSeparatedListShape`'s logic cannot be reused verbatim — it is checking properties (`.separator.trailing === 'optional'`) that don't exist yet on a wrapper-intact enrich-phase rule. The new helper below must be its own, wrapper-aware check, built on `list-patterns.ts`'s primitives (which already operate on this exact wrapper-intact shape, per their own module doc comment: "Pre-pushdown only... enrich/wire/evaluate/link/normalize"), not a call-through to assemble-phase logic.

- [ ] **Step 1: Write the failing test using Task 1's confirmed shape**

Using the EXACT rule shape recorded in Task 1's report (Step 2's diagnostic dump), write a test that constructs that same shape directly and asserts `isInlineSafe` now returns `false` for it, while a plain (non-separator-variable) repeat body still returns `true`:

```ts
import { describe, expect, it } from 'vitest';
import { isInlineSafe } from '../group-classify.ts';
import { CHOICE, FIELD, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts

describe('isInlineSafe — separator-variable repeat qualification', () => {
	it('returns true for a plain repeat body with no separator variability (unchanged baseline behavior)', () => {
		const body = {
			type: REPEAT,
			content: { type: SYMBOL, name: 'member' }
		};
		expect(isInlineSafe(body)).toBe(true);
	});

	// Replace this fixture with the EXACT shape recorded in Task 1 Step 2's
	// diagnostic dump — the shape below is a placeholder illustrating the
	// expected general form (an optional flank member adjacent to a repeat)
	// and MUST be corrected to match what Task 1 actually observed before
	// this test is considered complete.
	it('returns false for a repeat body with a genuinely optional trailing flank', () => {
		const body = {
			type: SEQ,
			members: [
				{ type: SYMBOL, name: 'member' },
				{
					type: REPEAT,
					content: {
						type: SEQ,
						members: [{ type: STRING, value: ',' }, { type: SYMBOL, name: 'member' }]
					}
				},
				{ type: 'OPTIONAL', content: { type: STRING, value: ',' } }
			]
		};
		expect(isInlineSafe(body)).toBe(false);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/group-classify.test.ts
```
Expected: the first test (plain repeat) passes already; the second (separator-variable) FAILS, since today's `isInlineSafe` returns `true` unconditionally for any repeat-shaped body.

- [ ] **Step 3: Implement the qualification**

Modify `isInlineSafe` in `packages/codegen/src/dsl/group-classify.ts`. The exact shape check must be built from what Task 1 observed — do not guess. As a starting point (to be corrected against Task 1's actual finding), the general form is:

```ts
import { detectRepeatSeparator } from './list-patterns.ts';
// ... existing imports

export function isInlineSafe(seqBody: unknown): boolean {
	if (!seqBody || typeof seqBody !== 'object') return false;
	const r = seqBody as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isRepeatLike(t)) {
		return !repeatHasGenuineSeparatorVariability(seqBody as RuntimeRule);
	}

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	if (seqHasTopLevelRepeat(members)) {
		return !seqHasGenuineSeparatorVariability(members as RuntimeRule[]);
	}

	// ... rest of function unchanged (single-slot field/symbol check)
}
```

Where `repeatHasGenuineSeparatorVariability`/`seqHasGenuineSeparatorVariability` are new local helpers in the same file, built directly on `detectRepeatSeparator` (checking whether the detected separator is a nonterminal (`CHOICE`/`SYMBOL`/`PATTERN` type) rather than a bare literal `STRING`) plus a check for an adjacent `optional(SEP)` flank member (mirroring the shape `absorbTrailingListSeparators`/`peelOptionalSeq` already recognize elsewhere in `enrich.ts` — read those two functions in full before implementing, since they already solve the "is there an optional(sep) flank adjacent to this repeat" detection at this exact compiler phase, and this new helper should reuse rather than reimplement that logic).

**If Task 1 found alias-distribution FAILS** (the pilot's Step 5 probe showed distributed nodes): do not implement the qualification as above. Instead, the promotion mechanism itself changes — `applyClauseHoist`'s inline-unsafe branch would need a NEW variant that synthesizes a plain visible rule name directly (no hidden backing rule, no `alias()` call at all) for repeat bodies specifically. This is a materially different, larger change; stop and re-plan this task specifically rather than proceeding with the code above.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/group-classify.test.ts
```
Expected: both tests PASS.

- [ ] **Step 5: Run the full existing `group-classify`/`enrich` test suites to confirm no regression on the majority-case (non-separator-variable) repeat kinds**

```bash
pnpm exec vitest run packages/codegen/src/dsl/
```
Expected: all pass. Any new failure here means the qualification is too broad (catching plain list kinds it shouldn't) — narrow the detection before proceeding.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/group-classify.ts packages/codegen/src/dsl/__tests__/group-classify.test.ts
git commit -m "$(cat <<'EOF'
fix(codegen): isInlineSafe no longer auto-hides separator-variable repeat bodies

isInlineSafe's early returns for repeat-shaped bodies applied
unconditionally, regardless of whether the list has genuine per-instance
separator variability (a nonterminal separator, or an optional
leading/trailing flank). This kept such kinds on the hidden
AssembledMulti path with zero wrap/render support for their separator,
even though AssembledSeparatedList (7a46f0d02) already exists to handle
exactly this case.

Qualifies both early returns so a separator-variable repeat body falls
through to the existing visible-promotion path applyClauseHoist already
uses for multi-slot/choice bodies (visibleGroupSynthName +
makeVisibleGroupAlias) — reusing the alias() mechanism rather than
building anything new.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PB3y6LJeeKgTbtCpJccVYn
EOF
)"
```

---

### Task 4: Regenerate all 3 grammars and run the full validate:native sweep for Track A

**Files:**
- Regenerate: `packages/rust/src`, `packages/typescript/src`, `packages/python/src` (and their `.sittir/generated.manifest.json`)
- Regenerate: `rust/crates/sittir-{rust,typescript,python}/test-fixtures.json`

**Interfaces:**
- Consumes: Task 3's `isInlineSafe` change, Task 2's live-kind list (to know which specific kinds to check the regen diff against).

- [ ] **Step 1: Regenerate all 3 grammars**

```bash
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src
done
```

- [ ] **Step 2: Confirm each of Task 2's live Track-A kinds now classifies as a new visible kind, not `'multi'`**

For each kind in the live list (e.g. `_parameters_optional1`, `_export_clause_optional1`, etc.), grep its NEW entry in the corresponding grammar's `node-model.json5`:
```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/rust/src/node-model.json5', 'utf8');
console.log(content.includes('_parameters_optional1') ? 'STILL HIDDEN (unexpected)' : 'PROMOTED (expected)');
"
```
Repeat per kind, per grammar. Any kind still showing its OLD hidden name unexpectedly means Task 3's qualification didn't catch it — investigate before proceeding (likely means the shape-detection helper needs widening to match that specific kind's exact DSL structure).

- [ ] **Step 3: `cargo check`**

```bash
cargo check --workspace --features napi-bindings
```
Expected: clean.

- [ ] **Step 4: Full `validate:native` sweep**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | tail -100
```
Compare against the 117/76/102 baseline. Any change (up OR down) on `read-render-parseAstMatchPass` must be explained per-kind before proceeding — an increase is expected (previously-broken trailing/leading cases now round-trip); any decrease is a stop-and-investigate signal, not something to wave through.

- [ ] **Step 5: Run the full codegen vitest suite and diff the failure set against baseline**

```bash
pnpm exec vitest run packages/codegen/src/ > /tmp/vitest-after-task4.txt 2>&1
git stash push -u -m "task4-baseline-check"
pnpm exec vitest run packages/codegen/src/ > /tmp/vitest-baseline-task4.txt 2>&1
git stash pop
diff <(grep "^ FAIL" /tmp/vitest-baseline-task4.txt | sort -u) <(grep "^ FAIL" /tmp/vitest-after-task4.txt | sort -u)
```
Expected: no new failures (the diff should be empty, or show only pre-existing failures on both sides). If `git stash pop` reports a conflict due to build-artifact (`dist/`) noise, discard `packages/{python,rust}/dist` and `packages/python/tsconfig.build.tsbuildinfo` first via `git checkout --`, then re-pop — this is a known, previously-encountered issue with this repo's vitest setup script.

- [ ] **Step 6: Stage and commit the regenerated output as a dedicated chore(validator) commit**

```bash
git add packages/rust/src packages/typescript/src packages/python/src \
  packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json \
  rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "$(cat <<'EOF'
chore(validator): regenerate all 3 grammars after isInlineSafe qualification

Promotes Track A's separator-variable hidden-repeat-helper kinds to
visible AssembledSeparatedList kinds. validate:native: rust=<N>,
typescript=<N>, python=<N> read-render-parseAstMatchPass (record actual
observed numbers here, replacing the baseline 117/76/102 with whatever
Step 4 confirmed).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PB3y6LJeeKgTbtCpJccVYn
EOF
)"
```

---

### Task 5: Track B — `alias()` override declarations for the 3 grammar-authored python kinds

**Files:**
- Modify: `packages/python/overrides.ts`
- Test: `packages/python/tests/nodes.test.ts` (existing file — add new cases; do not touch unrelated pre-existing modifications already present in this file from earlier work)

**Interfaces:**
- Consumes: Task 2's live-kind list, scoped to whichever of `_collection_elements`/`_parameters`/`_patterns` were confirmed live.
- Produces: visible `parameters`/`patterns`/`collection_elements` (or whatever exact visible names are chosen) kinds in python's generated output, classified `'separatedList'`.

- [ ] **Step 1: Read the current `packages/python/overrides.ts` in full to find each kind's current reference sites**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/python/overrides.ts', 'utf8');
['_collection_elements', '_parameters', '_patterns'].forEach(name => {
  const idx = content.indexOf(name);
  console.log(name, '->', idx === -1 ? 'NOT FOUND in overrides.ts (grammar-authored, not yet overridden)' : 'found at ' + idx);
});
"
```
For whichever of the 3 are confirmed live per Task 2, each needs an `alias()` declaration added. If a kind has no existing override entry, add a new one; if it already has an override for an unrelated reason, extend that same override.

- [ ] **Step 2: Write the failing test**

For each live kind (example shown for `_parameters`), add to `packages/python/tests/nodes.test.ts`:

```ts
describe('parameters (promoted from hidden _parameters)', () => {
	it('renders correctly with a trailing comma present', () => {
		const node = ir.parameters([ir.identifier('a'), ir.identifier('b')], { trailing: true });
		expect(node.$render!()).toBe('a, b,');
	});

	it('renders correctly with no trailing comma', () => {
		const node = ir.parameters([ir.identifier('a'), ir.identifier('b')]);
		expect(node.$render!()).toBe('a, b');
	});
});
```

(Adjust the exact factory call shape — `ir.parameters(...)` — to match whatever `AssembledSeparatedList`'s actual construct/factory surface generates for this kind once promoted; confirm the real generated signature by checking `packages/python/src/factories.ts` after Step 4's regen, since the exact factory shape for a freshly-promoted `separatedList` kind can't be known with certainty before that regen runs.)

- [ ] **Step 3: Run the test to verify it fails**

```bash
pnpm exec vitest run packages/python/tests/nodes.test.ts -t "parameters (promoted"
```
Expected: FAIL (kind doesn't exist yet under this name / factory doesn't exist).

- [ ] **Step 4: Add the override declaration**

In `packages/python/overrides.ts`, add (adjust to match the file's existing override-declaration style — read a few neighboring existing overrides first for the exact syntax convention used in this file):

```ts
_parameters: alias($._parameters, $.parameters),
_patterns: alias($._patterns, $.patterns),
_collection_elements: alias($._collection_elements, $.collection_elements),
```

Scope this to only the kinds Task 2 confirmed live — do not add an entry for a kind confirmed dead.

- [ ] **Step 5: Regenerate python and run the test again**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
pnpm exec vitest run packages/python/tests/nodes.test.ts -t "parameters (promoted"
```
Expected: PASS. If the factory call shape from Step 2 doesn't match what got generated, adjust the test to match the real generated signature (do not adjust the implementation to match a guessed test).

- [ ] **Step 6: Commit**

```bash
git add packages/python/overrides.ts packages/python/tests/nodes.test.ts
git commit -m "$(cat <<'EOF'
feat(python): promote grammar-authored hidden list helpers to visible separatedList kinds

_collection_elements/_parameters/_patterns are grammar-authored,
standalone hidden rules (not sittir enrich synthesis) carrying genuine
optional trailing/leading separator flanks. Adds direct alias()
overrides so tree-sitter surfaces them as real CST nodes, letting
classifyNode's existing isSeparatedListShape check (unchanged) route
them to AssembledSeparatedList instead of AssembledMulti's dead-end
'multi' classification.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PB3y6LJeeKgTbtCpJccVYn
EOF
)"
```

---

### Task 6: Regenerate + full validate:native sweep for Track B

**Files:**
- Regenerate: `packages/python/src`, `packages/python/.sittir/generated.manifest.json`, `rust/crates/sittir-python/test-fixtures.json`

**Interfaces:**
- Consumes: Task 5's overrides.

- [ ] **Step 1: Regenerate python**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
```

- [ ] **Step 2: `cargo check`**

```bash
cargo check --workspace --features napi-bindings
```

- [ ] **Step 3: Full `validate:native` sweep**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | tail -100
```
Compare python's `read-render-parseAstMatchPass` against Task 4's post-Track-A number (not the original 102 baseline, since Track A may have already moved it). Any regression is stop-and-investigate.

- [ ] **Step 4: Commit the regenerated output**

```bash
git add packages/python/src packages/python/.sittir/generated.manifest.json rust/crates/sittir-python/test-fixtures.json
git commit -m "$(cat <<'EOF'
chore(validator): regenerate python after Track B alias() overrides

validate:native: python=<N> read-render-parseAstMatchPass (record actual
observed number here).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PB3y6LJeeKgTbtCpJccVYn
EOF
)"
```

---

### Task 7: Final whole-feature verification and closing commit

**Files:**
- None modified — verification only.

**Interfaces:**
- Consumes: everything from Tasks 3-6.

- [ ] **Step 1: `tsgo --noEmit` clean-baseline confirmation**

```bash
pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.build.json > /tmp/tsgo-final.txt 2>&1
wc -l /tmp/tsgo-final.txt
```
Compare against the pre-existing baseline error set established during the tri-state fix (commit `7a46f0d02`'s own verification) via a `git stash` A/B if any new-looking error appears — confirm byte-identical to that pre-existing set, no new errors introduced by this feature.

- [ ] **Step 2: `cargo check --workspace --features napi-bindings`**

```bash
cargo check --workspace --features napi-bindings
```
Expected: clean.

- [ ] **Step 3: Full `validate:native` sweep, one final time, across all 3 grammars**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | tail -100
```
Record final `read-render-parseAstMatchPass` numbers for all 3 grammars.

- [ ] **Step 4: Full codegen vitest suite, failure-set diff against the ORIGINAL (pre-Task-1) baseline**

```bash
pnpm exec vitest run packages/codegen/src/ > /tmp/vitest-final.txt 2>&1
```
Diff the `FAIL` line set against the very first baseline captured before Task 1 began. Expect zero new failures.

- [ ] **Step 5: Write the closing summary commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
docs: hidden-repeat-helper visibility feature complete

Summary of which of the 19 candidate kinds were promoted vs. found dead
during Task 1/2's reachability checks (fill in with the actual final
list from those task reports):

Promoted: <list>
Found dead / not promoted: <list, with brief reason each>

Final validate:native: rust=<N>, typescript=<N>, python=<N>
read-render-parseAstMatchPass.

Extends the separator-as-slot tri-state fix (7a46f0d02) and its
follow-on design (docs/superpowers/specs/2026-07-13-hidden-repeat-helper-visibility-design.md,
eabf2f755).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PB3y6LJeeKgTbtCpJccVYn
EOF
)"
```

---

## Self-Review

**Spec coverage:** Root cause (Task 3), Track A (Tasks 3-4), Track B (Tasks 5-6), both required pre-flight checks (Tasks 1-2), accepted blast radius / full validate:native gating (every regen task), closed-19-kind confirmation (Task 2 Step 2's count check). All spec sections have a corresponding task.

**Placeholder scan:** Task 3's test fixture and Task 5's factory-call shape are explicitly marked as needing correction against real observed output (Task 1's dump, Task 4's regen) rather than left as vague TODOs — this is a genuine consequence of two tasks depending on empirical output that can't be known until earlier tasks run, not an unaddressed gap. Every other step has concrete, runnable commands and real code.

**Type/name consistency:** `isInlineSafe` signature unchanged across all tasks. `AssembledSeparatedList` (from `7a46f0d02`) referenced consistently, not reinvented. `alias()` used identically in both Track A (internal, via `makeVisibleGroupAlias`) and Track B (hand-authored in overrides.ts) — same underlying primitive, consistent with the design doc.
