# PR-T: Non-slot separator rules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture rule-shaped (non-literal) separators — `choice(',', ';')`, `optional(',')` — as a first-class, per-instance, verbatim-pass-through fact on the content slot they delimit, so lists with these separator shapes render byte-faithfully instead of silently dropping/misrendering the separator.

**Architecture:** A four-layer pipeline. (1) **Compile-time** (`collect-slots.ts`/`node-map.ts`): when a repeated slot's separator is non-literal, capture the separator `Rule` itself (already threaded onto `RuleBase.separator.value` by PR-S's `liftSeparators`) plus the anonymous kind-ids it can parse as, onto the slot — this is the "role:'separator' + delimits" model collapsed onto its documented home (the content slot). (2) **Native reader** (`sittir-core`): a genuinely small, surgical fix — anonymous separator tokens are already fully read (span + text) by `read_children`/`read_materialized_leaf`, but `scalar_child_value` throws span+text away at JSON-serialization time for every anonymous child. Stamping the child's ordinal position (`child_index`) at the existing call site makes it survive serialization intact — no new wire concept, no new reader traversal. (3) **wrap.ts** (JS glue): span-correlate the now-preserved separator tokens in `data.$other` against the content slot's own values to derive per-instance trailing/leading presence and the actual separator kind at each gap, using the SAME `_filterWrapChildrenByKind`/`collectConcreteStorageKeys` machinery already used for ambiguous-kind wire disambiguation. (4) **Render** (`render-module.ts`/`filters.rs`/transport structs): thread the captured per-instance facts (and the Config-surface user-settable override) into `ListNonterminalView`, replacing today's hardcoded `leading: false, trailing: false`.

**Tech Stack:** TypeScript (codegen emitters, compiler), Rust (native reader in `sittir-core`, transport structs + render glue in the per-grammar `sittir-<lang>` crates), tree-sitter grammars (rust/typescript/python), Jinja/askama render templates.

## Global Constraints

- DRY is the #1 correctness rule for this codebase — each fact has one source and one derivation. The source of truth for "which anonymous kinds can appear as a separator" is the grammar (via `RuleBase.separator.value`, already lifted by PR-S); do not re-derive it heuristically at any downstream layer.
- Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `overrides.suggested.ts`) — fix codegen/`overrides.ts` and regenerate.
- No casts (`as unknown`/`as any`) to clear type errors — fix the real type.
- No type widening that isn't forward-derived from real grammar-model facts (arity, storage model, separator kind-set) — never reverse-engineered from what a function body happens to access.
- Baseline (this worktree, reconfirmed fresh 2026-07-12): `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` → rust `read-render-parseAstMatchPass=117` (136 total, 133 pass), deep-AST (`read-render-parse-shallowAstMatchPass`)=`118`; typescript `read-render-parseAstMatchPass=75` (111 total, 82 pass), deep-AST=`49`; python `read-render-parseAstMatchPass=102` (115 total, 115 pass), deep-AST=`106`. Every task gates on this holding steady or improving — **deep-AST specifically**, not just `covPass` (the spec's own documented lesson: a static trailing flag was tried before and crashed deep-AST 70→53; `covPass` alone masks that class of regression).
- Fixed-literal separators are explicitly OUT of scope — they stay render constants (today's behavior, unchanged). Only rule-shaped (non-literal — `choice`/`optional`/token) separators are targeted.
- Every codegen-source-touching task must regenerate all 3 grammars (`pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`) and stage the regenerated manifest/fixtures before committing (pre-commit hook enforces this).
- `validate:native` output changes (`test-fixtures.json`/`validation-report.json`) land in their own dedicated `chore(validator): record validation run` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace` (all 3 crates) after regen, cleanly.
- The concrete acceptance target for this plan is TypeScript's `interface_body`/`object_type` case: `{ foo: string; }` currently renders `{ foo :string }` (drops the trailing `;`) because `render-module.ts`'s `buildTypedTemplateBody` hardcodes `leading: false, trailing: false` for every list-view slot. The pinned regression test at `packages/codegen/src/compiler/__tests__/generate.test.ts:85-197` (`'generate() — non-literal-separator diagnostic surfacing (PR-S task 5, Stage 2)'`) currently asserts the `non-literal-separator` warning fires exactly once (typescript only, 0 on rust/python) for this case — Task 6 updates this test's expectations once derivation successfully attaches a separator to this slot.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/codegen/src/compiler/model/node-map.ts` | Adds `SeparatorSource` type + `AssembledNonterminal.separatorSource` field (Task 1) |
| `packages/codegen/src/compiler/collect-slots.ts` | Populates `separatorSource` when the slot's separator is non-literal (Task 1) |
| `rust/crates/sittir-core/src/read_node.rs` | Stamps `child_index` on every child (fielded and anonymous) during `read_children` (Task 2) |
| `rust/crates/sittir-core/src/types.rs` | No code change — `scalar_child_value`'s existing `child_index.is_some()` guard already does the right thing once Task 2 stamps it (verified, not touched) |
| `packages/codegen/src/emitters/wrap.ts` | Emits `_<name>_trailing_sep`/`_<name>_leading_sep`/`_<name>_separator_kind` sibling fields for `arity==='many'` fields with a `separatorSource` (Task 3) |
| `rust/crates/sittir-*/src/render/transport.rs` (generated) | Gains matching `Option<bool>`/`Option<u32>` sibling fields on the transport struct (Task 4, via `render-module.ts`'s `renderTransportField` caller loop) |
| `packages/codegen/src/emitters/render-module.ts` | `buildTypedTemplateBody` reads the captured facts instead of hardcoding `false`; `renderTransportDataStruct`'s field loop emits the new sibling transport fields (Task 4) |
| `rust/crates/sittir-core/src/filters.rs` | No code change — `ListNonterminalView`/`JoinSource` already read `leading`/`trailing` correctly; only the caller-supplied values change (verified, not touched) |
| `packages/codegen/src/emitters/factories.ts` | Adds the `{ separator?, trailing?, leading? }` options-block surface to the Config type + factory body for `arity==='many'` fields with `separatorSource` (Task 5) |
| `packages/typescript/overrides.ts`, `packages/codegen/src/compiler/__tests__/generate.test.ts`, `packages/codegen/src/compiler/link.ts` | End-to-end validation + pinned-test update against the `interface_body`/`object_type` case (Task 6) |

---

## Task 1: Compile-time separator-source capture

**Files:**
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (add `SeparatorSource` type near `AssembledNonterminalInit`, ~line 1759; add field to `AssembledNonterminalInit`/`AssembledNonterminal`/constructor/`.with()`)
- Modify: `packages/codegen/src/compiler/collect-slots.ts` (populate the field at the separator-extraction site, ~lines 408-425)
- Test: `packages/codegen/src/compiler/__tests__/collect-slots.test.ts` (create the describe block if none exists for separator handling; check first with `Glob` — if a `collect-slots.test.ts` already exists, add to it)

**Interfaces:**
- Consumes: `RuleBase<'normalize'>['separator']` (`types/rule.ts:211-215`: `{ value: Rule<Phase>; trailing?: boolean; leading?: boolean }`), `extractSeparatorString` (`node-map.ts`, unchanged), `isNonterminalRuleType` (`compiler/rule-catalog.ts:275-278`).
- Produces: `AssembledNonterminal.separatorSource?: SeparatorSource` where
  ```ts
  export interface SeparatorSource {
  	/** The non-literal separator rule itself (post-PR-S, already the FULL rule — e.g. a ChoiceRule — not narrowed to one arm). */
  	readonly rule: Rule<'normalize'>;
  	/** Grammar-level permission (generalizes hasTrailing/hasLeading for the non-literal case; the boolean flags stay for compatibility but this is the derivation source going forward for non-literal separators). */
  	readonly trailingPermitted: boolean;
  	readonly leadingPermitted: boolean;
  }
  ```
  Later tasks (2, 3) consume `slot.separatorSource` to know (a) that per-instance runtime capture is needed at all, and (b) what shape the separator rule has (for deriving candidate kind names in Task 3).

- [ ] **Step 1: Write the failing test for `SeparatorSource` capture**

Check whether `packages/codegen/src/compiler/__tests__/collect-slots.test.ts` exists:

```bash
ls packages/codegen/src/compiler/__tests__/collect-slots.test.ts
```

If it exists, add this test to its existing top-level `describe` block. If not, create it with this content (adjust imports to match whatever `buildSlot`/equivalent public entry point `collect-slots.ts` already exports and whatever existing tests in this area import — read `collect-slots.ts`'s exports first via `Grep -n "^export" packages/codegen/src/compiler/collect-slots.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { CHOICE, REPEAT, STRING, SYMBOL } from '../../types/rule-types.ts';
import type { Rule } from '../../types/rule.ts';
import { buildSlot } from '../collect-slots.ts'; // adjust to actual exported name

describe('separatorSource capture', () => {
	it('captures a non-literal (choice) separator rule on the slot', () => {
		const commaRule: Rule<'link'> = { type: STRING, value: ',' } as Rule<'link'>;
		const semiRule: Rule<'link'> = { type: STRING, value: ';' } as Rule<'link'>;
		const sepChoice: Rule<'link'> = { type: CHOICE, members: [commaRule, semiRule] } as Rule<'link'>;
		const contentRule: Rule<'link'> = { type: SYMBOL, name: 'field_declaration' } as Rule<'link'>;
		const repeatRule = {
			type: REPEAT,
			content: contentRule,
			separator: { value: sepChoice, trailing: true, leading: false },
			fieldName: 'body'
		} as unknown as Rule<'link'>;

		const slot = buildSlot(repeatRule, /* whatever additional args buildSlot's real signature needs */);

		expect(slot).not.toBeNull();
		expect(slot!.separatorSource).toBeDefined();
		expect(slot!.separatorSource!.rule).toEqual(sepChoice);
		expect(slot!.separatorSource!.trailingPermitted).toBe(true);
		expect(slot!.separatorSource!.leadingPermitted).toBe(false);
	});

	it('leaves separatorSource undefined for a literal separator', () => {
		const contentRule: Rule<'link'> = { type: SYMBOL, name: 'field_declaration' } as Rule<'link'>;
		const repeatRule = {
			type: REPEAT,
			content: contentRule,
			separator: { value: { type: STRING, value: ',' } as Rule<'link'>, trailing: true },
			fieldName: 'body'
		} as unknown as Rule<'link'>;

		const slot = buildSlot(repeatRule /* ... */);

		expect(slot!.separatorSource).toBeUndefined();
	});
});
```

Before writing this for real, read `collect-slots.ts`'s `buildSlot` (or whatever the actual exported entry point is) signature in full — the test above uses a plausible but unverified call shape; match it exactly to what the function actually takes (kindEntries, inheritedSeparator, etc. per the ~line 380-425 body already read during planning).

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts -t "separatorSource"
```

Expected: FAIL — `separatorSource` does not exist on `AssembledNonterminal` yet (TS error) or the assertion fails.

- [ ] **Step 3: Add `SeparatorSource` type + field to `node-map.ts`**

In `packages/codegen/src/compiler/model/node-map.ts`, near `AssembledNonterminalInit` (currently ~line 1759), add:

```ts
/**
 * Captures a slot's non-literal (rule-shaped) separator — `choice(',', ';')`,
 * `optional(',')`, a token rule — for downstream runtime per-instance
 * capture (PR-T). Literal separators stay on the existing `extractSeparatorString`
 * path (a single derived string, render constant) and never populate this.
 *
 * This IS the "role:'separator' + delimits" model from the design spec,
 * collapsed onto its documented home (the content slot it delimits) rather
 * than persisted as a standalone slot — a `separator`-shaped rule member
 * never becomes its own `AssembledNonterminal`; PR-S's `liftSeparators`
 * already isolates it onto `RuleBase.separator.value` at the rule level,
 * so there is nothing left to "bucket by role" here — only to capture.
 */
export interface SeparatorSource {
	/** The non-literal separator rule itself (a ChoiceRule, OptionalRule, or token rule — never a bare StringRule, since that case is handled by extractSeparatorString instead). */
	readonly rule: Rule<'normalize'>;
	/** Grammar-level permission: can a trailing/leading separator occur at all, per the grammar (static; per-instance PRESENCE is a Task 2/3 runtime concern). */
	readonly trailingPermitted: boolean;
	readonly leadingPermitted: boolean;
}
```

Add the field to `AssembledNonterminalInit`:

```ts
export interface AssembledNonterminalInit {
	readonly values: readonly NodeOrTerminal[];
	readonly fieldName?: string;
	readonly hasTrailing: boolean;
	readonly hasLeading: boolean;
	readonly separatorSource?: SeparatorSource;
	// ... rest unchanged
}
```

Add the field to `AssembledNonterminal` (readonly property, constructor assignment, and `.with()`'s spread):

```ts
export class AssembledNonterminal {
	// ... existing fields
	readonly separatorSource?: SeparatorSource;

	constructor(init: AssembledNonterminalInit) {
		// ... existing assignments
		this.separatorSource = init.separatorSource;
	}

	with(overrides: Partial<AssembledNonterminalInit>): AssembledNonterminal {
		return new AssembledNonterminal({
			// ... existing fields
			separatorSource: this.separatorSource,
			...overrides,
		});
	}
}
```

- [ ] **Step 4: Populate `separatorSource` in `collect-slots.ts`**

In `packages/codegen/src/compiler/collect-slots.ts`, at the site that already computes `sep`/`hasTrailing`/`hasLeading`/`separatorStr` (~lines 408-425):

```ts
	const sep =
		(rule as { separator?: RuleBase<'normalize'>['separator'] }).separator ??
		inheritedSeparator ??
		(isMultiSlot ? findNestedSeparator(rule) : undefined);
	const hasTrailing = isMultiSlot && (sep?.trailing === true || findRepeatFlag(rule, 'trailing'));
	const hasLeading = isMultiSlot && (sep?.leading === true || findRepeatFlag(rule, 'leading'));

	const separatorStr = isMultiSlot ? extractSeparatorString(sep) : undefined;
	const values: readonly NodeOrTerminal[] = stampSeparatorOnValues([...dedupedValues], separatorStr);

	// Non-literal (rule-shaped) separator: extractSeparatorString returned
	// undefined but sep itself is defined — capture the rule for Task 2/3's
	// runtime per-instance derivation. Literal separators (separatorStr set)
	// never populate this — they stay on the existing render-constant path.
	const separatorSource: SeparatorSource | undefined =
		isMultiSlot && sep !== undefined && separatorStr === undefined
			? { rule: sep.value, trailingPermitted: hasTrailing, leadingPermitted: hasLeading }
			: undefined;

	return new AssembledNonterminal({
		values,
		fieldName: (rule as { fieldName?: string }).fieldName,
		hasTrailing,
		hasLeading,
		separatorSource,
		sourceRuleIds: rule.id ? [rule.id] : [],
		ruleMetadata: rule.metadata,
	});
```

Add `SeparatorSource` to the existing `import { ... } from './model/node-map.ts'` block at the top of the file.

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts -t "separatorSource"
```

Expected: PASS (2/2).

- [ ] **Step 6: Regenerate all 3 grammars and confirm byte-neutral**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
git status --short packages/{rust,typescript,python}/src
```

Expected: no output from `git status` for `.ts` files under `src/` (this task only adds a compile-time field nothing downstream reads yet — byte-neutral). The `.sittir/generated.manifest.json` files for all 3 WILL show a diff (content hash of the compiler itself changed) — that's expected and gets staged.

- [ ] **Step 7: Run `tsgo --noEmit` and `validate:native` to confirm no regression**

```bash
pnpm exec tsgo --noEmit -p packages/codegen/tsconfig.build.json
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: 0 new type errors; `read-render-parseAstMatchPass` holds at rust=117/typescript=75/python=102 exactly (byte-neutral change).

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/collect-slots.ts packages/codegen/src/compiler/__tests__/collect-slots.test.ts packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): capture non-literal separator rule as SeparatorSource on the content slot (PR-T Task 1)"
```

Then, separately, if `validate:native` produced any test-fixtures/validation-report diff:

```bash
git add packages/tools/validation-report.json packages/tools/validation-history.jsonl rust/crates/sittir-*/test-fixtures.json
git commit -m "chore(validator): record validation run (rust/native, typescript/native, python/native)"
```

---

## Task 2: Native reader — preserve span/text for separator-candidate anonymous tokens

**Files:**
- Modify: `rust/crates/sittir-core/src/read_node.rs` (`read_children`, ~lines 117-166)
- Test: `rust/crates/sittir-core/tests/` — check for an existing `read_node`-focused Rust test file via `Glob "rust/crates/sittir-core/tests/*.rs"`; add to it or create `rust/crates/sittir-core/tests/read_node_separator_test.rs`

**Interfaces:**
- Consumes: nothing new from Task 1 (this task is independent of the TS-side compiler model — it's a pure wire-fidelity fix at the Rust reader layer).
- Produces: every child (fielded and anonymous) read by `read_children` now carries `child_index: Some(i)`. Per `scalar_child_value`'s EXISTING guard (`rust/crates/sittir-core/src/types.rs:633-641`, unmodified — `if node.child_index.is_some() || node.node_handle.is_some() { return None }` — i.e., presence of `child_index` already disqualifies scalarization), anonymous separator tokens now serialize as full `NodeData` (with `$span`/`$text`) instead of a bare `KindId` number. Task 3 consumes this on the wire as `data.$other` entries that now carry `$span`.

**Design note (why this is safe and minimal):** `read_materialized_leaf` (the function `read_children` already calls for every leaf child, fielded or not) already populates `span: Some(span)` and `text` — the data was NEVER missing at the point of reading; it was being discarded by `scalar_child_value` purely at JSON-serialization time, gated on a `child_index.is_none()` check that was trivially true because `read_materialized_leaf` unconditionally sets `child_index: None`. This task changes exactly one thing: `read_children` now passes the loop's own `i` through to the leaf constructor instead of discarding it.

- [ ] **Step 1: Write the failing test**

Find the existing test harness pattern first:

```bash
ls rust/crates/sittir-core/tests/
```

Read one existing test file to match the harness's parse/read call pattern (likely something that constructs a `Parsed`/`ParsedTree` and calls `read_root()`/`read_child()`, matching what `sittir-rust/src/lib.rs`'s `parse_and_read` calls). Write:

```rust
// rust/crates/sittir-core/tests/read_node_separator_test.rs
use sittir_core::read_node::read_root; // adjust import to actual public path

#[test]
fn anonymous_separator_token_preserves_span_and_text() {
    // Use a real tree-sitter grammar fixture already available to sittir-core's
    // test harness (check existing tests for how they obtain a Tree — likely
    // via a shared test-fixture grammar or a raw tree-sitter parse call).
    // Parse a minimal source with a comma-separated repeated field, e.g.
    // a tuple/array-literal-shaped construct from whichever fixture grammar
    // this crate's existing tests already use.
    let source = "(a, b, c)"; // adjust to whatever construct the available test grammar parses as repeat+comma
    let node_data = read_root(source /* , ...whatever additional params existing tests pass */);

    // Find an anonymous ',' child in $other/children and assert it carries span+text.
    let comma = node_data
        .children
        .as_ref()
        .expect("expected children")
        .iter()
        .find(|c| c.text.as_deref() == Some(","))
        .expect("expected a comma token in children");

    assert!(comma.span.is_some(), "comma token should preserve span after Task 2's fix");
    assert_eq!(comma.text.as_deref(), Some(","));
}
```

Adjust the fixture/source/import specifics once you've read an existing `sittir-core` test file for the real harness API — this crate is grammar-agnostic so the test needs whatever minimal tree-sitter grammar the existing test suite already links against.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cargo test -p sittir-core anonymous_separator_token_preserves_span_and_text
```

Expected: FAIL — the comma token currently serializes as a bare `KindId`, so `comma.text` is `None` after the round-trip (or, if the test operates on the pre-serialization `NodeData` directly rather than round-tripping through JSON, it will actually PASS at that layer since `read_materialized_leaf` already sets span/text before scalarization — in that case, rewrite the test to go through the actual `serde_json::to_string`/`from_str` round-trip via `NodeDataSer`/`NodeDataDe`, matching what `parse_and_read` really does, so it exercises `scalar_child_value` and fails for the right reason).

- [ ] **Step 3: Fix `read_children` to stamp `child_index`**

In `rust/crates/sittir-core/src/read_node.rs`, the anonymous-token branch (currently, ~line 152):

```rust
            None => {
                let data = if child.child_count() == 0 {
                    read_materialized_leaf(child, source)
                } else {
                    read_child_stub(child, source, node_handle, i as u16)
                };
                if child.is_named() {
                    assign_named_slot(&mut fields_acc, child.kind(), data);
                } else {
                    // Anonymous literal token — stays in the legacy children bucket.
                    // Stamp child_index (Task 2, PR-T) so scalar_child_value's
                    // existing child_index.is_some() guard preserves the full
                    // NodeData (span + text) instead of scalarizing to a bare
                    // KindId — needed for separator-candidate tokens so wrap.ts
                    // can span-correlate them against content elements to derive
                    // per-instance trailing/leading presence and separator kind.
                    children_acc.push(NodeData { child_index: Some(i as u16), ..data });
                }
            }
```

Read `NodeData`'s field list (`rust/crates/sittir-core/src/types.rs:210`, already read during planning — confirm `child_index: Option<u16>` is a real field with this exact name/type before writing `NodeData { child_index: Some(i as u16), ..data }` — struct-update syntax requires all other fields to already be set on `data`, which they are).

- [ ] **Step 4: Run the test to verify it passes**

```bash
cargo test -p sittir-core anonymous_separator_token_preserves_span_and_text
```

Expected: PASS.

- [ ] **Step 5: Run the full `sittir-core` test suite + workspace check**

```bash
cargo test -p sittir-core
cargo check --workspace
```

Expected: all green. `cargo check --workspace` confirms this change compiles cleanly against all 3 grammar crates that depend on `sittir-core`.

- [ ] **Step 6: Regenerate + `validate:native` — confirm the deep-AST gate holds**

This is a runtime/reader change, not a codegen-source change, so no `pnpm exec tsx ... gen` regeneration is needed — but the native `.node` binary DOES need rebuilding (validate:native's own `regen:all` step handles this).

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: `read-render-parseAstMatchPass` holds at rust=117/typescript=75/python=102 (this change only affects the WIRE SHAPE of `$other` entries that nothing downstream reads differently yet — Task 3 is what starts consuming the preserved span; until then this is payload-shape-only, behaviorally inert). Also confirm `covPass` unchanged (it should be — no template/render logic touched).

**Note on wire-payload size:** this change makes EVERY anonymous token in every `$other` bucket serialize as a full object instead of a bare number, not just separator-candidate ones (a per-field candidate-kind allowlist was considered and rejected for Task 2 as unnecessary complexity — see plan's Architecture section). If a future perf-tracking pass (per `project_perf_memory_ffi_tracking` memory) flags wire-payload growth from this change, the follow-up optimization is a per-node-kind static allowlist of separator-candidate `KindId`s (generated from `AssembledNonterminal.separatorSource`, Task 1) that `read_children` consults before stamping `child_index` — narrowing the fix to only tokens that are actually ever a separator for that node kind. Not implemented here (YAGNI until measured).

- [ ] **Step 7: Commit**

```bash
git add rust/crates/sittir-core/src/read_node.rs rust/crates/sittir-core/tests/read_node_separator_test.rs
git commit -m "fix(sittir-core): preserve span/text for anonymous separator tokens by stamping child_index (PR-T Task 2)"
```

If `validate:native` produced a fixtures/report diff, commit it separately per the Global Constraints.

---

## Task 3: wrap.ts — derive per-instance separator facts from `$other`

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` (`emitFieldCarryingWrap`'s per-field loop, ~lines 587-621; add a new helper alongside `collectWrapWireKeyTypes`/`resolveSlotStoreExpr`)
- Test: `packages/codegen/src/emitters/__tests__/wrap-variant-emit.test.ts` (or a new `wrap-separator-emit.test.ts` if the existing file is scoped tightly to variants — check first)

**Interfaces:**
- Consumes: `AssembledNonterminal.separatorSource` (Task 1), `data.$other` entries now carrying `$span` for anonymous separator tokens (Task 2), the existing `collectConcreteStorageKeys`/`_filterWrapChildrenByKind` machinery (both pre-existing, confirmed this session during the PR #152 work).
- Produces: for every `arity==='many'` field with `f.separatorSource` set, the generated wrap function emits three new sibling fields on the wrapped node object:
  - `_<name>_trailing_sep: boolean` — true when a separator-kind anonymous token's span falls after the last content element's span and before the node's own `$span.end`.
  - `_<name>_leading_sep: boolean` — true when a separator-kind anonymous token's span falls before the first content element's span.
  - `_<name>_separator_kind: number | undefined` — the numeric `KindId`/`$type` of ANY one matched separator token (all arms of a `choice` separator render identically per-instance — the grammar doesn't mix separator kinds within a single list in the cases this plan targets; per-gap heterogeneous separators are explicitly OUT OF SCOPE for this plan, see Task 6's scope note).
  Task 4 (render path) and Task 5 (Config surface) consume these three new sibling fields by name (`f.storageKey + '_trailing_sep'` etc.).

- [ ] **Step 1: Write the failing test**

Add to `packages/codegen/src/emitters/__tests__/wrap-variant-emit.test.ts` (or create `wrap-separator-emit.test.ts` alongside it, matching its existing harness pattern — read the existing file first to match its `makeSlot`/fixture-construction helpers):

```ts
it('emits trailing/leading/separator-kind sibling fields for a field with separatorSource', () => {
	const field = makeSlot({
		name: 'body',
		fieldName: 'body',
		arity: 'many',
		separatorSource: {
			rule: { type: CHOICE, members: [{ type: STRING, value: ',' }, { type: STRING, value: ';' }] },
			trailingPermitted: true,
			leadingPermitted: false
		}
		// ... other required AssembledNonterminal fixture fields, matching makeSlot's existing signature
	});

	const emitted = emitFieldCarryingWrap(/* node fixture */, [field], [], undefined, nodeMap);

	expect(emitted).toContain('_body_trailing_sep:');
	expect(emitted).toContain('_body_leading_sep:');
	expect(emitted).toContain('_body_separator_kind:');
});
```

Match the exact fixture-construction calling convention used by the existing tests in this file (`makeSlot`, `makeField`, or whatever the file's established helpers are called) rather than inventing new ones.

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/wrap-variant-emit.test.ts -t "separatorSource"
```

Expected: FAIL — no such fields emitted yet.

- [ ] **Step 3: Add the separator-candidate-kind derivation helper**

In `packages/codegen/src/emitters/wrap.ts`, near `collectWrapWireKeyTypes` (~line 434), add:

```ts
/**
 * Collect the concrete anonymous KindIds a field's non-literal separator rule
 * can parse as (e.g. `choice(',', ';')` → the KindIds for `,` and `;`).
 * Grammar-derived from `AssembledNonterminal.separatorSource.rule` (Task 1) —
 * never re-derived heuristically. Walks the same CHOICE/OPTIONAL/wrapper set
 * `findNestedSeparator`/`findRepeatFlag` already walk (dsl/rule-transforms.ts),
 * resolving each STRING/TOKEN leaf to its catalog KindId via kindEntries.
 */
function collectSeparatorCandidateKindIds(
	source: SeparatorSource,
	kindEntries: readonly KindEnumEntry[] | undefined
): readonly string[] {
	const kindExprs: string[] = [];
	const walk = (rule: Rule<'normalize'>): void => {
		switch (rule.type) {
			case CHOICE:
				for (const m of rule.members) walk(m as Rule<'normalize'>);
				return;
			case OPTIONAL:
			case GROUP:
				walk(rule.content as Rule<'normalize'>);
				return;
			case STRING:
			case TOKEN: {
				const expr = kindDiscriminantExpr(literalKindNameFor(rule), kindEntries);
				if (expr) kindExprs.push(expr);
				return;
			}
			default:
				return;
		}
	};
	walk(source.rule);
	return kindExprs;
}
```

Read `kindDiscriminantExpr` (already used in `emitFieldCarryingWrap` for the `reclaimKindIdsExpr` case, ~line 605) and confirm its exact signature before writing this — it may need a resolved kind NAME (string) rather than a raw rule; if so, add/reuse whatever helper already resolves a literal `StringRule`'s value to a catalog kind name (search for how `resolvedKind` gets populated on `NodeRef` — that's the exact derivation this needs to mirror, since it's the identical "literal rule → catalog anon kind" lookup). Write `literalKindNameFor` as a small local helper if no existing one fits, deriving from the same catalog lookup `resolvedKind` uses.

- [ ] **Step 4: Emit the three sibling fields in `emitFieldCarryingWrap`**

In the per-field loop (~line 587-621), after the existing `lines.push(`    ${f.storageKey}: ${storeExpr},`);` line, add:

```ts
		if (f.arity === 'many' && f.separatorSource) {
			const candidateKindExprs = collectSeparatorCandidateKindIds(f.separatorSource, kindEntries);
			if (candidateKindExprs.length > 0) {
				const kindsArrayExpr = `[${candidateKindExprs.join(', ')}]`;
				// Span-correlate $other entries whose $type is a separator-candidate
				// kind against this field's own (already-normalized) content values:
				// trailing = a matched token's span starts at/after the last content
				// value's span end; leading = a matched token's span ends at/before
				// the first content value's span start. Ties resolved by nearest.
				lines.push(
					`    ${f.storageKey}_trailing_sep: _detectFlankSeparator(data.$other, ${kindsArrayExpr}, ${f.storageKey}, 'trailing', data.$span),`
				);
				lines.push(
					`    ${f.storageKey}_leading_sep: _detectFlankSeparator(data.$other, ${kindsArrayExpr}, ${f.storageKey}, 'leading', data.$span),`
				);
				lines.push(`    ${f.storageKey}_separator_kind: _findSeparatorKind(data.$other, ${kindsArrayExpr}),`);
			}
		}
```

Add `_detectFlankSeparator` and `_findSeparatorKind` to wrap.ts's emitted runtime-helper boilerplate block (the same gated-emission region `normalizeRepeatedWrapSlot` lives in, ~line 998 area — search for the `usesNormalizeSingular || usesNormalizeRepeated`-style gate and add a parallel `usesFlankSeparatorDetection` gate driven by whether ANY field in the current grammar has a `separatorSource`):

```ts
function _findSeparatorKind(other: _NodeData['$other'], candidateKinds: readonly number[]): number | undefined {
	if (!other) return undefined;
	const list = Array.isArray(other) ? other : [other];
	for (const entry of list) {
		if (typeof entry === 'object' && entry !== null && '$type' in entry && candidateKinds.includes((entry as _NodeData).$type as number)) {
			return (entry as _NodeData).$type as number;
		}
	}
	return undefined;
}

function _detectFlankSeparator(
	other: _NodeData['$other'],
	candidateKinds: readonly number[],
	contentValue: unknown,
	flank: 'trailing' | 'leading',
	parentSpan: { start: number; end: number } | undefined
): boolean {
	if (!other || !parentSpan) return false;
	const list = Array.isArray(other) ? other : [other];
	const contentList = Array.isArray(contentValue) ? contentValue : contentValue !== undefined ? [contentValue] : [];
	const contentSpans = contentList
		.map((v) => (typeof v === 'object' && v !== null && '$span' in v ? (v as _NodeData).$span : undefined))
		.filter((s): s is { start: number; end: number } => s !== undefined);
	if (contentSpans.length === 0) return false;
	const boundary = flank === 'trailing' ? Math.max(...contentSpans.map((s) => s.end)) : Math.min(...contentSpans.map((s) => s.start));
	for (const entry of list) {
		if (typeof entry !== 'object' || entry === null || !('$type' in entry) || !('$span' in entry)) continue;
		const e = entry as _NodeData;
		if (!candidateKinds.includes(e.$type as number)) continue;
		const span = e.$span;
		if (!span) continue;
		if (flank === 'trailing' && span.start >= boundary) return true;
		if (flank === 'leading' && span.end <= boundary) return true;
	}
	return false;
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/wrap-variant-emit.test.ts -t "separatorSource"
```

Expected: PASS.

- [ ] **Step 6: Regenerate all 3 grammars, confirm the TypeScript `object_type`/`interface_body` case now emits the new fields**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
grep -n "_content_trailing_sep\|_content_leading_sep\|_content_separator_kind" packages/typescript/src/wrap.ts | head -5
```

Expected: at least one match — `object_type_content`/`interface_body`'s wrap function (whichever slot carries the `choice(',', $._semicolon)` separator per the spec's grounding note) now emits these three fields. If zero matches, the `separatorSource` isn't reaching this slot — check Task 1's `isMultiSlot`/`sep` derivation actually fires for this specific rule shape before proceeding (this is the concrete case the whole plan targets; do not proceed to Task 4 until this check passes).

- [ ] **Step 7: `tsgo --noEmit` + `validate:native`**

```bash
pnpm exec tsgo --noEmit -p packages/typescript/tsconfig.build.json
pnpm exec tsgo --noEmit -p packages/rust/tsconfig.build.json
pnpm exec tsgo --noEmit -p packages/python/tsconfig.build.json
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: 0 new type errors across all 3; `read-render-parseAstMatchPass` and deep-AST hold at the Task 0 baseline (this task only ADDS new wire fields nothing renders from yet — Task 4 is what changes rendered output).

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/__tests__/wrap-variant-emit.test.ts packages/{rust,typescript,python}/src/wrap.ts packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): wrap.ts derives per-instance trailing/leading/separator-kind from preserved \$other spans (PR-T Task 3)"
```

Plus a separate validator-record commit if fixtures changed.

---

## Task 4: Render path — thread captured facts into `ListNonterminalView`

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`renderTransportDataStruct`'s field loop, ~line 3225; `buildTypedTemplateBody`'s hardcoded `leading: false`/`trailing: false`, ~lines 1482-1483)
- Test: `packages/codegen/src/emitters/__tests__/render-module.test.ts` (or equivalent existing test file — `Glob` first)

**Interfaces:**
- Consumes: Task 3's three sibling wrap fields (by naming convention `_<name>_trailing_sep`/`_<name>_leading_sep`/`_<name>_separator_kind`), which flow into generated napi transport structs as new `Option<bool>`/`Option<u32>` fields (JS factories write these keys the same way they write `_<name>` today — no new factory-side plumbing needed beyond Task 5's Config surface).
- Produces: `ListNonterminalView.leading`/`.trailing` now receive the captured per-instance value (falling back to `false` when the slot has no `separatorSource`, i.e. today's behavior for the vast majority of slots is UNCHANGED — this is additive, zero-risk for every slot that isn't separator-shaped).

- [ ] **Step 1: Write the failing test for the transport struct field**

Add to the render-module test file (match its existing pattern for asserting on emitted Rust struct text):

```ts
it('emits trailing_sep/leading_sep sibling fields on the transport struct for a separatorSource field', () => {
	const node = /* fixture node with a field having arity:'many' + separatorSource, matching Task 3's fixture */;
	const lines = renderTransportDataStruct('ObjectTypeContentTransport', node, slotModel, nodeMap);
	const text = lines.join('\n');
	expect(text).toContain('pub content_trailing_sep: Option<bool>');
	expect(text).toContain('pub content_leading_sep: Option<bool>');
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module.test.ts -t "trailing_sep"
```

Expected: FAIL.

- [ ] **Step 3: Extend `renderTransportDataStruct`'s field-emission loop**

In `packages/codegen/src/emitters/render-module.ts`, in `renderTransportDataStruct` (~line 3199+), immediately after the existing per-field loop:

```ts
			for (const field of [...slotModel.named, ...slotModel.unnamed]) {
				lines.push(...renderTransportField(field, node.kind, node.typeName, nodeMap));
			}
```

add:

```ts
			for (const field of [...slotModel.named, ...slotModel.unnamed]) {
				if (field.arity !== 'many' || !field.separatorSource) continue;
				const rustName = rustFieldIdent(field.storageName);
				lines.push('#[cfg_attr(feature = "napi-bindings", napi(js_name = "_' + `${field.storageName}_trailing_sep` + '"))]');
				lines.push(`    pub ${rustName}_trailing_sep: Option<bool>,`);
				lines.push('#[cfg_attr(feature = "napi-bindings", napi(js_name = "_' + `${field.storageName}_leading_sep` + '"))]');
				lines.push(`    pub ${rustName}_leading_sep: Option<bool>,`);
			}
```

Match the EXACT attribute-emission style `renderTransportField` already uses for a normal field (read its full body first — `js_name` attribute formatting, `pub` field declaration style, any doc-comment convention) rather than the sketch above; the sketch conveys intent, the implementer must match the established formatting exactly (this codebase's existing fields use a specific macro/attribute layout that must be replicated verbatim, not approximated).

- [ ] **Step 4: Wire `buildTypedTemplateBody` to read the captured value instead of hardcoding `false`**

In `packages/codegen/src/emitters/render-module.ts`, `buildTypedTemplateBody` (~lines 1482-1483), replace:

```ts
lines.push(`            leading: false,`);
lines.push(`            trailing: false,`);
```

with:

```ts
const rustName = rustFieldIdent(f.storageName);
if (f.separatorSource) {
	lines.push(`            leading: node.${rustName}_leading_sep.unwrap_or(false),`);
	lines.push(`            trailing: node.${rustName}_trailing_sep.unwrap_or(false),`);
} else {
	lines.push(`            leading: false,`);
	lines.push(`            trailing: false,`);
}
```

Confirm `f` (the loop variable at this exact point in `buildTypedTemplateBody`) is the same `EmittedField`/slot type that carries `separatorSource` — trace back to where `fields: EmittedField[]` is constructed (~line 638, `surface.slots.map(...)`) and confirm `separatorSource` survives that mapping; if `EmittedField` doesn't already carry it, add it to the mapping (`separatorSource: multipleByName... ` — actually source it from the original `slotModel` lookup by name, mirroring how `separatorByName` is already populated a few lines above in the same function).

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module.test.ts -t "trailing_sep"
```

Expected: PASS.

- [ ] **Step 6: Regenerate, `cargo check --workspace`, `validate:native` — the deep-AST gate is the real acceptance check here**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
cargo check --workspace
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: `cargo check` clean across rust/typescript/python crates. `read-render-parse-shallowAstMatchPass` (deep-AST) **improves** for typescript specifically — the `{ foo: string; }` case should now round-trip with its trailing `;` preserved. Confirm by finding the specific failure in the deep-AST mismatch list before this task and confirming it's gone after:

```bash
pnpm exec tsx packages/cli/src/cli.ts tool dump-ast-mismatches --grammar typescript --deep 2>&1 | grep -i "object_type\|interface_body"
```

Expected: this specific mismatch class is no longer present (or has moved further down a different, unrelated failure).

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-module.test.ts packages/{rust,typescript,python}/src/wrap.ts rust/crates/sittir-*/src/render/transport.rs rust/crates/sittir-*/src/lib.rs packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): thread captured trailing/leading separator facts into ListNonterminalView (PR-T Task 4)"
```

Plus a separate validator-record commit.

---

## Task 5: Config surface options block (`{ separator?, trailing?, leading? }`)

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (Config type emission + factory body construction for `arity==='many'` fields with `separatorSource`)
- Test: `packages/codegen/src/emitters/__tests__/factories-config.test.ts` or equivalent existing factory-emission test file

**Interfaces:**
- Consumes: `AssembledNonterminal.separatorSource` (Task 1), the `${configKey}` naming convention (`node-map.ts:1985-2048`, unchanged).
- Produces: for a field with `separatorSource`, the generated `Config` type gains a nested settable options object:
  ```ts
  readonly bodyOptions?: { separator?: string; trailing?: boolean; leading?: boolean };
  ```
  and the factory body, when this option is supplied, writes it through to the wrap-consumed sibling keys (`_body_trailing_sep`, `_body_leading_sep`) instead of leaving them to be derived from `$other` (which only applies to parsed/read nodes, never to freshly-constructed ones — a factory-built node has no `$other` separator tokens to correlate against, so this options block is the ONLY way a hand-constructed node gets a non-default trailing/leading separator).

**Design note (no existing precedent — confirmed during planning research):** the Config surface today is flat (`node-map.ts:1985-2048`, `factories.ts:647-1094`, one `configKey` per slot, no nested sub-objects). This task introduces the first nested options-object shape on Config. Keep the blast radius minimal: only fields with `separatorSource` get this treatment; every other field's Config shape is completely unaffected.

- [ ] **Step 1: Write the failing test**

```ts
it('emits a settable options block on Config for a field with separatorSource', () => {
	const node = /* fixture with a separatorSource field named body */;
	const configType = emitConfigType(node, nodeMap); // adjust to actual exported name
	expect(configType).toContain('readonly bodyOptions?:');
	expect(configType).toContain('separator?: string');
	expect(configType).toContain('trailing?: boolean');
	expect(configType).toContain('leading?: boolean');
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/factories-config.test.ts -t "bodyOptions"
```

Expected: FAIL.

- [ ] **Step 3: Add the options-block emission to the Config type**

In `packages/codegen/src/emitters/factories.ts`, find the Config-type-emission loop (the function that emits `readonly ${f.configKey}?: ...` per field — read it in full first to match its exact structure and the surrounding function signature) and add, for each field with `separatorSource`:

```ts
if (f.arity === 'many' && f.separatorSource) {
	lines.push(`  readonly ${f.configKey}Options?: { separator?: string; trailing?: boolean; leading?: boolean };`);
}
```

- [ ] **Step 4: Wire the factory body to consume it**

In the factory-body-construction function (the counterpart that builds the actual object literal a factory call produces — find via the same read as Step 3), for each field with `separatorSource`, thread the options block's `trailing`/`leading` into the sibling storage keys:

```ts
if (f.arity === 'many' && f.separatorSource) {
	lines.push(`    ${f.storageKey}_trailing_sep: config?.${f.configKey}Options?.trailing,`);
	lines.push(`    ${f.storageKey}_leading_sep: config?.${f.configKey}Options?.leading,`);
}
```

Match the exact `config?.` access pattern the surrounding factory body already uses for other optional Config fields (read a neighboring emitted line for the precise style before writing this).

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/factories-config.test.ts -t "bodyOptions"
```

Expected: PASS.

- [ ] **Step 6: Regenerate all 3, `tsgo --noEmit`, `validate:native`**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
pnpm exec tsgo --noEmit -p packages/rust/tsconfig.build.json
pnpm exec tsgo --noEmit -p packages/typescript/tsconfig.build.json
pnpm exec tsgo --noEmit -p packages/python/tsconfig.build.json
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: 0 new type errors; baseline holds or improves.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/__tests__/factories-config.test.ts packages/{rust,typescript,python}/src/factories.ts packages/{rust,typescript,python}/.sittir/generated.manifest.json
git commit -m "feat(codegen): add settable {separator,trailing,leading} options block to Config for separator-source fields (PR-T Task 5)"
```

Plus a separate validator-record commit.

---

## Task 6: End-to-end validation + close the `interface_body`/`object_type` diagnostic loop

**Files:**
- Modify: `packages/codegen/src/compiler/__tests__/generate.test.ts` (update the pinned `non-literal-separator` diagnostic count for the typescript `interface_body`/`object_type` case, ~lines 85-197)
- Modify (only if needed after investigation): `packages/codegen/src/compiler/link.ts` (`liftSeparators`'s diagnostic-emission condition — should the warning stop firing once derivation has successfully attached a `separatorSource`? Read the current condition first and decide; the master-plan's acceptance gate says PR-T "clears exactly the cases PR-S's warning flags" — this implies the warning SHOULD stop firing for cases PR-T now handles, so `liftSeparators`'s diagnostic condition likely needs to gate on "AND no downstream separatorSource attachment occurred" — but since `liftSeparators` runs at LINK phase, before `collect-slots.ts`'s ASSEMBLE-phase derivation, it cannot know in advance whether attachment will succeed. Resolve this ordering question directly: read both phases' relative execution order via `packages/codegen/src/compiler/generate.ts`'s pipeline, and if link necessarily precedes assemble, the warning must stay a link-phase "advisory, not yet resolved" signal — in that case, DO NOT change `link.ts`; only update the test's documentation comment to clarify the diagnostic is now advisory-only in ALL cases PR-T can reach, not evidence of an actual rendering gap. Do not guess — trace the actual phase order before editing.)

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: a validated, byte-faithful round-trip for TypeScript's `interface_body`/`object_type` construct with both comma and semicolon separators, mixed and uniform.

- [ ] **Step 1: Manual round-trip check against the concrete target case**

```bash
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar typescript --kind interface_body --source "interface Foo { a: string; b: number; }"
```

Expected: rendered output matches the input byte-for-byte (trailing `;` preserved). Also test the comma-variant and the no-trailing-separator variant:

```bash
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar typescript --kind object_type --source "type Foo = { a: string, b: number }"
pnpm exec tsx packages/cli/src/cli.ts tool probe-kind --grammar typescript --kind interface_body --source "interface Foo { a: string; b: number }"
```

Expected: both byte-faithful.

- [ ] **Step 2: Read `generate.ts`'s phase order to resolve the diagnostic-timing question**

```bash
grep -n "liftSeparators\|collect-slots\|assemble" packages/codegen/src/compiler/generate.ts
```

Determine whether link-phase (where `liftSeparators`/the diagnostic fires) runs strictly before assemble-phase (where `separatorSource` gets attached). Document the finding in this task's commit message.

- [ ] **Step 3: Update the pinned test**

In `packages/codegen/src/compiler/__tests__/generate.test.ts` (~lines 159-197), read the existing test and its comment ("This diagnostic is expected to keep firing here until that follow-up (or PR-T) lands..."). Based on Step 2's finding:
- If the diagnostic is confirmed to remain an unconditional link-phase advisory (most likely, given phase ordering): update ONLY the comment to state PR-T has landed and the diagnostic is now advisory (a heads-up that a non-literal separator exists) rather than evidence of a rendering gap — the assertion count (`rust=0, python=0, typescript=1`) likely stays unchanged. Do not change the assertion unless Step 2 proves the diagnostic can and should be suppressed post-attachment.
- If Step 2 finds the diagnostic CAN be conditioned on attachment success (e.g. assemble-phase results are available before the diagnostic is finalized/reported, not just before it's initially raised), update `liftSeparators` accordingly and change the assertion to `typescript=0`.

- [ ] **Step 4: Run the updated test**

```bash
pnpm exec vitest run packages/codegen/src/compiler/__tests__/generate.test.ts
```

Expected: PASS with the updated expectation.

- [ ] **Step 5: Full validate:native run — confirm final numbers**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Record the final rust/typescript/python `read-render-parseAstMatchPass` and deep-AST numbers. Expected: hold-or-improve vs. the Task 0 baseline (rust=117/typescript=75/python=102 deep=118/49/106) — typescript's deep-AST number specifically should improve (the `interface_body`/`object_type` mismatch class closes).

- [ ] **Step 6: Run the full emitter + compiler test suites**

```bash
pnpm exec vitest run packages/codegen/src
```

Expected: all green, no regressions in unrelated emitter/compiler tests.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/__tests__/generate.test.ts
git commit -m "test(codegen): update non-literal-separator diagnostic expectation now that PR-T derives interface_body's separator (PR-T Task 6)"
```

Plus a final validator-record commit with the confirmed end-state numbers.

---

## Amendment (2026-07-12): scope extension after Task 3 investigation

Task 3's implementation exposed that the plan's original validation target (TypeScript's `interface_body`/`object_type`) was structurally unreachable — `_object_type_optional1` (the synthesized wrapper backing `interface_body`) is a tree-sitter-inlined helper kind that never gets its own wrap function, and the live, non-inlined rules that actually replaced `object_type`'s body (`object_type_content_comma`/`_semi`, `packages/typescript/overrides.ts`) were deliberately given literal separators to fix a different, real round-trip bug (`{ a; }` → `{ a }`) and a phantom-content-slot bug. A dedicated feasibility investigation (this session) confirmed: reverting that override to a single rule-shaped-separator rule is safe at the parser level (removes a GLR conflict, doesn't introduce one — the conflict exists BECAUSE of the split) and is a net fidelity improvement (the current split actually REJECTS legal mixed comma/semi lists at parse time; the revert makes them parseable). But it requires two small extensions beyond the original Tasks 3/4:

### Extension A (fold into Task 3's completion, before its commit)

**File:** `packages/codegen/src/compiler/link.ts` — `absorbTrailingSeparator`'s `isOptionalSepLit` predicate (~line 2644-2648) and `liftCommaSep`'s `matchesOptionalSep` + leading-absorb Case 3 (~lines 2679-2683, 2694-2701) currently hard-gate on LITERAL STRING equality between a flanking `optional(...)` member's content and the separator. Widen both to structural `rulesEqual(optionalMember.content, separator.value)` comparison so `optional(choice(',', ';'))` folds into the enclosing repeat's `trailing`/`leading` flags exactly the way `optional(',')` already does — this is squarely PR-T's own design principle ("a separator-shaped member never becomes its own slot") applied to the CHOICE case, not a new mechanism. Confirmed empirically (via a throwaway `link.ts` pipeline run against the reverted rule shape) that without this, the flanking optional-choice members survive as slot-value pollution (the merged content slot's value union gains bare `,`/`;` terminal entries) and `trailingPermitted`/`leadingPermitted` come out `false` even though the grammar genuinely permits them. Add a leading-absorb case if one doesn't already exist for the literal path either (the investigation found the literal path currently relies on `collectSlots` eliding a bare `optional(STRING)`, which does NOT elide `optional(CHOICE)` — a nonterminal). Roughly 20-30 LOC + tests in `link.ts`'s existing separator-lifting test suite.

### Extension B (fold into Task 4)

**File:** `packages/codegen/src/emitters/render-module.ts`'s `buildTypedTemplateBody` (the same site Task 4 already modifies for `leading`/`trailing`). Task 4 as originally written only threads the captured trailing/leading booleans into `ListNonterminalView` — it never wires `_<name>_separator_kind` (Task 3's third captured fact) into the view's `separator` field, so a rule-shaped separator would still fall back to the node-wide default literal and Bug 2 (wrong separator on round-trip) would NOT actually be fixed. Extension: at the SAME emission site, when `f.separatorSource` is set, emit a Rust `match` mapping each candidate KindId (derived from `f.separatorSource.rule`'s STRING arms + `kindEntries`, the SAME derivation Task 3's `collectSeparatorCandidateKindExprs` helper already computes at codegen time — reuse it, don't recompute) to its literal text, with a `None` arm falling back to the existing static `${fieldSepLiteral}`/`DEFAULT_JOIN_SEPARATOR` behavior (covers factory-constructed nodes without a captured kind — Task 5's options-block `separator?: string` override takes precedence when present, same pattern as trailing/leading).

### New Task 7: revert `packages/typescript/overrides.ts`'s `object_type` split

**Files:**
- Modify: `packages/typescript/overrides.ts` (delete `object_type_content_comma`/`object_type_content_semi`, replace `object_type_content` with a single rule: `seq(optional(choice(',', ';')), seq(member, repeat(seq(choice(',', ';'), member))), optional(choice(',', ';')))` — the NESTED `seq(member, repeat(seq(sep, member)))` form is load-bearing, confirmed via the investigation that it lifts via `liftCommaSep`'s Case 1 to a clean `REPEAT1`; a flat member-list form does NOT lift, `liftCommaSep` caps at 3 members. Use literal `';'`, NOT upstream's `$._semicolon` — the investigation confirmed the override already dropped ASI-separator support (no new regression, but don't reintroduce a zero-width external-token arm that would verbatim-render as an empty string); delete the `conflicts` entry `[$.object_type_content_comma, $.object_type_content_semi]` (~overrides.ts:104, dangling refs break `tree-sitter generate` otherwise).
- Modify: `packages/typescript/tests/nodes.test.ts` (4 references to the deleted split kinds — update to the merged `object_type_content` kind).
- Regenerate: typescript grammar (`gen --grammar typescript --all`), typescript corpus fixtures, `.sittir/parser.wasm` (via the existing `compileParser`/`validate:native` pipeline).

**Acceptance (this becomes Task 6's real validation target, replacing the original unreachable one):**
- `interface Foo { a: string; b: number; }` round-trips byte-faithfully (trailing `;` preserved — the original motivating bug).
- `type Foo = { a: string, b: number }` round-trips byte-faithfully (comma form, unchanged).
- A genuinely MIXED-separator instance (`{ a, b; c }` — legal upstream, REJECTED by the current split at parse time) now parses AND round-trips (uniform `_separator_kind` capture — the plan's own "explicitly out of scope: genuine per-gap mixed separators" carve-out still applies to rendering an ARBITRARY per-gap-heterogeneous instance byte-faithfully, but the instance must at least PARSE and round-trip using ONE recovered separator kind, which is a strict improvement over today's outright parse rejection).
- `validate:native` deep-AST for typescript improves (the `interface_body`/`object_type` mismatch class this whole plan targets actually closes, for real this time).
- Override parser corpus error count (`CLAUDE.md`'s tracked comparison table) does not regress.

## Explicitly out of scope (YAGNI, documented per spec)

- **Genuine per-gap mixed separators** (a single list where different gaps use different separator kinds, not just "the grammar permits either but any one instance is uniform") — the spec allows for this ("rare genuine-mixing case stores a per-gap list") but no real grammar case in rust/typescript/python currently exercises it. `_findSeparatorKind` (Task 3) returns the FIRST matched kind, treating the list as uniform. If a future grammar needs genuine per-gap heterogeneity, extend `_detectFlankSeparator`'s sibling fields to a per-gap array — not attempted here.
- **Leading separators in any of the 3 current grammars** — `leadingPermitted`/`_leading_sep` are implemented symmetrically with trailing (same mechanism, no extra cost to include), but no currently-known real grammar case in rust/typescript/python needs a leading rule-shaped separator to validate against. The mechanism is proven via the trailing case (`interface_body`); leading is exercised only by the unit tests in Tasks 3-5, not an end-to-end grammar case.
- **A per-node-kind separator-candidate-KindId allowlist to narrow Task 2's wire-payload growth** — deferred until a real perf-tracking pass measures actual payload impact (see Task 2's design note).
