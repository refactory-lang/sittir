# Separator-as-slot (AssembledSeparatedList) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a repeated grammar rule with genuine per-instance separator variability (a nonterminal separator, or a literal separator with an optional flank) its own node-model representation (`AssembledSeparatedList`) that captures real per-instance facts instead of baking compile-time assumptions into render output.

**Architecture:** A new `'separatedList'` classification in `compiler/assemble.ts`'s existing `classifyNode()`/`assemble()` dispatch, constructing a new peer node-model class (`AssembledSeparatedList`) alongside `AssembledBranch`/`AssembledGroup`/`AssembledEnum`. Captures a single separator `KindId` (not full text/span) plus leading/trailing presence via a single-pass read-order classification at the wire layer — no native Rust reader change needed. Supersedes and reverts PR-T's Tasks 1-3.

**Tech Stack:** TypeScript (codegen compiler/emitters), Rust (render glue only — `render-module.ts`'s generated output, `filters.rs` unchanged), tree-sitter grammars (rust/typescript/python).

## Global Constraints

- DRY is the #1 correctness rule.
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`) — fix codegen source and regenerate.
- No casts (`as unknown`/`as any`) to clear type errors — fix the real type.
- No type widening that isn't forward-derived from real grammar-model facts.
- Every codegen-source-touching task must regenerate all 3 grammars and stage the regenerated manifest/fixtures before committing.
- `validate:native` output changes (`test-fixtures.json`/`validation-report.json`) land in dedicated `chore(validator)` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace` cleanly.
- **Given the widened trigger's larger blast radius** (fires for every existing rule with an optional literal-flank separator, not just nonterminal-separator cases): every task touching `assemble.ts`/`classifyNode`/`wrap.ts`/`render-module.ts` must run the FULL `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` sweep (not a targeted subset), and treat any unexplained regression as a stop-and-investigate signal, not a byte-diff to wave through.
- Baseline to reconfirm fresh at Task 1 (after the revert, not before — Tasks 1-3's now-reverted commits may have shifted it slightly): last known-good in this worktree pre-any-PR-T-work is `read-render-parseAstMatchPass` rust=117/typescript=75/python=102.
- `AssembledMulti`/`'multi'` already exist in this codebase for an unrelated, semantically opposite concept (hidden inline-only repeat helpers, `compiler/model/node-map.ts:3124-3169`) — this plan's new class is `AssembledSeparatedList`/`'separatedList'`, never reusing those names.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `compiler/model/node-map.ts` | New `AssembledSeparatedList` class (peer to `AssembledBranch`/`AssembledGroup`); `AssembledNode` union gains `\| AssembledSeparatedList` |
| `compiler/model/rule-catalog.ts` or `assemble.ts` (wherever `classifyNode` actually lives — confirm at Task 2) | `classifyNode` gains the `'separatedList'` check |
| `compiler/assemble.ts` | `assemble()`'s switch gains `case 'separatedList':` |
| `compiler/link.ts` | Extension A: widen `absorbTrailingSeparator`'s `isOptionalSepLit` and `liftCommaSep`'s `matchesOptionalSep` from literal-equality to structural `rulesEqual` |
| `emitters/wrap.ts` | Wire capture: single-pass read-order classification for `AssembledSeparatedList`-classified kinds |
| `emitters/render-module.ts` | Render: `_separator_kind`-to-literal `match`, wired into `ListNonterminalView` construction (replacing the hardcoded `leading: false, trailing: false`) |
| `emitters/factories.ts` | Construct/factory surface for `'separatedList'`-classified kinds |
| `packages/typescript/overrides.ts` | `object_type_content_comma`/`_semi` split reverts to a single rule-shaped-separator rule (the concrete validation target) |

---

## Task 1: Revert PR-T Tasks 1-3, reconfirm baseline

**Files:**
- Revert: `packages/codegen/src/compiler/model/node-map.ts`, `packages/codegen/src/compiler/collect-slots.ts` (Task 1's `SeparatorSource` capture, commits `db94ebfad`/`d78cf171d`/`5983e19b5`/`23c22723a`)
- Revert: `rust/crates/sittir-core/src/read_node.rs`, `rust/crates/sittir-core/tests/read_node.rs` (Task 2's `child_index` stamping, commit `fc566a49f`)
- Revert: `packages/codegen/src/emitters/wrap.ts`, `packages/codegen/src/emitters/__tests__/wrap-separator-emit.test.ts` (Task 3's sibling-key derivation, commit `18d19f90a`)

**Interfaces:**
- Consumes: nothing (this is the first task).
- Produces: a clean worktree state matching pre-PR-T behavior, with a freshly reconfirmed `validate:native` baseline that all subsequent tasks gate on.

- [ ] **Step 1: Identify the exact commit range to revert**

```bash
cd /private/tmp/sittir-worktrees/pr-t
git log --oneline db94ebfad~1..18d19f90a
```

Expected output (in this order, oldest first): `db94ebfad`, `d78cf171d`, `5983e19b5`, `23c22723a`, `fc566a49f`, `18d19f90a`. Confirm no OTHER commits are interleaved in this range (the spec doc commits — `be0219263`/`d6905f528`/`b79b86074`/`e78e5405f` — and the PR-T plan doc commits should all be AFTER `18d19f90a`, not between these six; if any doc-only commit is interleaved, revert around it, not through it).

- [ ] **Step 2: Revert the six commits in reverse order**

```bash
git revert --no-edit 18d19f90a
git revert --no-edit fc566a49f
git revert --no-edit 23c22723a
git revert --no-edit 5983e19b5
git revert --no-edit d78cf171d
git revert --no-edit db94ebfad
```

If any revert produces a conflict (possible if a later doc-only commit touched the same plan file — should NOT happen for code files given Step 1's confirmation), resolve by keeping the REVERTED (pre-PR-T) state for code files; stop and report if a conflict touches anything other than doc/plan files.

- [ ] **Step 3: Confirm the revert is clean and complete**

```bash
git status --short
git log --oneline -10
```

Expected: clean tree (only pre-existing untracked `.infigraph/` etc.). Confirm via direct inspection that `packages/codegen/src/compiler/model/node-map.ts` no longer has a `SeparatorSource` interface or `separatorSource` field, `rust/crates/sittir-core/src/read_node.rs`'s anonymous-child branch is back to plain `children_acc.push(data)` (no `child_index` stamp), and `packages/codegen/src/emitters/wrap.ts` no longer has `collectSeparatorCandidateKindExprs`/`_detectFlankSeparator`/`_findSeparatorKind`.

- [ ] **Step 4: Regenerate all 3 grammars, confirm byte-identical to pre-PR-T state**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
git status --short packages/{rust,typescript,python}/src
```

Expected: empty (the revert should be exactly byte-identical to the pre-PR-T commit `177626248`'s generated output, since PR-T's own Task 1 was independently confirmed byte-neutral and Tasks 2/3 only added new, now-reverted fields).

- [ ] **Step 5: Run `cargo test -p sittir-core` and `cargo check --workspace`**

```bash
cargo test -p sittir-core
cargo check --workspace
```

Expected: all green (confirms Task 2's Rust revert didn't break anything else).

- [ ] **Step 6: Reconfirm the `validate:native` baseline fresh**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Record the exact `read-render-parseAstMatchPass` numbers for rust/typescript/python — this is the baseline EVERY subsequent task in this plan gates on. (Expected to match `177626248`'s own numbers, last known as rust=117/typescript=75/python=102, but reconfirm rather than assume.)

- [ ] **Step 7: Commit the manifest/fixture restamp from Step 4/6 (if any)**

```bash
git add packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "chore(codegen): restamp manifests after PR-T Tasks 1-3 revert"
git add packages/tools/validation-report.json packages/tools/validation-history.jsonl rust/crates/sittir-*/test-fixtures.json
git commit -m "chore(validator): record validation run (rust/native, typescript/native, python/native)"
```

(Only run these if Step 4/6 produced a diff — if the revert was truly byte-identical, there may be nothing to commit here.)

---

## Task 2: `classifyNode`'s `'separatedList'` classification (byte-neutral)

**Files:**
- Modify: wherever `classifyNode` is actually defined (confirm exact file — grounded this session as `compiler/assemble.ts` around line 1547, but re-confirm current location first: `grep -n "function classifyNode" packages/codegen/src/compiler/**/*.ts`)
- Modify: `compiler/model/node-map.ts` — add `AssembledSeparatedList` class, add it to the `AssembledNode` union
- Modify: `compiler/assemble.ts` — add `case 'separatedList':` to `assemble()`'s switch
- Test: wherever `classifyNode`'s existing tests live (find via `grep -rn "classifyNode" packages/codegen/src/**/__tests__/*.ts`)

**Interfaces:**
- Consumes: `RuleBase.separator` (`types/rule.ts:211-215`: `{ value: Rule<Phase>; trailing?: boolean; leading?: boolean }`), `isNonterminalRuleType` (`compiler/rule-catalog.ts:275-278`), `deriveValuesForRule` (`node-map.ts:1228`: `(rule: Rule<'link'>, ctx: DeriveCtx | undefined, multiplicity: Multiplicity) => NodeOrTerminal[]`).
- Produces: `AssembledSeparatedList` class with fields `elements: readonly NodeOrTerminal[]`, `separatorRule: Rule<'normalize'> | undefined` (undefined only if literal-with-optional-flank, no nonterminal separator rule to speak of — the flank-only trigger case), `leadingMode: 'mandatory' | 'optional' | 'none'`, `trailingMode: 'mandatory' | 'optional' | 'none'`. `modelType: 'separatedList'` flows into `ModelType`/`AssembledNode`'s union automatically once the class is added to the union declaration.

- [ ] **Step 1: Locate and read `classifyNode`'s current exact body**

```bash
cd /private/tmp/sittir-worktrees/pr-t
grep -rn "function classifyNode" packages/codegen/src/compiler/
```

Read the full function. Confirm the exact structure (as grounded this session):

```ts
export function classifyNode(
	kind: string,
	rule: Rule<'link'>,
	opts?: { variantParents?: ReadonlySet<string>; parentAliasedKinds?: ReadonlySet<string>; wordMatcher?: RegExp }
): ModelType {
	if (isEnumChoiceRule(rule)) return 'enum';
	switch (rule.type) {
		case SUPERTYPE: return 'supertype';
		case GROUP: return 'group';
		case PATTERN: return 'pattern';
		case STRING:
			return matchesWordShape(rule.value, opts?.wordMatcher) ? 'keyword' : 'token';
	}
	if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
	const branchOrContainer = classifyBranchOrContainer(rule);
	if (branchOrContainer !== null) return branchOrContainer;
	return classifyTerminalFallback(kind, rule);
}
```

If this doesn't match current source exactly, adapt the following steps to the real structure — this is a well-grounded snapshot, not guaranteed byte-identical to whatever HEAD looks like after Task 1's revert (should be identical, since nothing in Task 1's revert touches this function, but verify).

- [ ] **Step 2: Write the failing test for the classification condition**

Find `classifyNode`'s existing test file and add:

```ts
describe('classifyNode — separatedList', () => {
	it('classifies a rule with a nonterminal separator as separatedList', () => {
		const contentRule: Rule<'link'> = { type: SYMBOL, name: 'member' } as Rule<'link'>;
		const sepChoice: Rule<'link'> = {
			type: CHOICE,
			members: [{ type: STRING, value: ',' }, { type: STRING, value: ';' }]
		} as Rule<'link'>;
		const rule = {
			type: REPEAT1,
			content: contentRule,
			separator: { value: sepChoice, trailing: false, leading: false }
		} as unknown as Rule<'link'>;

		expect(classifyNode('member_list', rule)).toBe('separatedList');
	});

	it('classifies a rule with a literal separator and an optional trailing flank as separatedList', () => {
		const contentRule: Rule<'link'> = { type: SYMBOL, name: 'member' } as Rule<'link'>;
		const rule = {
			type: REPEAT1,
			content: contentRule,
			separator: { value: { type: STRING, value: ',' } as Rule<'link'>, trailing: true }
		} as unknown as Rule<'link'>;

		expect(classifyNode('member_list', rule)).toBe('separatedList');
	});

	it('does NOT classify a rule with a literal separator and a mandatory (non-optional) flank as separatedList', () => {
		const contentRule: Rule<'link'> = { type: SYMBOL, name: 'member' } as Rule<'link'>;
		const rule = {
			type: REPEAT1,
			content: contentRule,
			separator: { value: { type: STRING, value: ',' } as Rule<'link'> }
			// no trailing/leading at all — mandatory-between-only, today's ordinary case
		} as unknown as Rule<'link'>;

		expect(classifyNode('member_list', rule)).toBe('branch');
	});

	it('does NOT classify a branch with one array-multiplicity field among several named fields as separatedList', () => {
		const rule = {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'name', content: { type: SYMBOL, name: 'identifier' } },
				{
					type: FIELD,
					name: 'items',
					content: {
						type: REPEAT1,
						content: { type: SYMBOL, name: 'item' },
						separator: { value: { type: STRING, value: ',' } as Rule<'link'>, trailing: true }
					}
				}
			]
		} as unknown as Rule<'link'>;

		expect(classifyNode('some_branch', rule)).toBe('branch');
	});
});
```

Match the exact rule-fixture construction style already used by neighboring tests in this file (read a few existing tests first) rather than inventing a new style.

- [ ] **Step 2b: Run the test to verify it fails**

```bash
pnpm exec vitest run <classifyNode's test file> -t "separatedList"
```

Expected: FAIL — `classifyNode` doesn't return `'separatedList'` yet (it would currently return `'branch'` for all these fixtures, since none hit the existing `'multi'` hidden-helper path — confirm this by reading `isHiddenRepeatHelper`'s first check, `if (!kind.startsWith('_')) return false`, which excludes all these named-kind fixtures already).

- [ ] **Step 3: Add the `'separatedList'` check to `classifyNode`**

Insert the new check BEFORE the `classifyBranchOrContainer` fallback (a rule matching this condition would otherwise classify as `'branch'`):

```ts
	if (isHiddenRepeatHelper(kind, rule, opts?.parentAliasedKinds)) return 'multi';
	if (isSeparatedListShape(rule)) return 'separatedList';
	const branchOrContainer = classifyBranchOrContainer(rule);
```

Add the new helper near `classifyNode`:

```ts
/**
 * A rule whose ENTIRE top-level structure is a repeated list with genuine
 * per-instance separator variability — either the separator itself is
 * nonterminal (multiple possible literal kinds), or it's a literal
 * separator with an optional (not mandatory, not absent) leading/trailing
 * flank. Does NOT match a branch that merely HAS one array-multiplicity
 * field among several named fields (that stays 'branch', unchanged) — only
 * a rule whose own identity IS the list.
 */
function isSeparatedListShape(rule: Rule<'link'>): boolean {
	if (rule.type !== REPEAT && rule.type !== REPEAT1) return false;
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep === undefined) return false;
	if (isNonterminalRuleType(sep.value as Rule<'evaluate'>)) return true;
	return sep.trailing === true || sep.leading === true;
}
```

**Verify this against the ACTUAL current shape of a top-level repeat rule at this point in the pipeline** — the fixture in Step 2 assumes `rule.type === REPEAT1` with `.content`/`.separator` directly on it (matching `RuleBase`'s shape per `types/rule.ts`), but confirm `inlinedRule` (what `classifyNode` actually receives from `assemble()`, per `hoistInnerFieldsForTemplate(inlineRefs(assemblyRule, ...))`) hasn't wrapped or transformed this shape further by the time `classifyNode` sees it. If the real rule shape differs from the fixture's assumption, adjust `isSeparatedListShape` and the test fixtures together — don't force-fit.

- [ ] **Step 4: Add `AssembledSeparatedList` to `node-map.ts`**

Near `AssembledGroup`'s definition, add:

```ts
/**
 * A repeated rule with genuine per-instance separator variability — see
 * docs/superpowers/specs/2026-07-12-separator-as-slot-design.md. Unlike
 * AssembledGroup, does NOT route through buildSlotsRecord/deriveSlots (the
 * general-purpose slot-collection/merge machinery) — it has exactly two
 * fixed-purpose fields, derived directly via deriveValuesForRule.
 */
export class AssembledSeparatedList extends AssembledNodeBase<RepeatRule | Repeat1Rule> {
	readonly modelType = 'separatedList' as const;
	readonly elements: readonly NodeOrTerminal[];
	readonly separatorRule: Rule<'normalize'> | undefined;
	readonly leadingMode: 'mandatory' | 'optional' | 'none';
	readonly trailingMode: 'mandatory' | 'optional' | 'none';

	constructor(kind: string, rule: RepeatRule | Repeat1Rule, ctx: DeriveCtx | undefined) {
		super(kind, rule, {});
		const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
		this.elements = deriveValuesForRule(rule.content as Rule<'link'>, ctx, rule.type === REPEAT1 ? 'nonEmptyArray' : 'array');
		this.separatorRule = sep && isNonterminalRuleType(sep.value as Rule<'evaluate'>) ? (sep.value as Rule<'normalize'>) : undefined;
		this.leadingMode = sep?.leading === true ? 'optional' : sep === undefined ? 'none' : 'mandatory';
		this.trailingMode = sep?.trailing === true ? 'optional' : sep === undefined ? 'none' : 'mandatory';
	}
}
```

**Note on `leadingMode`/`trailingMode`'s `'mandatory'` derivation above:** this treats "separator exists but the flag isn't explicitly `true`" as `'mandatory'` for BOTH leading and trailing, which is likely WRONG for cases where a separator exists with `trailing: true` but leading is entirely absent (should be `'none'` for leading in that case, not `'mandatory'`) — this is a placeholder derivation the implementer MUST verify against real grammar fixtures (Task 2's test in Step 2) and correct. The spec's intent (re-read `docs/superpowers/specs/2026-07-12-separator-as-slot-design.md`'s Field shape section) is: `between` is `'mandatory'` whenever a separator exists at all; `leading`/`trailing` are independently `'optional'` (flag true), or `'none'` (not part of this grammar) — there is no `between`-style `'mandatory'` case for the FLANKS specifically in the common shape, since a mandatory flank (always present, non-optional) is a real but rarer grammar shape (e.g. a separator that's REQUIRED before every element, not just optionally trailing). Get this right via the test fixtures, not by trusting the sketch above verbatim.

Add `AssembledSeparatedList` to the `AssembledNode` union (find the declaration, confirmed this session at node-map.ts ~3300-3308):

```ts
export type AssembledNode =
	| AssembledBranch | AssembledPattern | AssembledKeyword | AssembledToken
	| AssembledEnum | AssembledSupertype | AssembledGroup | AssembledMulti
	| AssembledSeparatedList;
```

- [ ] **Step 5: Wire `assemble()`'s switch**

In `compiler/assemble.ts`'s switch statement, add (following the `'group'` case's shape for how ctx gets built, adapted since `AssembledSeparatedList`'s constructor takes a plain `DeriveCtx`, not the fuller `KindedDeriveCtx` `buildSlotsRecord` needs):

```ts
	case 'separatedList':
		nodes.set(kind, new AssembledSeparatedList(kind, inlinedRule as RepeatRule | Repeat1Rule, { kindEntries }));
		break;
```

Confirm `DeriveCtx`'s actual shape (`grep -n "interface DeriveCtx" packages/codegen/src/compiler/model/node-map.ts`) before finalizing this — the sketch `{ kindEntries }` may need more/fewer fields to match what `deriveValuesForRule` actually requires.

- [ ] **Step 6: Run the classifyNode tests, then regenerate all 3 grammars and confirm BYTE-NEUTRAL**

```bash
pnpm exec vitest run <classifyNode's test file> -t "separatedList"
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
git status --short packages/{rust,typescript,python}/src
```

Expected: classifyNode tests pass (4/4). Regeneration produces a diff ONLY if any real grammar rule across the 3 grammars ALREADY matches `isSeparatedListShape` — since nothing downstream (wrap.ts, render-module.ts, factories.ts) has been taught to handle `modelType === 'separatedList'` yet, any such match will likely cause a CRASH or missing-emission error in codegen, not a silent byte-diff. **If regeneration crashes**, this confirms real grammar rules DO match — proceed to Task 3+ before this task can be considered complete; note which specific kinds crashed for later tasks' test fixtures. If regeneration succeeds with zero matches across all 3 grammars currently, this task is genuinely byte-neutral for now (matches only start appearing once Task 5 (link.ts Extension A) widens what qualifies) — also acceptable, proceed to Task 3.

- [ ] **Step 7: `tsgo --noEmit` + `validate:native`**

```bash
pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.build.json
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: 0 new type errors. `validate:native` holds at Task 1's reconfirmed baseline (or, if Step 6 found real matches, investigate any regression here directly rather than assuming it's fine).

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/assemble.ts <classifyNode's file and test file> packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): add 'separatedList' classification + AssembledSeparatedList node-model class"
```

Plus a separate validator-record commit if fixtures changed.

---

## Task 3: `link.ts` Extension A — structural flank-absorption widening

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` — `absorbTrailingSeparator`'s `isOptionalSepLit` predicate (confirmed this session ~line 2644-2648) and `liftCommaSep`'s `matchesOptionalSep` + leading-absorb case (~lines 2679-2683, 2694-2701)
- Test: `link.ts`'s existing separator-lifting test suite (find via `grep -rln "liftCommaSep\|absorbTrailingSeparator" packages/codegen/src/compiler/__tests__/`)

**Interfaces:**
- Consumes: `rulesEqual` (an existing structural rule-comparison helper — confirm its exact import path and signature before use: `grep -rn "function rulesEqual" packages/codegen/src/`).
- Produces: `liftCommaSep`/`absorbTrailingSeparator` now correctly fold a flanking `optional(choice(...))` member into the enclosing repeat's `separator`/`trailing`/`leading` facts, the same way they already fold `optional(',')` — needed so `isSeparatedListShape` (Task 2) sees a clean, already-lifted `RepeatRule.separator` for choice-shaped-separator-with-optional-flank cases (like the `object_type_content` revert target, Task 7), not a polluted multi-member seq that never reaches the `'separatedList'` check at all.

- [ ] **Step 1: Read the current `isOptionalSepLit`/`matchesOptionalSep` predicates in full**

```bash
grep -n "function absorbTrailingSeparator\|isOptionalSepLit\|function liftCommaSep\|matchesOptionalSep" packages/codegen/src/compiler/link.ts
```

Read both functions completely before editing.

- [ ] **Step 2: Write the failing test**

Add a test constructing the exact reverted-`object_type_content` shape (`seq(optional(choice(',', ';')), seq(member, repeat(seq(choice(',', ';'), member))), optional(choice(',', ';')))`) and asserting that after `link()` runs, the resulting rule is a single clean `RepeatRule`/`Repeat1Rule` with `separator: { value: <the choice rule>, trailing: true, leading: true }` — NOT a 3-member seq with phantom flanking slots. Match this test file's existing fixture-construction and `link()`-invocation conventions (read a neighboring existing test in the same file first).

- [ ] **Step 2b: Run the test to verify it fails**

```bash
pnpm exec vitest run <link.ts's separator test file> -t "<your new test name>"
```

Expected: FAIL — the flanking `optional(choice(...))` members currently survive as separate content, not absorbed.

- [ ] **Step 3: Widen `isOptionalSepLit`/`matchesOptionalSep` to structural comparison**

Change both predicates' literal-string-equality check to `rulesEqual(optionalMember.content, separator.value)`. Add the symmetric leading-absorb case if `liftCommaSep`'s Case 3 doesn't already have one for the literal path either (the investigation found the literal path currently relies on `collectSlots` eliding a bare `optional(STRING)`, which does NOT elide `optional(CHOICE)` — confirm this gap exists for literals too before assuming only the nonterminal case needs a new leading-absorb branch).

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm exec vitest run <link.ts's separator test file> -t "<your new test name>"
```

- [ ] **Step 5: Run the FULL `link.ts` test suite**

```bash
pnpm exec vitest run <link.ts's separator test file>
```

Expected: all green — confirm widening from literal-equality to `rulesEqual` doesn't change behavior for any EXISTING literal-separator test case (should be identical, since `rulesEqual(stringRuleA, stringRuleB)` reduces to the same string-equality check for the literal case).

- [ ] **Step 6: Regenerate all 3 grammars, `tsgo --noEmit`, `validate:native`**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.build.json
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: byte-neutral for all 3 grammars UNLESS a real existing grammar rule already has this exact flanking-optional-choice shape (unlikely for literal cases already absorbed correctly; possible for nonterminal cases — none expected until Task 7's override revert introduces one). `validate:native` holds at baseline. 0 new type errors.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/link.ts <test file> packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "fix(codegen): widen link.ts flank-absorption from literal-equality to structural rulesEqual comparison"
```

Plus a validator-record commit if fixtures changed.

---

## Task 4: Wire capture — single-pass read-order classification

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` — add support for `AssembledSeparatedList`-classified kinds (this is a NEW code path, not an extension of `emitFieldCarryingWrap`, since `AssembledSeparatedList` has a fundamentally different 2-field shape than a branch's arbitrary field list; find where `emitFieldCarryingWrap` is DISPATCHED to per `modelType`, likely a top-level `emitWrapFunction`-style dispatcher, and add a sibling `emitSeparatedListWrap` function)
- Test: `packages/codegen/src/emitters/__tests__/` — new test file, e.g. `wrap-separated-list-emit.test.ts`

**Interfaces:**
- Consumes: `AssembledSeparatedList.elements`/`.separatorRule`/`.leadingMode`/`.trailingMode` (Task 2).
- Produces: for a `'separatedList'`-classified kind, the generated wrap function emits `_content` (the elements array, populated exactly like any other repeated slot today), `_separator_kind: number | undefined` (only when `separatorRule` is set — nonterminal case), `_leading_sep: boolean` (only when `leadingMode === 'optional'`), `_trailing_sep: boolean` (only when `trailingMode === 'optional'`).

- [ ] **Step 1: Find the wrap-emission dispatch point**

```bash
grep -n "modelType ===\|switch (node.modelType)\|switch (.*\.modelType)" packages/codegen/src/emitters/wrap.ts
```

Read the dispatcher that routes a node to `emitFieldCarryingWrap` (for `'branch'`) vs whatever handles `'group'`/`'enum'`/etc. — add a new branch for `'separatedList'`.

- [ ] **Step 2: Write the failing test**

```ts
it('emits _content/_separator_kind/_leading_sep/_trailing_sep for a separatedList node with nonterminal separator + optional both flanks', () => {
	const node = /* AssembledSeparatedList fixture: elements from a member rule, separatorRule = choice(',',';'), leadingMode='optional', trailingMode='optional' */;
	const emitted = emitSeparatedListWrap(node, nodeMap);
	expect(emitted).toContain('_content:');
	expect(emitted).toContain('_separator_kind:');
	expect(emitted).toContain('_leading_sep:');
	expect(emitted).toContain('_trailing_sep:');
});

it('omits _separator_kind for a literal-separator-with-optional-trailing-flank node (no nonterminal separator)', () => {
	const node = /* AssembledSeparatedList fixture: separatorRule = undefined, trailingMode='optional', leadingMode='none' */;
	const emitted = emitSeparatedListWrap(node, nodeMap);
	expect(emitted).not.toContain('_separator_kind:');
	expect(emitted).toContain('_trailing_sep:');
	expect(emitted).not.toContain('_leading_sep:');
});
```

Match this file's established fixture-construction conventions once you've read a neighboring existing wrap-emitter test.

- [ ] **Step 2b: Run to verify it fails.**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/wrap-separated-list-emit.test.ts
```

- [ ] **Step 3: Implement `emitSeparatedListWrap`**

```ts
function emitSeparatedListWrap(node: AssembledSeparatedList, nodeMap: NodeMap): string {
	const lines: string[] = [];
	const fn = `wrap${node.typeName}`;
	lines.push(`export function ${fn}(data: T.${node.typeName}, tree: TreeHandle) {`);
	lines.push('  return withMethods({');
	lines.push('    ...data,');
	lines.push(`    _content: normalizeRepeatedWrapSlot(data._content, ${node.rule.type === 'REPEAT1' ? 'true' : 'false'}, 'content', { tree, nodeType: data.$type, slotName: 'content', span: (data as _NodeData).$span }),`);

	if (node.separatorRule) {
		const candidateKindExprs = collectSeparatorCandidateKindExprs(node.separatorRule, nodeMap); // reuse Task 3(reverted)'s helper CONCEPT, but re-derive cleanly here — do not literally resurrect the reverted code, write it fresh against AssembledSeparatedList's shape
		lines.push(`    _separator_kind: _classifySeparatedListOther(data.$other, [${candidateKindExprs.join(', ')}], data._content, 'kind'),`);
	}
	if (node.leadingMode === 'optional') {
		lines.push(`    _leading_sep: _classifySeparatedListOther(data.$other, undefined, data._content, 'leading'),`);
	}
	if (node.trailingMode === 'optional') {
		lines.push(`    _trailing_sep: _classifySeparatedListOther(data.$other, undefined, data._content, 'trailing'),`);
	}
	lines.push('  }, methodsEngine);');
	lines.push('}');
	return lines.join('\n');
}
```

Add the single runtime helper (gated in wrap.ts's boilerplate emission, same gating pattern as `normalizeRepeatedWrapSlot`) implementing the single-pass read-order classification described in the spec:

```ts
function _classifySeparatedListOther(
	other: _NodeData['$other'],
	candidateKinds: readonly number[] | undefined,
	content: unknown,
	mode: 'kind' | 'leading' | 'trailing'
): number | boolean | undefined {
	if (!other) return mode === 'kind' ? undefined : false;
	const list = Array.isArray(other) ? other : [other];
	const contentList = Array.isArray(content) ? content : content !== undefined ? [content] : [];
	// Single linear pass over `other` in native document order (order is
	// preserved through wire serialization regardless of any per-element
	// scalarization). We don't have per-entry position data relative to
	// `contentList` on the wire — but we don't need it: this function is
	// called once per node, and `other`'s relative position (all entries
	// before vs after actual content) is exactly what native document
	// order over the FULL original child sequence would show. Since
	// `other` contains ONLY this node's anonymous children (no other
	// unnamed slots compete for it on a separatedList-classified kind —
	// its whole identity is content + separator), the FIRST entry in
	// `other`, if content also exists, represents a leading occurrence
	// only when it's known from THIS SAME read pass to precede the first
	// content element — see wrap.ts's `emitSeparatedListWrap` doc comment
	// for how the native reader's ALREADY-preserved array order guarantees
	// this without any span data.
	if (mode === 'kind') {
		for (const entry of list) {
			if (typeof entry === 'object' && entry !== null && '$type' in entry) {
				const kind = (entry as _NodeData).$type as number;
				if (!candidateKinds || candidateKinds.includes(kind)) return kind;
			} else if (typeof entry === 'number' && (!candidateKinds || candidateKinds.includes(entry))) {
				return entry;
			}
		}
		return undefined;
	}
	if (contentList.length === 0) return false;
	if (mode === 'leading') return list.length > contentList.length - 1;
	return list.length > contentList.length - 1 && list.length >= contentList.length;
}
```

**This `_classifySeparatedListOther` sketch is a first-pass design, not verified against real wire data — the implementer MUST validate it against an actual generated grammar's real `$other` payload (via `probe-kind`/a throwaway script reading real parsed output) before trusting the leading/trailing boundary logic, since the "count-based" fallback here doesn't fully implement the spec's own described "read-order, not count" mechanism — re-read the spec's Field shape section and correct this function to genuinely classify by ORDER (first entry relative to first content element, last entry relative to last content element) rather than the count-only approximation sketched here, which was a simplification made under this plan-writing task's own context constraints, not a verified-correct implementation.**

- [ ] **Step 4: Run the test to verify it passes; iterate on `_classifySeparatedListOther` until genuinely order-based, not count-based**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/wrap-separated-list-emit.test.ts
```

- [ ] **Step 5: Regenerate, confirm the target case emits correctly, `tsgo`/`validate:native`**

Same gates as prior tasks — regenerate all 3, `tsgo --noEmit`, full `validate:native` sweep, confirm baseline holds.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/__tests__/wrap-separated-list-emit.test.ts packages/{rust,typescript,python}/src/wrap.ts packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): wrap.ts emits per-instance separator facts for separatedList-classified kinds"
```

---

## Task 5: Render — `_separator_kind`-to-literal resynthesis + `ListNonterminalView` wiring

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` — `buildTypedTemplateBody`'s hardcoded `leading: false, trailing: false` (same site PR-T's original Task 4 targeted), extended to also emit the `_separator_kind` match; the transport-struct field-emission loop (`renderTransportDataStruct`) gains the matching `Option<bool>`/`Option<u32>` sibling fields for `'separatedList'`-classified kinds specifically.
- Test: `packages/codegen/src/emitters/__tests__/render-module.test.ts` or equivalent.

**Interfaces:**
- Consumes: Task 4's three wire fields; `filters.rs`'s `ListNonterminalView { items, separator: &str, leading: bool, trailing: bool }` (unchanged, confirmed this session — no Rust filter changes needed, only the Rust GLUE code generated by `render-module.ts` changes).

- [ ] **Step 1-8**: same TDD/regenerate/gate/commit shape as prior tasks. Write the failing test for the transport-struct fields first, implement the field emission (mirroring `renderTransportField`'s existing attribute-emission style exactly, read it in full before writing), then write the failing test for `buildTypedTemplateBody`'s `match` emission:

```rust
leading: node.content_leading_sep.unwrap_or(false),
trailing: node.content_trailing_sep.unwrap_or(false),
```

and, when the kind has a nonterminal separator, a `separator` resolved via:

```rust
separator: match node.content_separator_kind {
    Some(<comma_kind_id>) => ",",
    Some(<semi_kind_id>) => ";",
    _ => <DEFAULT_JOIN_SEPARATOR or the compile-time-known fallback literal>,
},
```

The exact KindId constants are grammar-specific — derive via the SAME `kindDiscriminantExpr`-style lookup already used elsewhere in this codebase for kind-to-numeric-id mapping (confirm the real current helper name/signature before use — this plan's earlier PR-T version cited `kindDiscriminantExpr`; re-verify it still applies here or find its current equivalent).

Full gates each step: regenerate all 3, `cargo check --workspace`, `tsgo --noEmit`, full `validate:native` sweep, commit.

---

## Task 6: Construct/factory surface

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` — factory emission for `'separatedList'`-classified kinds (positional/variadic `elements` argument, options object for `separatorKind`/`leading`/`trailing` overrides).

- [ ] **Step 1-6**: same TDD/regenerate/gate/commit shape. Read `factories.ts`'s existing dispatch (per `modelType`) in full first to find where to add the new branch and what conventions (naming, options-object shape) to mirror.

---

## Task 7: `object_type` override revert — the concrete end-to-end validation target

**Files:**
- Modify: `packages/typescript/overrides.ts` — delete `object_type_content_comma`/`object_type_content_semi`, replace `object_type_content` with:
  ```js
  object_type_content: ($) => {
  	const SEP = () => choice(',', ';');
  	const member = choice($.export_statement, $.property_signature, $.call_signature, $.construct_signature, $.index_signature, $.method_signature);
  	return seq(optional(SEP()), seq(member, repeat(seq(SEP(), member))), optional(SEP()));
  };
  ```
  Delete the `conflicts` entry `[$.object_type_content_comma, $.object_type_content_semi]` (confirm current line via `grep -n "object_type_content_comma.*object_type_content_semi" packages/typescript/overrides.ts`).
- Modify: `packages/typescript/tests/nodes.test.ts` (4 references to the deleted split kinds — update to the merged `object_type_content` kind).

- [ ] **Step 1-8**: same TDD/regenerate/gate/commit shape as prior tasks, PLUS the acceptance criteria from the spec's own document:
  - `interface Foo { a: string; b: number; }` round-trips byte-faithfully (trailing `;` preserved).
  - `type Foo = { a: string, b: number }` round-trips byte-faithfully (comma form).
  - A genuinely mixed instance (`{ a, b; c }`) at least parses and round-trips using one recovered separator kind (strict improvement over today's outright parse rejection).
  - `validate:native` deep-AST for typescript improves specifically.
  - Override parser corpus error count (per `CLAUDE.md`'s tracked table) does not regress.

---

## Task 8: Full `validate:native` regression sweep

**Files:** none (verification-only task).

- [ ] **Step 1: Run the full sweep**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

- [ ] **Step 2: Enumerate every kind now classified `'separatedList'` across all 3 grammars**

Write a throwaway script (or use `tool` diagnostics) to list every kind whose `modelType === 'separatedList'` post-Task-3's-widened-link.ts-absorption, across rust/typescript/python. This is expected to be a real, possibly double-digit list (per the spec's own scale note) — not just the `object_type_content` target case.

- [ ] **Step 3: For each newly-`'separatedList'`-classified kind, confirm hold-or-improve**

Cross-reference each kind's pass/fail status in `validate:native`'s output before this plan's changes (Task 1's reconfirmed baseline) vs after all 7 prior tasks. Any kind that REGRESSED (was passing, now fails) is a stop-and-investigate signal — do not proceed to consider this plan complete until every regression is either fixed or explicitly, individually justified.

- [ ] **Step 4: Report final numbers and commit the validator record**

```bash
git add packages/tools/validation-report.json packages/tools/validation-history.jsonl rust/crates/sittir-*/test-fixtures.json
git commit -m "chore(validator): record validation run — separator-as-slot final sweep"
```

---

## Self-review notes (writing-plans skill)

**Spec coverage:** Architecture (Task 2), Field shape/tri-state model (Task 2), capture mechanism (Task 4), render (Task 5), construct surface (Task 6), relationship to Tasks 1-3 (Task 1's revert), relationship to the override revert (Task 7), out-of-scope items (genuine per-gap heterogeneity, enrich-based auto-synthesis — neither attempted, consistent with spec) are all covered. Testing strategy section's 5 bullet points map to Tasks 2/4/5/8 respectively.

**Known gaps flagged inline rather than hidden:** Task 2 Step 4's `leadingMode`/`trailingMode` derivation is explicitly marked as needing correction via real test fixtures, not trusted as-is. Task 4 Step 3's `_classifySeparatedListOther` is explicitly marked as a first-pass sketch needing verification against real wire data before the "order not count" mechanism is genuinely implemented. Task 5's exact KindId-lookup helper name needs re-confirming against current source. These are honest flags for the implementer to resolve via the plan's own TDD steps, not silently glossed over — consistent with how this same session's PR-T plan handled analogous uncertainty in its own Tasks 3-5.
