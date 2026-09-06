# Punctuation Seam Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every seam in a render rule that touches a punctuation literal is a spacing site named by the token (`lparen_before`, `rparen_after`), owned by the kind that holds it, materialized on the transport like a separator site, and written through a root writer that coalesces adjacent seam whitespace to the wider.

**Architecture:** A second function in the render-rules module runs after the template emitter's seam-stamping dry run and injects `choice(_tight, _space, _newline)` between the members of every seq where one member is a punctuation literal, its default arm read from the stamp (`space` where the body already baked a space, `tight` otherwise) and overridden by the grammar's `patches:` defaults. The body IR gains a `seam` node that prints as `{<site>}`; the render module binds each seam local from the transport's site field; every option-driven whitespace string (`spacing_text`) now carries an in-band seam mark, and the `SpacingWriter` holds the marked payload and merges consecutive payloads by width before writing.

**Tech Stack:** TypeScript codegen (`packages/codegen`), `sittir-core` writer and options, generated Rust render crates, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md`. Rulings after the spec (2026-09-06): operator slots (a fielded choice of literals) get no site in this slice; the intended route for them is a keyed seam mark resolved by the writer, unset meaning lexical, recorded in the spec's out-of-scope list by Task 6. Path-form addressing of one occurrence of a token in a kind is also deferred; one site per (kind, token, side).

## Global Constraints

- The six dogfood renders (rust, rust-strict, ts, ts-strict, py, py-strict from `examples/17|18|19-dogfood-*.ts`) are byte-identical to the baseline captured in Task 0.
- Validator counts identical to the previous run: rust 149/149 207/207 134/137 1517/1517; typescript 145/145 193/193 112/114 1202/1202; python 126/126 142/142 115/116 1390/1390 (`pnpm exec tsx packages/cli/src/cli.ts validate counts`).
- `pnpm run type-check`; `pnpm exec vitest run --root packages/codegen`, `--root packages/tools`, `--root packages/cli`; per-package `pnpm exec vitest run` in `packages/{rust,typescript,python}`; `rtk cargo test --workspace --exclude sittir-parity-tests`; `bash scripts/assert-scope-boundaries.sh`.
- Generated files (`packages/<g>/src/*`, `packages/<g>/.sittir/*`, `rust/crates/sittir-<g>/src/*`) are never hand-edited; regenerate.
- No comments in `packages/codegen/src/`; every added or changed declaration gets its `docs/glossary/<dir>.md` entry in Task 6.
- Work on a new branch `feat/punctuation-seams` stacked on `feat/askama-retirement`; commit by pathspec (`git commit -- <paths>`); never stage the untracked `*-roles.scm`, `sittir-role-interfaces-scm-spec.md`, the older handoff drafts, `packages/types/.vitest-report.json`, or the two pre-existing modifications (`docs/superpowers/handoffs/2026-09-02-example-gaps-bare-input-handoff.md`, `examples/01-construct-nodes.ts`).
- A failed gate stops the work for review; nothing is auto-reverted.

## File structure

| File | Responsibility |
| --- | --- |
| `packages/codegen/src/dsl/primitives/spacing.ts` | `seamLabel`, `parseSeamLabel` beside the separator label helpers |
| `packages/codegen/src/dsl/wire/wire.ts` | `patches:` accepts `<token>_before\|_after` at the top level and under a kind |
| `rust/crates/sittir-core/src/spacing.rs` | `SEAM` mark; payload capture; width coalescing; `finish` |
| `rust/crates/sittir-core/src/options.rs` | `ResolvedOptions.labels` (per-label values, shaped for the operator follow-up) |
| `packages/codegen/src/compiler/model/render-rules.ts` | `seamRenderRules`, `isSeamChoice`, `seamPartOf`, `validateRenderDefaults`; seam sites in `spacingSitesOf`; `SpacingSide` gains `'seam'` |
| `packages/codegen/src/emitters/render-body.ts` | `SeamNode`, `seam()`, `SEAM_MARK`; every node switch gains the case |
| `packages/codegen/src/emitters/templates.ts` | seam parts held across a boundary in `emitRule`'s seq join; guards in `pickConditionalKey`, `renderRuleEdge`, `scanArmBody` |
| `packages/codegen/src/emitters/emit.ts` | pass order: separators, stamp, seams |
| `packages/codegen/src/emitters/render-module.ts` | seam locals bound from the transport; `references` covers seams; `render_transport_dispatch` calls `finish` |
| `packages/codegen/src/emitters/render-options-rs.ts` | marked `spacing_text`; `LABEL_COUNT`; label vector in `defaults()` and `resolve()` |
| `packages/tools/src/validate/render-bodies.ts`, `packages/codegen/src/emitters/__tests__/support/show-body.ts` | the `seam` case in the two body consumers outside codegen proper |

---

### Task 0: Baseline capture and branch

**Files:**
- Create (scratchpad, not committed): `<scratchpad>/dogfood.ts`

- [ ] **Step 1: Branch**

```bash
git checkout -b feat/punctuation-seams
```

- [ ] **Step 2: Write the render-capture script**

Write `<scratchpad>/dogfood.ts` (absolute imports into the repo; `$render()` takes no options):

```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { rebuildSplice } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/17-dogfood-rust.ts';
import { rebuildSpliceStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/17-dogfood-rust-strict.ts';
import { rebuildFormat } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/18-dogfood-typescript.ts';
import { rebuildFormatStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/18-dogfood-typescript-strict.ts';
import { rebuildProbeSweep } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/19-dogfood-python.ts';
import { rebuildProbeSweepStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/19-dogfood-python-strict.ts';

const outDir = process.argv[2]!;
mkdirSync(outDir, { recursive: true });
const cases: [string, () => { $render(): string }][] = [
	['rust', rebuildSplice],
	['rust-strict', rebuildSpliceStrict],
	['ts', rebuildFormat],
	['ts-strict', rebuildFormatStrict],
	['py', rebuildProbeSweep],
	['py-strict', rebuildProbeSweepStrict]
];
for (const [name, build] of cases) {
	const text = build().$render();
	writeFileSync(`${outDir}/${name}.txt`, text);
	console.log(`${name}: ${text.length} chars`);
}
```

- [ ] **Step 3: Capture the baseline**

Run from the repo root: `pnpm exec tsx <scratchpad>/dogfood.ts <scratchpad>/renders-baseline`
Expected sizes: rust 2222, rust-strict 745, ts 473, ts-strict 569, py 196, py-strict 203. If a size differs, stop: the tree is not at the expected state.

- [ ] **Step 4: Record the validator baseline**

Run: `pnpm exec tsx packages/cli/src/cli.ts validate counts`
Expected: the numbers in Global Constraints. (This is the pre-change run; the hook may auto-commit a `chore(validator)` record, which is fine.)

---

### Task 1: Seam labels in the DSL and in `patches:`

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/spacing.ts`
- Modify: `packages/codegen/src/dsl/wire/wire.ts:333-385` (`renderDefaultsOf`, `structuralPatchesOf`) and the helpers at `:270-332`
- Test: `packages/codegen/src/dsl/__tests__/render-defaults.test.ts`

**Interfaces:**
- Produces: `seamLabel(token: string, side: SeparatorSide): string` → `` `${token}_${side}` ``; `parseSeamLabel(name: string): { readonly token: string; readonly side: SeparatorSide } | undefined` (undefined for any separator spacing label); `RenderDefaults.labels[<token>_<side>]` and `RenderDefaults.sites[<kind>][<token>_<side>]` populated from `patches:`.

- [ ] **Step 1: Write the failing tests**

Append to `render-defaults.test.ts`:

```ts
import { parseSeamLabel, seamLabel } from '../primitives/spacing.ts';

describe('seam labels', () => {
	it('name a punctuation token and a side, and never a separator label', () => {
		expect(seamLabel('lparen', 'before')).toBe('lparen_before');
		expect(parseSeamLabel('lparen_before')).toEqual({ token: 'lparen', side: 'before' });
		expect(parseSeamLabel('colon_colon_after')).toEqual({ token: 'colon_colon', side: 'after' });
		expect(parseSeamLabel('comma_separator_space_before')).toBeUndefined();
		expect(parseSeamLabel('lparen')).toBeUndefined();
		expect(parseSeamLabel('block_start')).toBeUndefined();
	});
});

describe('seam defaults declared in patches', () => {
	const str = (value: string) => ({ type: 'STRING', value });
	const rules = { call: () => str('x'), lparen_after: () => str('y') };

	it('collect a top-level token seam and a kind-level one, leaving no rule behind', () => {
		const wired = wire({
			rules,
			patches: {
				lparen_before: preference('lparen_before', 'space'),
				call: { rparen_before: preference('rparen_before', 'newline') }
			}
		} as never);
		expect(wired.__wireContext__?.defaults).toEqual({
			labels: { lparen_before: 'space' },
			sites: { call: { rparen_before: { label: 'rparen_before', arm: 'newline' } } }
		});
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('leave a rule spelled like a seam label to the patch machinery', () => {
		const wired = wire({ rules, patches: { lparen_after: preference('quote', '"') } } as never);
		expect(wired.__wireContext__?.defaults).toBeUndefined();
		expect(Object.keys(wired.rules).sort()).toEqual(['call', 'lparen_after']);
	});

	it('refuse a relabel, a whitespace arm outside tight/space/newline, and a mismatched kind-level key', () => {
		expect(() => wire({ rules, patches: { lparen_before: preference('paren_gap', 'space') } } as never)).toThrow(
			/'lparen_before' is named by its token and side/
		);
		expect(() => wire({ rules, patches: { lparen_before: preference('lparen_before', 'indent') } } as never)).toThrow(
			/'lparen_before' defaults to 'indent', not one of tight, space, newline/
		);
		expect(() => wire({ rules, patches: { call: { lparen_before: preference('rparen_before', 'space') } } } as never)).toThrow(
			/call\.lparen_before names a token seam by 'rparen_before'/
		);
	});
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/dsl/__tests__/render-defaults.test.ts`
Expected: FAIL (`seamLabel` is not exported).

- [ ] **Step 3: Implement `spacing.ts`**

Add after `parseSpacingLabel`:

```ts
export function seamLabel(token: string, side: SeparatorSide): string {
	return `${token}_${side}`;
}

const SEAM_LABEL = /^([a-z][a-z0-9_]*?)_(before|after)$/;

export function parseSeamLabel(name: string): { readonly token: string; readonly side: SeparatorSide } | undefined {
	if (parseSpacingLabel(name) !== undefined) return undefined;
	const m = SEAM_LABEL.exec(name);
	return m ? { token: m[1]!, side: m[2] as SeparatorSide } : undefined;
}
```

- [ ] **Step 4: Implement `wire.ts`**

Import `parseSeamLabel` from `../primitives/spacing.ts`. Add beside `isFlankDefaultKey`:

```ts
function isSeamDefaultKey(key: string, rules: ReadonlySet<string>): boolean {
	return parseSeamLabel(key) !== undefined && !rules.has(key) && !rules.has(`_${key}`);
}
```

In `renderDefaultsOf`, after the spacing-label branch and before the flank branch:

```ts
		if (isSeamDefaultKey(key, rules)) {
			const { label, default: arm } = onePreference(key, entry, 'a token seam preference');
			if (label !== key) throw new Error(`patches: '${key}' is named by its token and side; preference('${label}', …) does not rename it`);
			labels[key] = checkSpacingArm(`'${key}'`, arm);
			continue;
		}
```

In the kind-level loop, replace `const address = siteKey(slot, label);` with:

```ts
				const seam = parseSeamLabel(slot);
				if (seam !== undefined && label !== slot) {
					throw new Error(`patches: ${key}.${slot} names a token seam by '${label}'; the key is the label`);
				}
				const address = seam === undefined ? siteKey(slot, label) : slot;
```

In `structuralPatchesOf`, extend the skip: `if (!entry || parseSpacingLabel(kind) !== undefined || isFlankDefaultKey(kind, rules) || isSeamDefaultKey(kind, rules)) continue;`

- [ ] **Step 5: Run the test file and the dsl suite**

Run: `pnpm exec vitest run --root packages/codegen src/dsl`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/dsl/primitives/spacing.ts packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/dsl/__tests__/render-defaults.test.ts
git commit -m "feat(dsl): token seam labels; patches accept <token>_before|_after at the top level and under a kind" -- packages/codegen/src/dsl/primitives/spacing.ts packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/dsl/__tests__/render-defaults.test.ts
```

---

### Task 2: The writer holds marked seam whitespace and coalesces by width

**Files:**
- Modify: `rust/crates/sittir-core/src/spacing.rs`

**Interfaces:**
- Produces: `pub const SEAM: char = '\u{FDD2}'`, `pub const SEAM_STR: &str`; `SpacingWriter::finish(&mut self) -> fmt::Result`. Contract: after a `SEAM`, `INDENT` or `DEDENT` mark, the whitespace run that follows it **in the same `write_str` call** is the mark's payload and is held, not written; consecutive payloads merge to the wider by rank (`""` < spaces < anything containing `\n`), ties keep the first; the held payload is written before the next non-empty text, and by `finish`. `INDENT`/`DEDENT` still move the depth at the mark. `ADJACENT` is unchanged. Literal text is never coalesced.

- [ ] **Step 1: Write the failing tests**

Add a module at the end of `spacing.rs`:

```rust
#[cfg(test)]
mod seam_tests {
    use super::*;
    use std::fmt::Write;

    fn run(parts: &[&str]) -> String {
        let mut out = String::new();
        let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident());
        for p in parts {
            w.write_str(p).unwrap();
        }
        w.finish().unwrap();
        out
    }

    #[test]
    fn a_seam_mark_writes_its_payload_before_the_next_text() {
        assert_eq!(run(&["a", "\u{FDD2} ", "b"]), "a b");
        assert_eq!(run(&["a", "\u{FDD2}\n", "b"]), "a\nb");
        assert_eq!(run(&["a", "\u{FDD2}", "b"]), "ab");
    }

    #[test]
    fn consecutive_seams_coalesce_to_the_wider_in_either_order() {
        assert_eq!(run(&["a", "\u{FDD2} ", "\u{FDD2}\n", "b"]), "a\nb");
        assert_eq!(run(&["a", "\u{FDD2}\n", "\u{FDD2} ", "b"]), "a\nb");
        assert_eq!(run(&["a", "\u{FDD2}", "\u{FDD2} ", "b"]), "a b");
        assert_eq!(run(&["a", "\u{FDD2} ", "\u{FDD2} ", "b"]), "a b");
    }

    #[test]
    fn a_tight_seam_across_a_word_hazard_still_gets_the_lexical_space() {
        assert_eq!(run(&["pub", "\u{FDD2}", "fn"]), "pub fn");
        assert_eq!(run(&["pub", "\u{FDD2}", "("]), "pub(");
    }

    #[test]
    fn literal_whitespace_is_never_coalesced() {
        assert_eq!(run(&["a", "\u{FDD2} ", "  b"]), "a   b");
        assert_eq!(run(&["a", " ", "\u{FDD2} ", "b"]), "a  b");
        assert_eq!(run(&["a", "\u{FDD2} x", "b"]), "a xb");
    }

    #[test]
    fn a_space_seam_beside_an_indent_flank_keeps_the_indent_and_the_depth() {
        assert_eq!(run(&["{", "\u{FDD2} ", INDENT_NEWLINE, "a", DEDENT_NEWLINE, "\u{FDD2} ", "}"]), "{\n    a\n}");
    }

    #[test]
    fn a_bare_dedent_never_drops_a_following_seam() {
        assert_eq!(run(&["a", "\u{FDD1}", "\u{FDD2}\n", "b"]), "a\nb");
    }

    #[test]
    fn an_adjacency_mark_survives_a_tight_seam() {
        assert_eq!(run(&["a", ADJACENT_STR, "\u{FDD2}", "b"]), "ab");
    }

    #[test]
    fn a_trailing_seam_is_written_by_finish() {
        assert_eq!(run(&["a", "\u{FDD2}\n"]), "a\n");
    }
}
```

The existing `adjacent_tests` cases keep their expectations unchanged; they must still pass.

- [ ] **Step 2: Run to verify they fail**

Run: `rtk cargo test -p sittir-core seam_tests`
Expected: FAIL to compile (`finish` missing).

- [ ] **Step 3: Implement**

Constants beside `INDENT`/`DEDENT`:

```rust
/// The seam mark: the whitespace that follows it in the same write is option
/// whitespace (a separator, a flank, a token seam), held by the writer and
/// merged with a neighbouring seam to the wider before it is written.
pub const SEAM: char = '\u{FDD2}';
pub const SEAM_STR: &str = "\u{FDD2}";
```

Struct fields: add `seam: Option<SeamRank>` and `seam_text: String` (initialized `None` / `String::new()` in `new`).

```rust
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum SeamRank {
    Tight,
    Space,
    Newline,
}

fn seam_rank(text: &str) -> SeamRank {
    if text.is_empty() {
        SeamRank::Tight
    } else if text.contains('\n') {
        SeamRank::Newline
    } else {
        SeamRank::Space
    }
}
```

Rename today's `write_chunk` body to `write_text` (unchanged logic, including the empty early return). New `write_chunk` and helpers:

```rust
    fn flush_seam(&mut self) -> std::fmt::Result {
        if self.seam.take().is_none() {
            return Ok(());
        }
        let text = std::mem::take(&mut self.seam_text);
        let result = self.write_text(&text);
        self.seam_text = text;
        result
    }

    fn merge_seam(&mut self, text: &str) {
        let rank = seam_rank(text);
        if self.seam.is_some_and(|current| current >= rank) {
            return;
        }
        self.seam = Some(rank);
        self.seam_text.clear();
        self.seam_text.push_str(text);
    }

    fn write_chunk(&mut self, s: &str) -> std::fmt::Result {
        if s.is_empty() {
            return Ok(());
        }
        self.flush_seam()?;
        self.write_text(s)
    }

    /// Writes any held seam whitespace. The root render calls it once after
    /// the tree has been written, so a trailing seam reaches the sink.
    pub fn finish(&mut self) -> std::fmt::Result {
        self.flush_seam()
    }
```

`write_str`:

```rust
    fn write_str(&mut self, s: &str) -> std::fmt::Result {
        let mut rest = s;
        while let Some(i) = rest.find(is_mark) {
            self.write_chunk(&rest[..i])?;
            let mark = rest[i..].chars().next().expect("a mark was found");
            rest = &rest[i + mark.len_utf8()..];
            if mark == ADJACENT {
                self.adjacent_next = true;
                continue;
            }
            match mark {
                INDENT => self.depth += 1,
                DEDENT => self.depth = self.depth.saturating_sub(1),
                _ => {}
            }
            let end = rest.find(|c: char| !c.is_whitespace()).unwrap_or(rest.len());
            self.merge_seam(&rest[..end]);
            rest = &rest[end..];
        }
        self.write_chunk(rest)
    }
```

Delete `take_mark`; `is_mark` gains `|| c == SEAM`. Update the module doc's list of marks.

- [ ] **Step 4: Run the core suite**

Run: `rtk cargo test -p sittir-core`
Expected: PASS, including the pre-existing `adjacent_tests`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): the writer holds marked seam whitespace and coalesces neighbours to the wider" -- rust/crates/sittir-core/src/spacing.rs
```

---

### Task 3: The token-seam pass

**Files:**
- Modify: `packages/codegen/src/compiler/model/render-rules.ts`
- Test: `packages/codegen/src/compiler/model/__tests__/render-rules.test.ts`

**Interfaces:**
- Consumes: `seamLabel`, `parseSeamLabel` (Task 1); `matchesWordShape` from `../../util/word-matcher.ts`; the `staticSeamBefore?: 'glued' | 'spaced'` stamp on seq members (`types/rule.ts:69`).
- Produces: `SpacingSide` gains `'seam'`; `seamRenderRules(spaced: RenderRules, config: RenderRulesConfig): RenderRules`; `isSeamChoice(rule: RenderRule): boolean`; `seamPartOf(rule: RenderRule): SpacingPart` (fieldName = label = `<token>_<side>`, side `'seam'`); `validateRenderDefaults(defaults: RenderDefaults | undefined, sites: readonly RuleSpacingSite[], nodeMap: NodeMap): void`; `spacingSitesOf` also returns seam sites (`slot` = token kind name, `address` = label, `side: 'seam'`). `spaceRenderRules` no longer validates defaults; `DefaultResolver` is constructed as `new DefaultResolver(defaults, nodeMap)`.

- [ ] **Step 1: Write the failing tests**

In `render-rules.test.ts`, extend `kindEntries` with the bracket kinds and add a `seamed` helper:

```ts
const kindEntries = [
	{ kind: 'comma', anon: true, symbolName: ',', member: 'Comma', id: 5 },
	{ kind: 'lparen', anon: true, symbolName: '(', member: 'Lparen', id: 7 },
	{ kind: 'rparen', anon: true, symbolName: ')', member: 'Rparen', id: 8 },
	{ kind: 'lbrace', anon: true, symbolName: '{', member: 'Lbrace', id: 9 },
	{ kind: 'tight', member: 'Tight', id: 90 },
	{ kind: 'space', member: 'Space', id: 91 },
	{ kind: 'newline', member: 'Newline', id: 92 }
] as never;

const seamed = (rules: Record<string, RenderRule>, slots: Record<string, string> = {}, extra: object = {}) => {
	const config = { nodeMap: nodeMapOf(rules, slots), kindEntries, ...extra };
	return { config, out: seamRenderRules(spaceRenderRules(config), config) };
};
const memberNames = (rule: RenderRule) =>
	(rule as unknown as { members: RenderRule[] }).members.map((m) => (isSeamChoice(m) ? `S(${seamPartOf(m).fieldName})` : ((m as { value?: string; name?: string }).value ?? (m as { name?: string }).name!)));
```

Add the import: `import { flanksOf, isSeamChoice, seamPartOf, seamRenderRules, spaceRenderRules, spacedSeparatorOf, spacingSitesOf } from '../render-rules.ts';`

```ts
describe('seamRenderRules', () => {
	it('injects a token seam choice on the token side of every seam, skipping keywords and seq edges', () => {
		const call = seq(str('fn'), sym('name'), str('('), sym('params'), str(')'));
		const { out, config } = seamed({ call });
		expect(memberNames(out.rules.call!)).toEqual(['fn', 'name', 'S(lparen_before)', '(', 'S(lparen_after)', 'params', 'S(rparen_before)', ')']);
		const part = seamPartOf((out.rules.call as unknown as { members: RenderRule[] }).members[2]!);
		expect(part).toEqual({ fieldName: 'lparen_before', label: 'lparen_before', side: 'seam', defaultArm: 'tight' });
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.kind}.${s.slot} ${s.label}=${s.defaultArm} @${s.address} ${s.side}`)).toEqual([
			'call.lparen lparen_before=tight @lparen_before seam',
			'call.lparen lparen_after=tight @lparen_after seam',
			'call.rparen rparen_before=tight @rparen_before seam'
		]);
	});

	it('defaults to space where the seam-stamping dry run baked a space', () => {
		const spacedParen = { ...str(')'), staticSeamBefore: 'spaced' } as unknown as RenderRule;
		const { out } = seamed({ call: seq(sym('x'), spacedParen) });
		expect(seamPartOf((out.rules.call as unknown as { members: RenderRule[] }).members[1]!).defaultArm).toBe('space');
	});

	it('gives two adjacent tokens both sites on the one seam, left after then right before', () => {
		const { out } = seamed({ body: seq(sym('x'), str(')'), str('{'), sym('y')) });
		expect(memberNames(out.rules.body!)).toEqual(['x', 'S(rparen_before)', ')', 'S(rparen_after)', 'S(lbrace_before)', '{', 'S(lbrace_after)', 'y']);
	});

	it('resolves a seam default by kind, then supertype, then label, then the stamp', () => {
		const rules = { a: seq(sym('x'), str('(')), b: seq(sym('x'), str('(')), c: seq(sym('x'), str('(')), d: seq(sym('x'), str('(')) };
		const config = {
			nodeMap: nodeMapOf(rules, {}, { supertypes: { _expression: ['b'] } }),
			kindEntries,
			defaults: {
				labels: { lparen_before: 'newline' },
				sites: { a: { lparen_before: { arm: 'space' } }, _expression: { lparen_before: { arm: 'tight' } } }
			}
		};
		const out = seamRenderRules(spaceRenderRules(config), config);
		const arm = (kind: string) => seamPartOf((out.rules[kind] as unknown as { members: RenderRule[] }).members[1]!).defaultArm;
		expect([arm('a'), arm('b'), arm('c'), arm('d')]).toEqual(['space', 'tight', 'newline', 'newline']);
	});

	it('leaves separators, flanks, whitespace-only literals, optional literals and inlined helper rules alone', () => {
		const rules = {
			list: seq(str('('), commaList(), str(')')),
			owner: seq(sym('_helper', { inline: true })),
			_helper: seq(str('('), sym('x')),
			blank: seq(sym('x'), str(' '), sym('y')),
			opt: seq(sym('x'), { ...str(';'), multiplicity: 'optional' } as unknown as RenderRule)
		};
		const { out, config } = seamed(rules, { r1: 'items' });
		const listMembers = (out.rules.list as unknown as { members: RenderRule[] }).members;
		expect(spacedSeparatorOf(listMembers[2]!)?.token).toEqual(str(','));
		expect(memberNames(out.rules.list!)).toEqual(['(', 'S(lparen_after)', 'item', 'S(rparen_before)', ')']);
		expect(out.rules._helper).toBe(rules._helper);
		expect(out.rules.blank).toBe(rules.blank);
		expect(out.rules.opt).toBe(rules.opt);
		expect(spacingSitesOf(out, config.nodeMap).filter((s) => s.side === 'seam').map((s) => s.kind)).toEqual(['list', 'list']);
	});

	it('returns the rules untouched when the grammar registers no whitespace kinds', () => {
		const rules = { call: seq(sym('x'), str('(')) };
		const config = { nodeMap: nodeMapOf(rules, {}, { whitespace: false }), kindEntries };
		expect(seamRenderRules(spaceRenderRules(config), config).rules).toBe(rules);
	});

	it('fails on a default that names no preference, no site or no arm', () => {
		const rules = { list: commaList(), call: seq(sym('x'), str('(')) };
		const at = (defaults: object) => () => seamed(rules, { r1: 'items' }, { defaults });
		expect(at({ labels: { semi_separator_space_before: 'tight' }, sites: {} })).toThrow(/'semi_separator_space_before' is not a spacing preference/);
		expect(at({ labels: { rparen_before: 'tight' }, sites: {} })).toThrow(/'rparen_before' is not a spacing preference/);
		expect(at({ labels: {}, sites: { block: { items_separator_space_before: { arm: 'tight' } } } })).toThrow(/'block' names no kind or supertype with a spacing site/);
		expect(at({ labels: {}, sites: { list: { items_separator_space: { arm: 'tight' } } } })).toThrow(/list\.items_separator_space names no site/);
		expect(at({ labels: {}, sites: { call: { rparen_before: { arm: 'tight' } } } })).toThrow(/call\.rparen_before names no site/);
		expect(at({ labels: { comma_separator_space_before: 'wide' }, sites: {} })).toThrow(/is 'wide', not one of tight, space, newline/);
		expect(at({ labels: { lparen_before: 'indent' }, sites: {} })).toThrow(/is 'indent', not one of tight, space, newline/);
	});
});
```

Delete the old `fails on a default that names no preference, no site or no arm` case under `describe('spaceRenderRules')` (validation moves), and in the `sym` helper allow `inline` through `extra` (it already spreads `extra`).

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/model/__tests__/render-rules.test.ts`
Expected: FAIL (`seamRenderRules` is not exported).

- [ ] **Step 3: Implement**

Imports: add `SEQ` is already imported; add `matchesWordShape` from `'../../util/word-matcher.ts'`; add `parseSeamLabel, seamLabel` and `type SeparatorSide` to the `spacing.ts` import.

`SpacingSide`: `export type SpacingSide = 'before' | 'after' | 'gap' | 'seam' | FlankSide;`

`Bag`: add `readonly literal?: string; readonly inline?: boolean; readonly staticSeamBefore?: 'glued' | 'spaced';`.

`DefaultResolver`: constructor becomes `constructor(defaults: RenderDefaults | undefined, nodeMap: NodeMap)`; delete `#validate` and its call. Replace `resolveSeparator` with a shared private resolver:

```ts
	#resolve(kind: string, address: string, label: string, fallback: SpacingArm): SpacingArm {
		const site = this.#site(kind, address);
		if (site !== undefined) return site.arm as SpacingArm;
		const top = this.#defaults.labels[label];
		return top === undefined ? fallback : (top as SpacingArm);
	}

	resolveSeparator(kind: string, slot: string, label: string): SpacingArm {
		return this.#resolve(kind, siteKey(slot, label), label, SPACING_DEFAULT);
	}

	resolveSeam(kind: string, label: string, fallback: SpacingArm): SpacingArm {
		return this.#resolve(kind, label, label, fallback);
	}
```

New exported validator (replaces the deleted `#validate`):

```ts
export function validateRenderDefaults(defaults: RenderDefaults | undefined, sites: readonly RuleSpacingSite[], nodeMap: NodeMap): void {
	if (defaults === undefined) return;
	const labels = new Set<string>();
	const addresses = new Map<string, Set<string>>();
	for (const site of sites) {
		const kind = publicKindName(site.kind);
		const isFlank = site.side === 'start' || site.side === 'end';
		if (!isFlank) labels.add(site.label);
		const set = addresses.get(kind) ?? new Set<string>();
		set.add(isFlank ? site.side : site.address);
		addresses.set(kind, set);
	}
	const membersOf = new Map<string, string[]>();
	for (const [supertype, members] of buildSupertypeMembersMap(nodeMap)) {
		membersOf.set(publicKindName(supertype), members.map(publicKindName));
	}
	for (const [key, arm] of Object.entries(defaults.labels)) {
		if (!labels.has(key)) throw new Error(`defaults: '${key}' is not a spacing preference of this grammar`);
		if (!isSpacingArm(arm)) throw new Error(`defaults: '${key}' is '${arm}', not one of ${SPACING_ARMS.join(', ')}`);
	}
	for (const [key, value] of Object.entries(defaults.sites)) {
		const kind = publicKindName(key);
		const kinds = addresses.has(kind) ? [kind] : (membersOf.get(kind) ?? []).filter((m) => addresses.has(m));
		if (kinds.length === 0) throw new Error(`defaults: '${key}' names no kind or supertype with a spacing site`);
		for (const [address, site] of Object.entries(value)) {
			if (!kinds.some((k) => addresses.get(k)!.has(address))) throw new Error(`defaults: ${key}.${address} names no site`);
			const isFlank = address === 'start' || address === 'end';
			if (isFlank ? !isWhitespaceArm(site.arm) : !isSpacingArm(site.arm)) {
				throw new Error(`defaults: ${key}.${address} is '${site.arm}', not one of ${(isFlank ? FLANK_START_ARMS : SPACING_ARMS).join(', ')}`);
			}
		}
	}
}
```

Seam helpers and the pass:

```ts
function isAnyWhitespaceChoice(rule: RenderRule): boolean {
	return isSpacingChoice(rule) || isWhitespaceChoice(rule, FLANK_START_ARMS) || isWhitespaceChoice(rule, FLANK_END_ARMS);
}

export function isSeamChoice(rule: RenderRule): boolean {
	if (!isSpacingChoice(rule)) return false;
	const label = bag(bag(rule).members![0]!).annotations?.preference;
	return label !== undefined && parseSeamLabel(label) !== undefined;
}

export function seamPartOf(rule: RenderRule): SpacingPart {
	return partOf(rule, 'seam');
}

function literalTextOf(rule: RenderRule): string | undefined {
	const r = bag(rule);
	if (r.type === STRING) {
		if (r.multiplicity === 'optional' || (r.nonterminal === true && r.fieldName !== undefined)) return undefined;
		return typeof r.value === 'string' ? r.value : undefined;
	}
	if (r.type === SYMBOL && r.literal !== undefined && r.fieldName === undefined) return r.literal;
	return undefined;
}

function punctuationTokenOf(rule: RenderRule, config: RenderRulesConfig): string | undefined {
	const text = literalTextOf(rule);
	if (text === undefined || text.trim() === '' || matchesWordShape(text, config.nodeMap.wordMatcher)) return undefined;
	const entry = findEntryForLiteralText(config.kindEntries, text);
	return entry === undefined ? undefined : publicKindName(entry.kind);
}

function inlinedRuleNames(rules: Readonly<Record<string, RenderRule>>): ReadonlySet<string> {
	const out = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, undefined, (_, r) => {
			const b = bag(r);
			if (b.type === SYMBOL && b.inline === true && b.name !== undefined) out.add(b.name);
			return undefined;
		});
	}
	return out;
}

function seamChoice(kind: string, token: string, side: SeparatorSide, fallback: SpacingArm, resolver: DefaultResolver, symbols: Symbols): RenderRule {
	const label = seamLabel(token, side);
	return whitespaceChoice({ fieldName: label, label, side: 'seam', defaultArm: resolver.resolveSeam(kind, label, fallback) }, SPACING_ARMS, symbols);
}

function withTokenSeams(rule: RenderRule, kind: string, config: RenderRulesConfig, resolver: DefaultResolver, symbols: Symbols): RenderRule {
	const r = bag(rule);
	if (r.type !== SEQ || r.members === undefined || r.members.length < 2 || flanksOf(rule) !== undefined) return rule;
	const members: RenderRule[] = [r.members[0]!];
	for (let i = 1; i < r.members.length; i++) {
		const left = r.members[i - 1]!;
		const right = r.members[i]!;
		if (!isAnyWhitespaceChoice(left) && !isAnyWhitespaceChoice(right)) {
			const fallback: SpacingArm = bag(right).staticSeamBefore === 'spaced' ? 'space' : 'tight';
			const leftToken = punctuationTokenOf(left, config);
			const rightToken = punctuationTokenOf(right, config);
			if (leftToken !== undefined) members.push(seamChoice(kind, leftToken, 'after', fallback, resolver, symbols));
			if (rightToken !== undefined) members.push(seamChoice(kind, rightToken, 'before', fallback, resolver, symbols));
		}
		members.push(right);
	}
	return members.length === r.members.length ? rule : ({ ...(rule as object), members } as unknown as RenderRule);
}

export function seamRenderRules(spaced: RenderRules, config: RenderRulesConfig): RenderRules {
	const symbols = whitespaceSymbols(config.nodeMap, SPACING_ARMS);
	if (symbols === undefined) return spaced;
	const resolver = new DefaultResolver(config.defaults, config.nodeMap);
	const inlined = inlinedRuleNames(spaced.rules);
	const out: Record<string, RenderRule> = {};
	for (const [kind, rule] of Object.entries(spaced.rules)) {
		if (inlined.has(kind)) {
			out[kind] = rule;
			continue;
		}
		const visit = (r: RenderRule): RenderRule => withTokenSeams(r, kind, config, resolver, symbols);
		out[kind] = visit(walker.map(rule, visit));
	}
	const result: RenderRules = { rules: out };
	validateRenderDefaults(config.defaults, spacingSitesOf(result, config.nodeMap), config.nodeMap);
	return result;
}
```

`spaceRenderRules`: construct the resolver as `new DefaultResolver(config.defaults, config.nodeMap)`; nothing else changes.

`spacingSitesOf`: inside the fold callback, after the `flanks` block and before `if (!isRepeated(r)) return undefined;`:

```ts
			const b = bag(r);
			if (b.type === SEQ && b.members !== undefined) {
				for (const m of b.members) {
					if (!isSeamChoice(m)) continue;
					const part = seamPartOf(m);
					add(kind, parseSeamLabel(part.label)!.token, part, part.label);
				}
			}
```

- [ ] **Step 4: Run the test file and the compiler suite**

Run: `pnpm exec vitest run --root packages/codegen src/compiler`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(render-rules): token seam choices injected after the seam stamps; defaults validated over every site" -- packages/codegen/src/compiler/model/render-rules.ts packages/codegen/src/compiler/model/__tests__/render-rules.test.ts
```

---

### Task 4: The seam node in the body IR and the template emitter

**Files:**
- Modify: `packages/codegen/src/emitters/render-body.ts`
- Modify: `packages/codegen/src/emitters/templates.ts` (`renderRuleEdge` :268, `joinStaticSeam` :443, `emitRule` SEQ :481-545, `pickConditionalKey` :901, `scanArmBody` :948)
- Modify: `packages/codegen/src/emitters/__tests__/support/show-body.ts`
- Modify: `packages/tools/src/validate/render-bodies.ts` (`bodyToLegacyRule`)
- Test: `packages/codegen/src/emitters/__tests__/render-body.test.ts`, `packages/codegen/src/emitters/__tests__/templates-emitter-emitRule.test.ts`, `packages/tools/src/__tests__/render-bodies.test.ts`

**Interfaces:**
- Consumes: `isSeamChoice`, `seamPartOf` (Task 3).
- Produces: `SeamNode { kind: 'seam'; field: string }`; `seam(field: string): Body`; `SEAM_MARK = '\u{FDD2}'`; `BodyReferences.seams: readonly string[]`; `printRustBody` prints a seam as `{<field>}` inside the `write!` format string; `joinStaticSeam(body, segment, spaced, seams = EMPTY)`.

- [ ] **Step 1: Write the failing body tests**

In `render-body.test.ts` add `seam` and `SEAM_MARK` to the import and:

```ts
describe('seam nodes', () => {
	it('print as an interpolated field, compare by field, and are listed by references', () => {
		expect(SEAM_MARK).toBe('\u{FDD2}');
		expect(printRustBody(concat(text('fn'), seam('lparen_before'), text('('), slot('x')), { field: (n) => n })).toEqual([
			'    write!(f, "fn{lparen_before}({x}")?;',
			'    Ok(())'
		]);
		expect(equalBodies(seam('a'), seam('a'))).toBe(true);
		expect(equalBodies(seam('a'), seam('b'))).toBe(false);
		expect(references(concat(seam('a'), gate('x', concat(seam('b'), slot('x'))))).seams).toEqual(['a', 'b']);
		expect(refersTo(seam('x'), 'x')).toBe(false);
		expect(mentions(seam('x'), 'x')).toBe(false);
		expect(edgeChar(seam('x'), 'starts')).toBe('{');
		expect(isExpression(seam('x'))).toBe(true);
	});

	it('keeps a gate whose arm holds a seam as a gate', () => {
		const lifted = liftGates(gate('x', concat(text('->'), seam('arrow_after'), slot('x'))), () => 'optional');
		expect(lifted.flanks.size).toBe(0);
		expect(lifted.body[0]!.kind).toBe('if');
	});
});
```

(`equalBodies` is exported already; add it to the import.)

- [ ] **Step 2: Write the failing emitter tests**

In `templates-emitter-emitRule.test.ts` add a seam-choice builder after `makeCtx` and a `describe`:

```ts
function seamChoice(label: string): ChoiceRule {
	return {
		type: CHOICE,
		nonterminal: true,
		fieldName: label,
		members: ['_tight', '_space', '_newline'].map((name, i) => ({
			type: SYMBOL,
			name,
			nonterminal: true,
			annotations: { preference: label, ...(i === 0 ? { default: true } : {}) }
		}))
	} as unknown as ChoiceRule;
}

describe('emitRule — token seams', () => {
	it('prints a seam choice as a seam node between its neighbours', () => {
		const rule = { type: SEQ, members: [{ type: STRING, value: 'fn' }, seamChoice('lparen_before'), { type: STRING, value: '(' }] } as unknown as SeqRule;
		expect(shown(rule, makeCtx())).toBe('fn⟨seam lparen_before⟩(');
	});

	it('lets the seam replace a statically spaced seam and precede a glued expression after its adjacency mark', () => {
		const hazardCtx = makeCtx({ isLiteralMergePair: (l: string, r: string) => l === '.' && r === '=' });
		const spaced = { type: SEQ, members: [{ type: STRING, value: '..' }, seamChoice('eq_before'), { type: STRING, value: '=>' }] } as unknown as SeqRule;
		expect(shown(spaced, hazardCtx)).toBe('..⟨seam eq_before⟩=>');
		const two = { type: SEQ, members: [{ type: STRING, value: ')' }, seamChoice('rparen_after'), seamChoice('lbrace_before'), { type: STRING, value: '{' }] } as unknown as SeqRule;
		expect(shown(two, makeCtx())).toBe(')⟨seam rparen_after⟩⟨seam lbrace_before⟩{');
	});

	it('keeps a seam that ends up first when the member before it renders nothing', () => {
		const rule = { type: SEQ, members: [{ type: STRING, value: ';', multiplicity: 'optional' }, seamChoice('lparen_before'), { type: STRING, value: '(' }] } as unknown as SeqRule;
		expect(shown(rule, makeCtx())).toBe('⟨seam lparen_before⟩(');
	});

	it('never picks a seam choice as the conditional key of an optional seq', () => {
		const rule = {
			type: SEQ,
			multiplicity: 'optional',
			members: [{ type: STRING, value: '->' }, seamChoice('arrow_after'), { type: SYMBOL, name: 'ret', fieldName: 'ret', nonterminal: true }]
		} as unknown as SeqRule;
		expect(shown(rule, makeCtx())).toBe('⟨if ret⟩->⟨seam arrow_after⟩⟨ret⟩⟨end⟩');
	});
});
```

In `packages/tools/src/__tests__/render-bodies.test.ts`, extend the `bodyToLegacyRule` fixture with `{ kind: 'seam', field: 'lparen_before' }` between two text nodes and assert it contributes nothing to the template string.

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/render-body.test.ts src/emitters/__tests__/templates-emitter-emitRule.test.ts`
Expected: FAIL (`seam` is not exported).

- [ ] **Step 4: Implement `render-body.ts`**

```ts
export const SEAM_MARK = '\u{FDD2}';

export interface SeamNode {
	readonly kind: 'seam';
	readonly field: string;
}

export type BodyNode = TextNode | WhitespaceNode | SlotNode | SpaceNode | AdjacentNode | SeamNode | IfNode;

export function seam(field: string): Body {
	return [{ kind: 'seam', field }];
}
```

Cases to add: `opensAsExpression`: `|| node.kind === 'seam'`; `edgeChar`: `case 'seam':` with `'whitespace' | 'slot' | 'if'` (braces); `equalNodes`: `case 'seam': return a.field === (b as SeamNode).field;`; `refersTo`/`mentions`: fall to `default: return false` (no change); `weight`: `case 'seam': total += node.field.length + EXPRESSION_OVERHEAD;`; `references`: collect `seams` (add `readonly seams: readonly string[]` to `BodyReferences`); `literalOf` in `liftGates`: unchanged (the default branch returns `undefined`, so a gate holding a seam stays a gate); `printStatements`: `case 'seam': format += \`{${printer.field(node.field)}}\`; interpolated = true; break;`. `isPlainText` unchanged (a seam is not plain text).

- [ ] **Step 5: Implement `templates.ts`**

Imports: `isSeamChoice, seamPartOf` from `../compiler/model/render-rules.ts`; `seam` from `./render-body.ts`.

`renderRuleEdge`, SEQ case: `for (const m of members) { if (isSeamChoice(m)) continue; … }`.

`joinStaticSeam`:

```ts
function joinStaticSeam(body: Body, segment: Body, spaced: boolean, seams: Body = EMPTY): Body {
	if (spaced) return concat(body, seams.length > 0 ? seams : SPACE, segment);
	return concat(body, isExpression(segment) ? ADJACENT : EMPTY, seams, segment);
}
```

`emitRule` SEQ: in the `forEach`, `const part = isSeamChoice(m) ? seam(seamPartOf(m).fieldName) : emitRule(m, ctx);`. Rewrite `joinParts`:

```ts
			const isSeam = (b: Body): boolean => b.length === 1 && b[0]!.kind === 'seam';
			const joinParts = (segments: Body[], firstIdx: number): Body => {
				let body: Body | undefined;
				let seams: Body = EMPTY;
				let lastRealPartIdx = -1;
				for (let i = 0; i < segments.length; i++) {
					const segment = segments[i]!;
					if (isSeam(segment)) {
						seams = concat(seams, segment);
						continue;
					}
					const rightPartIdx = firstIdx + i;
					if (body === undefined) {
						body = concat(seams, segment);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const stamped = rule.members[partIndices[rightPartIdx]!]!.staticSeamBefore;
					const l = edgeChar(body, 'ends');
					const r = edgeChar(segment, 'starts');
					if (stamped !== undefined) {
						const spaced = stamped === 'spaced';
						recordSeam(l, r, spaced ? 'static-spaced' : 'static-glued');
						body = joinStaticSeam(body, segment, spaced, seams);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					const leftRule = partRules[lastRealPartIdx]!;
					const rightRule = partRules[rightPartIdx]!;
					const classification = classifySeqBoundary(l, r, leftRule, rightRule, ctx);
					if (classification.resolution === 'runtime-varying') {
						recordSeam(l, r, 'runtime-varying');
						if (DBG_SEAM_VARIES) {
							if (classification.leftVaries)
								tallySeamVariesReason(`left:${describeVariesReason(leftRule, 'ends', ctx, new Set())}`);
							if (classification.rightVaries)
								tallySeamVariesReason(`right:${describeVariesReason(rightRule, 'starts', ctx, new Set())}`);
							if (classification.mergePairAmbiguous) tallySeamVariesReason('merge-pair-ambiguous');
						}
						body = concat(body, seams, segment);
						seams = EMPTY;
						lastRealPartIdx = rightPartIdx;
						continue;
					}
					recordSeam(l, r, classification.resolution);
					const isGlued = classification.resolution !== 'static-spaced';
					stampSeam(rightPartIdx, isGlued ? 'glued' : 'spaced');
					body = joinStaticSeam(body, segment, !isGlued, seams);
					seams = EMPTY;
					lastRealPartIdx = rightPartIdx;
				}
				return concat(body ?? EMPTY, seams);
			};
```

`pickConditionalKey`: first line `if (isSeamChoice(content)) return undefined;`.

`scanArmBody`: `case 'seam':` grouped with `case 'space': break;`.

- [ ] **Step 6: Implement the two body consumers**

`show-body.ts`: `case 'seam': out += \`⟨seam ${node.field}⟩\`; break;`.
`render-bodies.ts` (`bodyToLegacyRule`): `case 'seam': break;` beside `'adjacent'`.

- [ ] **Step 7: Run the suites**

Run: `pnpm exec vitest run --root packages/codegen src/emitters` and `pnpm exec vitest run --root packages/tools`
Expected: PASS. If any pre-existing emitter test fails, isolate with stash-and-rerun before accepting it as unrelated.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(templates): the body IR carries token seams; the seq join holds them across a boundary" -- packages/codegen/src/emitters/render-body.ts packages/codegen/src/emitters/templates.ts packages/codegen/src/emitters/__tests__/support/show-body.ts packages/codegen/src/emitters/__tests__/render-body.test.ts packages/codegen/src/emitters/__tests__/templates-emitter-emitRule.test.ts packages/tools/src/validate/render-bodies.ts packages/tools/src/__tests__/render-bodies.test.ts
```

---

### Task 5: Emit order, seam locals, marked whitespace text, label vector

**Files:**
- Modify: `packages/codegen/src/emitters/emit.ts:99-136`
- Modify: `packages/codegen/src/emitters/render-module.ts` (`render_transport_dispatch` :681-690, `buildTypedTemplateBody` :905-992, `spacingFieldExprs` :2507)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`renderOptionsRs`, `RESOLVER_BODY`)
- Modify: `rust/crates/sittir-core/src/options.rs` (`ResolvedOptions.labels`)
- Test: `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`, `render-module-emit.test.ts`, `emitter-options.test.ts`

**Interfaces:**
- Consumes: `seamRenderRules` (Task 3); `SEAM_MARK`, `rustStringLiteral`, `references(...).seams` (Task 4); `SpacingWriter::finish` (Task 2).
- Produces: generated `options::spacing_text(id)` returns `"\u{FDD2}"`, `"\u{FDD2} "`, `"\u{FDD2}\n"` for the text kinds and the unchanged `INDENT_NEWLINE`/`DEDENT_NEWLINE` constants; `pub const LABEL_COUNT: usize`; `ResolvedOptions { spacing, delimiter, labels: Vec<Option<u16>>, indent }`; `defaults()` sets `labels: vec![None; LABEL_COUNT]`; `resolve` sets `table.labels[i] = Some(id)` for a top-level label key; every seam site of a kind is a transport field, filled by `fill_options`, and bound in the render function as `let <site> = options::spacing_text(node.<site>.unwrap_or(0));`.

- [ ] **Step 1: Write the failing tests**

`render-options-rs.test.ts`, in the `renderOptionsRs` case, replace the two `spacing_text` expectations and add the label vector:

```ts
		expect(src).toContain('167 => "\\u{FDD2}",');
		expect(src).toContain('169 => "\\u{FDD2}\\n",');
		expect(src).toContain('pub const LABEL_COUNT: usize = 5;');
		expect(src).toContain('labels: vec![None; LABEL_COUNT],');
		expect(src).toContain('table.labels[i] = Some(id);');
```

Add a seam site to `sites` and assert its plan row:

```ts
	{ kind: 'call_expression', slot: 'lparen', address: 'lparen_before', label: 'lparen_before', arms: SPACING, defaultArm: 'tight', source: 'spacing', side: 'seam' }
```

```ts
	it('numbers a token seam site under its kind by its label, with no flank entry', () => {
		const plan = planRenderOptions(sites, kindEntries, supertypes, whitespaceText);
		const seam = plan.spacingSites.find((s) => s.label === 'lparen_before')!;
		expect([seam.constName, seam.fieldIdent, seam.wireKey, seam.defaultId]).toEqual(['SITE_CALL_EXPRESSION_LPAREN_BEFORE', 'lparen_before', '_lparen_before', 167]);
		expect(seam.side).toBe('seam');
		expect(plan.labels.map((l) => l.label)).toContain('lparen_before');
	});
```

`render-module-emit.test.ts`: copy the shape of `a separated-list transport carries its own spacing and flank fields, named by the site key` (line 373) into a new case whose plan holds one seam site (`side: 'seam'`) on a compound kind whose body is `concat(text('fn'), seam('lparen_before'), text('('), slot('x'), text(')'))`, asserting:

```ts
		expect(body).toContain('#[cfg_attr(feature = "napi-bindings", napi(js_name = "_lparen_before"))]');
		expect(body).toContain('pub lparen_before: Option<u16>,');
		expect(fill).toContain('self.lparen_before.get_or_insert(table.spacing[options::SITE_CALL_EXPRESSION_LPAREN_BEFORE]);');
		expect(render).toContain('let lparen_before = options::spacing_text(node.lparen_before.unwrap_or(0));');
		expect(render).toContain('write!(f, "fn{lparen_before}({x})")?;');
		expect(src).toContain('    w.finish()?;');
```

`emitter-options.test.ts`: a seam site (`side: 'seam'`, `source: 'spacing'`) on `call_expression` yields top-level `lparen_before` typed `TSKindId.Tight | TSKindId.Space | TSKindId.Newline` and a `call_expression: { lparen_before }` group.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/render-options-rs.test.ts src/emitters/__tests__/render-module-emit.test.ts src/emitters/__tests__/emitter-options.test.ts`
Expected: FAIL on the new expectations.

- [ ] **Step 3: `emit.ts` pass order**

```ts
	const rulesConfig = kindEntries ? { nodeMap, kindEntries, defaults: renderDefaults, whitespaceText: whitespaceTextOf(visibleExternals) } : undefined;
	const spacedRules = rulesConfig ? spaceRenderRules(rulesConfig) : undefined;
	…
	stampStaticSpacing(nodeMap, grammar, spacedRules);
	const renderRules = rulesConfig && spacedRules ? seamRenderRules(spacedRules, rulesConfig) : undefined;
	const templateEmitter = new TemplateEmitter({ grammar, nodeMap, renderRules });
```

Every later consumer (`RenderModuleEmitter`, `emitOptions`) keeps reading `renderRules`. Import `seamRenderRules`.

- [ ] **Step 4: `render-module.ts`**

`render_transport_dispatch`: after the `write_fmt` line push `    w.finish()?;`.

`buildTypedTemplateBody`: after the field loop and before `const refs = references(struct.body);`:

```ts
	for (const site of synthesizedSpacingSites(plan, node).filter((s) => s.side === 'seam')) {
		const ident = rustFieldIdent(site.fieldIdent);
		bind(ident, `options::spacing_text(node.${ident}.unwrap_or(0))`);
	}
```

and the check loop iterates `[...refs.tests, ...refs.slots, ...refs.seams]`.

`spacingFieldExprs`: `.filter((site) => site.slot === fieldName && site.side !== 'seam')`.

- [ ] **Step 5: `render-options-rs.ts` and `options.rs`**

Import `SEAM_MARK, rustStringLiteral` from `./render-body.ts`. In `renderOptionsRs`:

- after `DELIMITER_SITE_COUNT`: `L.push(\`pub const LABEL_COUNT: usize = ${plan.labels.length};\`);`
- `spacing_text` arm for a text kind: `` `        ${w.id} => ${rustStringLiteral(SEAM_MARK + w.text.text)},` `` (constants unchanged);
- `defaults()`: add `'        labels: vec![None; LABEL_COUNT],'` before the `..ResolvedOptions::default()` line.

`RESOLVER_BODY`, the top-level label branch becomes:

```rust
        if let Some(i) = LABELS.iter().position(|(label, _)| label == key) {
            let allowed = LABELS[i].1;
            let id = spacing_id(allowed, value, key)?;
            for (j, site) in SPACING_SITES.iter().enumerate() {
                if site.2 == key {
                    table.spacing[j] = id;
                }
            }
            table.labels[i] = Some(id);
            continue;
        }
```

with `set_spacing` refactored over a new `spacing_id(allowed, value, key) -> Result<u16, String>` that carries today's parse and admission errors.

`options.rs`: add `pub labels: Vec<Option<u16>>,` with doc `/// The value set for each preference label at the top level, in generated label order; unset labels are None.` and `labels: Vec::new()` in `Default`. Fix any struct literal in the workspace that names every field (`rtk cargo build --workspace` tells you).

- [ ] **Step 6: Run the suites and cargo**

Run: `pnpm exec vitest run --root packages/codegen` and `rtk cargo test -p sittir-core`
Expected: PASS (codegen at its known baseline; any new failure isolated by stash-and-rerun).

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(render): seam sites bound from the transport; every option whitespace is seam-marked; label values kept in the resolved table" -- packages/codegen/src/emitters/emit.ts packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/render-options-rs.ts rust/crates/sittir-core/src/options.rs packages/codegen/src/emitters/__tests__/render-options-rs.test.ts packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/emitter-options.test.ts
```

---

### Task 6: Regenerate, gate, demonstrate, document

**Files:**
- Regenerate: `packages/{rust,typescript,python}/src/*`, `packages/{rust,typescript,python}/.sittir/*`, `rust/crates/sittir-{rust,typescript,python}/src/*`
- Modify: `packages/rust/tests/options.test.ts`, the three `tests/__snapshots__/options.test.ts.snap`
- Modify: `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md` (Out of scope)
- Modify: `docs/glossary/dsl-primitives.md`, `docs/glossary/dsl-wire.md`, `docs/glossary/compiler-model.md`, `docs/glossary/emitters.md`, `docs/glossary/validate.md`

- [ ] **Step 1: Regenerate all three grammars**

The core crate changed (`finish`, `labels`), so every napi build recompiles the workspace: run all three without stopping on the first failure, then rerun the first two.

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src --skip-ts-chain
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src --skip-ts-chain
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src --skip-ts-chain
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src --skip-ts-chain
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src --skip-ts-chain
```

Expected: each gen writes its files; the final two succeed end to end. A `render body for '<kind>' names '<site>', which its transport has no slot for` error means a seam landed in a kind that gets no transport: stop and review which rule it came from (the inlined-helper skip in `seamRenderRules` is the first suspect).

- [ ] **Step 2: Byte gate**

```bash
pnpm exec tsx <scratchpad>/dogfood.ts <scratchpad>/renders-after
for f in rust rust-strict ts ts-strict py py-strict; do cmp <scratchpad>/renders-baseline/$f.txt <scratchpad>/renders-after/$f.txt && echo "$f identical"; done
```

Expected: six `identical` lines. A difference is a finding, not a revert: diff the two files, locate the seam, and review (Global Constraints, last bullet).

- [ ] **Step 3: Validator gate and suites**

```bash
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm run type-check
pnpm exec vitest run --root packages/codegen
pnpm exec vitest run --root packages/tools
pnpm exec vitest run --root packages/cli
rtk cargo test --workspace --exclude sittir-parity-tests
bash scripts/assert-scope-boundaries.sh
```

Expected: counts equal the Global Constraints numbers; every suite green; cargo green.

- [ ] **Step 4: Options snapshots and the compile-time check**

In `packages/rust/tests/options.test.ts` add to the `ok` object `lparen_before: TSKindId.Space,` and `function_item: { lparen_before: TSKindId.Tight },`, and to `bad` a `// @ts-expect-error a token seam admits no indent` line `lparen_before: TSKindId.Indent,`. Then:

```bash
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run -u tests/options.test.ts); done
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run); done
```

Expected: snapshots updated with the new `<token>_before|_after` keys at the top level and under each kind; all three package suites green. Read the rust snapshot diff: every new top-level key parses with `parseSeamLabel`, and no separator key moved.

- [ ] **Step 5: Dogfood demonstration**

Write `<scratchpad>/dogfood-seam.ts` rendering the rust dogfood with the option set through the engine (per-call options are `RenderOptions.options`, `packages/common/src/engine.ts:255`):

```ts
import { writeFileSync } from 'node:fs';
import { createEngine } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/rust/src/engine.ts';
import { TSKindId } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/rust/src/types.ts';
import { rebuildSplice } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/17-dogfood-rust.ts';

const engine = createEngine();
const text = String(engine.render(rebuildSplice() as never, { options: { lparen_before: TSKindId.Space } }));
writeFileSync(process.argv[2]!, text);
console.log(text.length);
```

Run it, diff against `renders-baseline/rust.txt`, and confirm every changed line is a `(` gaining one leading space and nothing else changes (`fn apply_edits (` and calls like `edits.sort_by (`). If `engine.render` returns a handle rather than a string, read the handle's text accessor from `packages/common/src/engine.ts` (`RenderHandle`) instead of `String(...)`. Keep the diff for the PR description.

- [ ] **Step 6: Spec and glossary**

Spec, Out of scope, add:

```markdown
- A slot that is a choice of literals (an operator) gets no site here. Its
  seam is runtime-varying, so the route is a keyed seam mark: the body
  writes the site's index before the token, and the writer resolves the
  token it just read against the site's own override, then the label's
  value, and applies the lexical rule when neither is set. The resolved
  options table already keeps per-label values for it.
- Addressing one occurrence of a token in a kind that holds it at several
  positions; one site per kind, token and side in this slice.
```

Glossary entries (one `###` per qualified name; describe the live constraint, no history):
- `dsl-primitives.md`: `spacing.ts::seamLabel`, `::parseSeamLabel`.
- `dsl-wire.md`: `wire.ts::renderDefaultsOf` (seam keys at both levels), `::isSeamDefaultKey`, `::structuralPatchesOf`.
- `compiler-model.md`: `render-rules.ts::seamRenderRules`, `::isSeamChoice`, `::seamPartOf`, `::validateRenderDefaults`, `::withTokenSeams`, `::punctuationTokenOf`, `::inlinedRuleNames`, `::DefaultResolver` (resolveSeam, no validation), `::SpacingSide` (`seam`), `::spacingSitesOf` (seam sites), `::spaceRenderRules` (no validation).
- `emitters.md`: `render-body.ts::Body` (seam node), `::SeamNode`, `::seam`, `::SEAM_MARK`, `::references`, `::printRustBody`; `templates.ts::emitRule` (seam parts held across a boundary), `::joinStaticSeam`, `::pickConditionalKey`, `::renderRuleEdge`; `emit.ts::emitAll` (pass order); `render-module.ts::buildTypedTemplateBody` (seam locals), `::spacingFieldExprs`, the dispatch entry (`finish`); `render-options-rs.ts::renderOptionsRs` (marked `spacing_text`, `LABEL_COUNT`, label vector).
- `validate.md`: `render-bodies.ts::bodyToLegacyRule` (seam contributes nothing).

- [ ] **Step 7: Commit generated output, tests, docs; push; PR**

```bash
git add packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src rust/crates/sittir-typescript/src rust/crates/sittir-python/src packages/rust/tests packages/typescript/tests packages/python/tests
git commit -m "feat(render): punctuation seam sites on the three grammars; options snapshots" -- packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src rust/crates/sittir-typescript/src rust/crates/sittir-python/src packages/rust/tests packages/typescript/tests packages/python/tests
git commit -m "docs: punctuation seam spacing glossary entries; spec records the operator route" -- docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md docs/glossary
git push -u origin feat/punctuation-seams
gh pr create --base feat/askama-retirement --title "feat(render): punctuation seam spacing" --body-file <scratchpad>/pr-body.md
```

The PR body: the spec link, the byte gate and validator numbers, the dogfood diff from Step 5, and the two deferrals (operator slots, path-form addressing).
