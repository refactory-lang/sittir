# Preference Address Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the seven spellings a preference has today with one path address, declared in an `options:` block and resolved by site-set specificity.

**Architecture:** A preference is keyed by a path from a kind to a position, using the segment vocabulary `parsePath` already has plus a literal segment. Labels are paths too, so the generated TypeScript surface nests uniformly. Sites are numbered by canonical sorted path order, which makes a prefix a contiguous index range; resolution works on runs over that range and expands once to the dense vector the render path already reads.

**Tech Stack:** TypeScript (ESM, `.ts` extensions on local imports), vitest, Rust (generated render crates), napi.

**Spec:** `docs/superpowers/specs/2026-09-09-preference-address-design.md`

**Scope:** This is plan 1 of 2. It does not touch how options reach a render function — `FillOptions`, the fill walk and the per-node `Option<u16>` fields stay exactly as they are. Their removal is the render-context plan, which depends on nothing here.

## Global Constraints

- **TypeScript is ESM; local imports use `.ts` extensions.**
- **No explanatory comments in `packages/codegen/src/`.** Documentation goes in `docs/glossary/<dir>.md`, one `###` section per declaration, keyed by qualified name (`packages/codegen/src/path/file.ts::symbolName`).
- **Comments state live constraints, never provenance.** No spec, plan, PR, ADR or task numbers in any comment or doc-comment.
- **Generated outputs are never hand-edited.** `packages/{rust,typescript,python}/src/*`, `packages/*/.sittir/*` and `rust/crates/sittir-*/src/*` are derived. Fix the generator and regenerate.
- **Any edit under `packages/codegen/src/` changes the manifest `source_hash`** and rebundles `packages/*/.sittir/grammar.js`. Regenerate all three grammars before running the suite, and stage `packages/*/.sittir/` in the commit — a pre-commit hook rejects a stale manifest, and leaving `grammar.js` behind is enough to trip it:
  ```bash
  for g in rust typescript python; do
    pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src
  done
  ```
- **Commit with an explicit pathspec** — `git commit -F <msgfile> -- <paths>`. The working tree carries unrelated modifications. Never `git add -A`. The heredoc form `git commit -F - <<'MSG' … -- paths` does not work: git reads `-F` and `-` as pathspecs when they follow `--`.
- **`pnpm run validate:native` creates its own commit** (`chore(validator): record validation run`) touching `packages/tools/validation-history.jsonl`. Expect it.
- **Ratchets only tighten.** Site counts, phantom-kind counts and validation floors may shrink, never grow past their ceiling.
- **Text search is hook-blocked** unless `.infigraph/.search-fallback-allowed` holds a fresh timestamp. Write it in **its own Bash call** — a command containing `rg` is blocked in its entirety before anything in it runs, including a `date` that precedes it.

## Gate for every task

Three-way verification before each commit:

1. The task's own tests.
2. `pnpm run validate:native` — every metric holds at rust `from 147 / cov 207 / ir-render-parse 1259`, typescript `143 / 193 / 1063`, python `126 / 142 / 1286`, with `AstMatch` equal to `Pass` on every row.
3. `pnpm exec vitest run` — full suite, currently 243 files / 3415 passed / 0 failed. Isolate any new failure by stashing before accepting it as pre-existing.

**Validate cannot see whitespace.** `#[derive(Debug, Eq, )]` and `#[derive(Debug,Eq,)]` parse to the same tree. For any task that could move rendered output, the real gate is the rendered strings in the three `rust/crates/sittir-*/test-fixtures.json`. Tasks 1-8 are behaviour-preserving and those files must not move; Task 9 moves them deliberately and reviews the diff.

## File Structure

**New:**
- `packages/codegen/src/dsl/primitives/preference-path.ts` — the canonical preference address: parse, format, compare, prefix and subset tests. One responsibility: the address as a value.
- `packages/codegen/src/compiler/model/site-addresses.ts` — resolving a preference address against the model into the set of sites it matches, and the specificity ordering over those sets.
- `packages/codegen/src/dsl/wire/options-block.ts` — reading the `options:` block into declarations. Sits beside `wire.ts` rather than inside it; `wire.ts` is already 1000+ lines and `renderDefaultsOf` is the part being replaced.

**Modified:**
- `packages/codegen/src/dsl/transform/transform-path.ts` — quote-aware splitting, literal segment.
- `packages/codegen/src/dsl/wire/wire.ts:353-400` — `renderDefaultsOf` gains the `options:` path, then loses its branches in Task 10.
- `packages/codegen/src/emitters/render-options-rs.ts` — sorted-path site numbering, runs, the nested TypeScript type.
- `packages/{rust,typescript,python}/grammar.sittir.ts` — the migration.

**Glossary (one entry per new declaration):**
- `docs/glossary/dsl-primitives.md` — everything in `preference-path.ts`.
- `docs/glossary/compiler-model.md` — everything in `site-addresses.ts`.
- `docs/glossary/dsl-wire.md` — everything in `options-block.ts`.

---

### Task 1: A literal segment, and a splitter that survives it

`parsePath` splits on a bare `/`, so a literal segment containing the separator is unparseable. rust's `_token_tree_punctuation` has `/` and `/=` among its arms, so this blocks the case the whole design exists for.

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform-path.ts:39-91`
- Test: `packages/codegen/src/dsl/__tests__/transform-path.test.ts`
- Docs: `docs/glossary/dsl.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `PathSegment` gains `| { kind: 'literal'; text: string }`. `parsePath(pathStr: string): PathSegment[]` unchanged in signature.

- [ ] **Step 1: Write the failing tests**

In `packages/codegen/src/dsl/__tests__/transform-path.test.ts`, inside the existing `describe('parsePath()')`:

```ts
it('parses a quoted literal segment', () => {
    expect(parsePath('","')).toEqual([{ kind: 'literal', text: ',' }]);
    expect(parsePath('"::"')).toEqual([{ kind: 'literal', text: '::' }]);
});

it('parses a literal that contains the separator', () => {
    expect(parsePath('"/"')).toEqual([{ kind: 'literal', text: '/' }]);
    expect(parsePath('(token_tree_punctuation)/"/="')).toEqual([
        { kind: 'kind-match', name: 'token_tree_punctuation' },
        { kind: 'literal', text: '/=' }
    ]);
});

it('parses a literal alongside the other segment kinds', () => {
    expect(parsePath('(block)/"{"/0')).toEqual([
        { kind: 'kind-match', name: 'block' },
        { kind: 'literal', text: '{' },
        { kind: 'index', value: 0 }
    ]);
});

it('rejects an unterminated literal', () => {
    expect(() => parsePath('(block)/","')).not.toThrow();
    expect(() => parsePath('(block)/",')).toThrow(/unterminated literal/);
});
```

A bare kind name is not a legal segment — `parsePath` requires `(block)` — so every
example here parenthesises it.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/transform-path.test.ts -t 'literal'
```
Expected: FAIL — `parsePath: invalid segment '","'`.

- [ ] **Step 3: Add the literal segment and the quote-aware splitter**

In `transform-path.ts`, extend the union at line 39:

```ts
export type PathSegment =
	| { kind: 'index'; value: number }
	| { kind: 'wildcard' }
	| { kind: 'literal'; text: string }
	| {
			kind: 'kind-match';
			name: string;
	  }
	| {
			kind: 'fieldName';
			name: string;
	  };
```

Add the splitter above `parsePath`:

```ts
function splitSegments(pathStr: string): string[] {
	const parts: string[] = [];
	let current = '';
	let inLiteral = false;
	for (let i = 0; i < pathStr.length; i++) {
		const c = pathStr[i]!;
		if (c === '"') {
			inLiteral = !inLiteral;
			current += c;
		} else if (c === '/' && !inLiteral) {
			parts.push(current);
			current = '';
		} else {
			current += c;
		}
	}
	if (inLiteral) throw new Error(`parsePath: unterminated literal in path '${pathStr}'`);
	parts.push(current);
	return parts;
}
```

Replace `const parts = pathStr.split('/');` (line 66) with `const parts = splitSegments(pathStr);`, and add the literal branch as the FIRST test in the segment loop, before the index test:

```ts
		if (part.length >= 2 && part.startsWith('"') && part.endsWith('"')) {
			segments.push({ kind: 'literal', text: part.slice(1, -1) });
		} else if (part === '_') {
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/transform-path.test.ts
```
Expected: PASS, all cases.

- [ ] **Step 5: Handle a literal in `applyPath`**

A literal segment must resolve against a rule's members. In `applyToMembers` (`transform-path.ts:516`), add before the `kind-match` case:

```ts
		case 'literal': {
			const idx = members.findIndex((m) => literalTextOfMember(m) === head.text);
			if (idx < 0) throw new ApplyPathSkip(`applyPath: no literal ${JSON.stringify(head.text)} in ${rule.type}`);
			members[idx] = applyPath(members[idx]!, rest, patch, precStack);
			return reconstructContainer(rule, members);
		}
```

with, beside the other member helpers:

```ts
function literalTextOfMember(rule: RuntimeRule): string | undefined {
	const r = rule as { type?: string; value?: unknown };
	return r.type === 'STRING' && typeof r.value === 'string' ? r.value : undefined;
}
```

Add `'literal'` to the `case 'index': case 'wildcard':` group at line 127 so dispatch reaches `applyToMembers`.

- [ ] **Step 6: Add the applyPath test**

```ts
it('applies a patch at a literal segment', () => {
    const rule = seq(str('{'), sym('body'), str('}'));
    const out = applyPath(rule, parsePath('"}"'), str('END'));
    expect((out as any).members[2]).toEqual(str('END'));
});
```

- [ ] **Step 7: Run the full path test file**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/transform-path.test.ts
```
Expected: PASS.

- [ ] **Step 8: Write the glossary entries**

In `docs/glossary/dsl.md`, alongside the other `transform-path.ts` entries:

```markdown
### `packages/codegen/src/dsl/transform/transform-path.ts::splitSegments`

A path's segments, splitting on `/` outside a quoted literal only. A literal
may contain the separator — rust's token-tree punctuation has `/` and `/=`
among its arms — so a bare split would make those arms unaddressable.
```

- [ ] **Step 9: Regenerate and gate**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
pnpm run validate:native
pnpm exec vitest run
```
Expected: no fixture movement (this task adds a segment nothing declares yet), validate byte-identical, suite green.

- [ ] **Step 10: Commit**

```bash
git commit -F <msgfile> -- \
  packages/codegen/src/dsl/transform/transform-path.ts \
  packages/codegen/src/dsl/__tests__/transform-path.test.ts \
  docs/glossary/dsl.md \
  packages/{rust,typescript,python}/src/hash.ts \
  packages/{rust,typescript,python}/.sittir/generated.manifest.json
```

---

### Task 2: The preference address as a value

An address needs a canonical form so sites can be sorted by it, and a subset test so specificity can be decided.

**Files:**
- Create: `packages/codegen/src/dsl/primitives/preference-path.ts`
- Test: `packages/codegen/src/dsl/__tests__/preference-path.test.ts`
- Docs: `docs/glossary/dsl-primitives.md`

**Interfaces:**
- Consumes: `splitSegments` (exported from Task 1), `PathSegment`.
- Produces:
  - `PreferenceSegment = PathSegment | { kind: 'name'; name: string }`
  - `parsePreferencePath(text: string): PreferenceSegment[]`
  - `formatPreferencePath(segments: readonly PreferenceSegment[]): string`
  - `comparePreferencePaths(a: readonly PreferenceSegment[], b: readonly PreferenceSegment[]): number`
  - `SIDE_SEGMENTS: readonly ['before', 'after', 'separator']`
  - `isSideSegment(segment: PreferenceSegment): boolean`

A preference path does **not** delegate to `parsePath`. It shares the splitter
and the segment forms but not the rules: `parsePath` rejects a bare identifier
and demands `(name)`, while every side in a preference address is bare
(`(block)/"{"/after`). Bare is a `name` segment here. `(_)` is a kind-match
named `_` — any kind — and must be tested before the general `(name)` case,
since `_` is not an identifier.

- [ ] **Step 1: Write the failing tests**

Create `packages/codegen/src/dsl/__tests__/preference-path.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
	parsePreferencePath,
	formatPreferencePath,
	comparePreferencePaths
} from '../primitives/preference-path.ts';

describe('preference paths', () => {
	it('round-trips through parse and format', () => {
		for (const path of ['(block)/"{"/after', 'body/before', '(source_file)/statements:/separator']) {
			expect(formatPreferencePath(parsePreferencePath(path))).toBe(path);
		}
	});

	it('orders a prefix before its descendants', () => {
		const parent = parsePreferencePath('(block)/"{"');
		const child = parsePreferencePath('(block)/"{"/after');
		expect(comparePreferencePaths(parent, child)).toBeLessThan(0);
	});

	it('keeps every descendant of a prefix contiguous', () => {
		const paths = ['(block)/"a"', '(block)/"a"/after', '(block)/"a"/before', '(block)/"ab"'].map(
			parsePreferencePath
		);
		const sorted = [...paths].sort(comparePreferencePaths).map(formatPreferencePath);
		expect(sorted).toEqual(['(block)/"a"', '(block)/"a"/before', '(block)/"a"/after', '(block)/"ab"']);
	});

	it('orders sides in render order, not alphabetically', () => {
		const before = parsePreferencePath('(block)/before');
		const after = parsePreferencePath('(block)/after');
		expect(comparePreferencePaths(before, after)).toBeLessThan(0);
	});
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/preference-path.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/codegen/src/dsl/primitives/preference-path.ts`:

```ts
import { parsePath, type PathSegment } from '../transform/transform-path.ts';

export const SIDE_SEGMENTS = ['before', 'after', 'separator'] as const;
export type SideSegment = (typeof SIDE_SEGMENTS)[number];

export function isSideSegment(segment: PathSegment): boolean {
	return segment.kind === 'kind-match' && (SIDE_SEGMENTS as readonly string[]).includes(segment.name);
}

export function parsePreferencePath(text: string): PathSegment[] {
	return parsePath(text);
}

export function formatPreferencePath(segments: readonly PathSegment[]): string {
	return segments.map(formatSegment).join('/');
}

function formatSegment(segment: PathSegment): string {
	switch (segment.kind) {
		case 'index':
			return String(segment.value);
		case 'wildcard':
			return '_';
		case 'literal':
			return `"${segment.text}"`;
		case 'kind-match':
			return `(${segment.name})`;
		case 'fieldName':
			return `${segment.name}:`;
	}
}

const SEGMENT_ORDER: Record<PathSegment['kind'], number> = {
	wildcard: 0,
	index: 1,
	fieldName: 2,
	'kind-match': 3,
	literal: 4
};

function sideRank(segment: PathSegment): number {
	if (segment.kind !== 'kind-match') return -1;
	const at = (SIDE_SEGMENTS as readonly string[]).indexOf(segment.name);
	return at;
}

export function comparePreferencePaths(a: readonly PathSegment[], b: readonly PathSegment[]): number {
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		const cmp = compareSegment(a[i]!, b[i]!);
		if (cmp !== 0) return cmp;
	}
	return a.length - b.length;
}

function compareSegment(a: PathSegment, b: PathSegment): number {
	const sideA = sideRank(a);
	const sideB = sideRank(b);
	if (sideA >= 0 || sideB >= 0) {
		if (sideA >= 0 && sideB >= 0) return sideA - sideB;
		return sideA >= 0 ? 1 : -1;
	}
	if (a.kind !== b.kind) return SEGMENT_ORDER[a.kind] - SEGMENT_ORDER[b.kind];
	switch (a.kind) {
		case 'index':
			return a.value - (b as { value: number }).value;
		case 'wildcard':
			return 0;
		case 'literal':
			return a.text < (b as { text: string }).text ? -1 : a.text > (b as { text: string }).text ? 1 : 0;
		default:
			return a.name < (b as { name: string }).name ? -1 : a.name > (b as { name: string }).name ? 1 : 0;
	}
}
```

- [ ] **Step 4: Run to verify passing**

```bash
pnpm exec vitest run packages/codegen/src/dsl/__tests__/preference-path.test.ts
```
Expected: PASS.

- [ ] **Step 5: Type-check**

```bash
pnpm exec tsc --noEmit -p packages/codegen
```
Expected: no output.

- [ ] **Step 6: Glossary**

In `docs/glossary/dsl-primitives.md`:

```markdown
### `packages/codegen/src/dsl/primitives/preference-path.ts::comparePreferencePaths`

The canonical order over preference addresses: segment by segment, then by
length, so every descendant of a prefix is contiguous and a prefix precedes
them. Site indices are assigned in this order, which is what makes a
prefix-scoped declaration a range rather than a scan. Sides sort last within a
level and in render order — `before`, `after`, `separator` — so a kind's own
gaps do not interleave with its children.

### `packages/codegen/src/dsl/primitives/preference-path.ts::formatPreferencePath`

An address back in its written spelling, so a diagnostic names what an author
typed rather than a segment dump.
```

- [ ] **Step 7: Commit**

```bash
git commit -F <msgfile> -- \
  packages/codegen/src/dsl/primitives/preference-path.ts \
  packages/codegen/src/dsl/__tests__/preference-path.test.ts \
  docs/glossary/dsl-primitives.md
```

---

### Task 3: Reading the `options:` block

**Files:**
- Create: `packages/codegen/src/dsl/wire/options-block.ts`
- Create: `packages/codegen/src/dsl/wire/__tests__/options-block.test.ts`
- Modify: `packages/codegen/src/compiler/types.ts` — add `options?: OptionsConfig` beside `patches`.
- Docs: `docs/glossary/dsl-wire.md`

**Interfaces:**
- Consumes: `preference()` from `dsl/primitives/preference.ts`; `parsePreferencePath` from Task 2.
- Produces:

```ts
export interface PathDeclaration { readonly path: string; readonly arm: string; }
export interface AddressBinding { readonly address: string; readonly label: string; }
export interface OptionsDeclarations {
	readonly declarations: readonly PathDeclaration[];
	readonly bindings: readonly AddressBinding[];
}
export type OptionsConfig = Record<string, unknown>;
export function readOptionsBlock(options: OptionsConfig, kinds: ReadonlySet<string>): OptionsDeclarations;
```

**Shape.** The top level is kind-keyed, as `patches:` is: a bare identifier
whose value is a map of paths relative to it. A label's first segment is a
**virtual kind** — `body/before` is `before` under `body` — so there is no
discrimination by key shape; every top-level key is a kind, some real and some
virtual, and a virtual kind taking a real kind's name is rejected.

`_bindings` maps a full address path to a label path and nothing else. An
address with a differing default declares it under its kind; an address in no
group is only a declaration.

`preference()` keeps its two-argument form for now so nothing else changes;
`readOptionsBlock` rejects a declaration whose `preference()` label disagrees
with the path its key names, matching how `renderDefaultsOf` already guards
seam and separator keys. Collapsing it to one argument is a follow-up, not
part of this plan.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { readOptionsBlock } from '../options-block.ts';
import { preference } from '../../primitives/preference.ts';

const KINDS = new Set(['block', 'keyword_argument', 'object_type']);

describe('readOptionsBlock', () => {
	it('reads a virtual kind as a label', () => {
		const out = readOptionsBlock({ body: { before: preference('before', 'indent') } }, KINDS);
		expect(out.declarations).toEqual([{ path: 'body/before', arm: 'indent' }]);
		expect(out.bindings).toEqual([]);
	});

	it('reads a kind-relative declaration as a full address', () => {
		const out = readOptionsBlock(
			{ keyword_argument: { '"="/before': preference('"="/before', 'tight') } },
			KINDS
		);
		expect(out.declarations).toEqual([{ path: 'keyword_argument/"="/before', arm: 'tight' }]);
	});

	it('reads a binding from an address to a label', () => {
		const out = readOptionsBlock(
			{
				body: { before: preference('before', 'indent') },
				_bindings: { 'block/"{"/after': 'body/before' }
			},
			KINDS
		);
		expect(out.bindings).toEqual([{ address: 'block/"{"/after', label: 'body/before' }]);
	});

	it('keeps membership and default separate', () => {
		const out = readOptionsBlock(
			{
				assignment: { before: preference('before', 'space') },
				keyword_argument: { '"="/before': preference('"="/before', 'tight') },
				_bindings: { 'keyword_argument/"="/before': 'assignment/before' }
			},
			KINDS
		);
		expect(out.declarations).toContainEqual({ path: 'keyword_argument/"="/before', arm: 'tight' });
		expect(out.bindings).toEqual([
			{ address: 'keyword_argument/"="/before', label: 'assignment/before' }
		]);
	});

	it('rejects a label whose root is a real kind', () => {
		expect(() =>
			readOptionsBlock(
				{
					block: { before: preference('before', 'space') },
					_bindings: { 'object_type/opening:/after': 'block/before' }
				},
				KINDS
			)
		).toThrow(/label 'block\/before' names the kind 'block'/);
	});

	it('rejects a binding naming no declared label', () => {
		expect(() => readOptionsBlock({ _bindings: { 'block/"{"/after': 'body/before' } }, KINDS)).toThrow(
			/names no label/
		);
	});

	it('treats an unknown top-level key as a virtual kind', () => {
		const out = readOptionsBlock({ nowhere: { before: preference('before', 'tight') } }, KINDS);
		expect(out.declarations).toEqual([{ path: 'nowhere/before', arm: 'tight' }]);
	});

	it('rejects a declaration whose preference renames its key', () => {
		expect(() => readOptionsBlock({ 'body/before': preference('body/after', 'indent') }, KINDS)).toThrow(
			/does not rename it/
		);
	});
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/dsl/wire/__tests__/options-block.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import { isPreference, type PreferencePlaceholder } from '../primitives/preference.ts';
import { parsePreferencePath } from '../primitives/preference-path.ts';

export interface PathDeclaration {
	readonly path: string;
	readonly arm: string;
}

export interface AddressBinding {
	readonly address: string;
	readonly label: string;
}

export interface OptionsDeclarations {
	readonly declarations: readonly PathDeclaration[];
	readonly bindings: readonly AddressBinding[];
}

export type OptionsConfig = Record<string, unknown>;

const BINDINGS_KEY = '_bindings';

export function readOptionsBlock(options: OptionsConfig, kinds: ReadonlySet<string>): OptionsDeclarations {
	const declarations: PathDeclaration[] = [];
	const declared = new Set<string>();
	const add = (path: string, value: unknown): void => {
		if (!isPreference(value)) throw new Error(`options: '${path}' takes preference(path, arm)`);
		const placeholder = value as PreferencePlaceholder;
		if (placeholder.label !== relativeKeyOf(path)) {
			throw new Error(`options: '${path}' is named by its path; preference('${placeholder.label}', …) does not rename it`);
		}
		parsePreferencePath(path);
		if (declared.has(path)) throw new Error(`options: '${path}' declared twice`);
		declared.add(path);
		declarations.push({ path, arm: placeholder.default });
	};

	for (const [key, value] of Object.entries(options)) {
		if (key === BINDINGS_KEY) continue;
		for (const [relative, entry] of Object.entries(value as Record<string, unknown>)) {
			add(`${key}/${relative}`, entry);
		}
	}

	const bindings: AddressBinding[] = [];
	const seen = new Set<string>();
	for (const [address, label] of Object.entries((options[BINDINGS_KEY] ?? {}) as Record<string, string>)) {
		parsePreferencePath(address);
		if (seen.has(address)) throw new Error(`options: _bindings declares '${address}' twice`);
		seen.add(address);
		if (!declared.has(label)) throw new Error(`options: _bindings '${address}' names no label '${label}'`);
		const root = parsePreferencePath(label)[0];
		if (root !== undefined && root.kind === 'name' && kinds.has(root.name)) {
			throw new Error(`options: label '${label}' names the kind '${root.name}' — a label's kind is virtual`);
		}
		bindings.push({ address, label });
	}
	return { declarations, bindings };
}

function relativeKeyOf(path: string): string {
	return path;
}
```

`relativeKeyOf` is the seam where the `preference()` label is compared against
the key. A kind-relative declaration is stored as a full address, so the
comparison is against the relative key the author wrote; keep the two apart
rather than comparing a joined path against a relative label.

- [ ] **Step 4: Run to verify passing**

```bash
pnpm exec vitest run packages/codegen/src/dsl/wire/__tests__/options-block.test.ts
```
Expected: PASS, eight cases.

- [ ] **Step 5: Wire the config type**

In `packages/codegen/src/compiler/types.ts`, beside the grammar config's
`patches` member, add `readonly options?: OptionsConfig;` and import the type.

- [ ] **Step 6: Type-check**

```bash
pnpm exec tsc --noEmit -p packages/codegen
```

- [ ] **Step 7: Glossary**

In `docs/glossary/dsl-wire.md`:

```markdown
### `packages/codegen/src/dsl/wire/options-block.ts::readOptionsBlock`

The `options:` block read into path declarations and address bindings. The top
level is kind-keyed, as `patches:` is — a bare identifier whose value is a map
of paths relative to it. A label's first segment is a virtual kind, so a label
needs no separate form: `body/before` is `before` under `body`, and every
top-level key is a kind, some real and some virtual.

A label naming a real kind as its root is rejected where the binding names it.
Real kinds are derived from the grammar and virtual ones are written, so the
collision is always the author's to resolve.

`_bindings` maps an address to a label and carries nothing else. Membership and
default live in the two halves: the binding says which label an address belongs
to, the declaration under its kind says what its arm is. Welded together, as
`preference(label, arm)` repeated at every site does today, neither can be
stated once.
```

- [ ] **Step 8: Commit**

```bash
git commit -F <msgfile> -- \
  packages/codegen/src/dsl/wire/options-block.ts \
  packages/codegen/src/dsl/wire/__tests__/options-block.test.ts \
  packages/codegen/src/compiler/types.ts \
  docs/glossary/dsl-wire.md \
  packages/{rust,typescript,python}/.sittir
```

---

### Task 4: Resolving an address to the sites it matches

**Files:**
- Create: `packages/codegen/src/compiler/model/site-addresses.ts`
- Create: `packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts`
- Docs: `docs/glossary/compiler-model.md`

**Interfaces:**
- Consumes: `RuleSpacingSite` from `render-rules.ts` (`{ kind, slot, address, label, side, defaultArm, arms }`), `PathSegment`, `comparePreferencePaths`.
- Produces:

```ts
export interface AddressedSite extends RuleSpacingSite { readonly path: readonly PathSegment[]; }
export function addressSites(sites: readonly RuleSpacingSite[]): AddressedSite[];
export function matchAddress(address: readonly PathSegment[], sites: readonly AddressedSite[]): AddressedSite[];
```

`addressSites` gives every site its canonical path and returns them sorted by `comparePreferencePaths`, so the returned index of a site is its site number. `matchAddress` returns the contiguous run a prefix names, or a filtered scan when the address contains a wildcard in a non-final position.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { addressSites, matchAddress } from '../site-addresses.ts';
import { parsePreferencePath } from '../../../dsl/primitives/preference-path.ts';
import type { RuleSpacingSite } from '../render-rules.ts';

const site = (kind: string, address: string): RuleSpacingSite => ({
	kind,
	slot: 'x',
	address,
	label: address,
	side: 'seam',
	defaultArm: 'tight',
	arms: ['tight', 'space']
});

describe('addressSites', () => {
	it('sorts sites into canonical path order', () => {
		const sorted = addressSites([site('block', 'rbrace_before'), site('block', 'lbrace_after')]);
		expect(sorted.map((s) => s.address)).toEqual(['lbrace_after', 'rbrace_before']);
	});
});

describe('matchAddress', () => {
	it('matches every site beneath a prefix', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before'), site('arguments', 'lparen_after')]);
		const matched = matchAddress(parsePreferencePath('(block)'), sites);
		expect(matched.map((s) => s.kind)).toEqual(['block', 'block']);
	});

	it('matches a single site for a full address', () => {
		const sites = addressSites([site('block', 'lbrace_after'), site('block', 'rbrace_before')]);
		const matched = matchAddress(parsePreferencePath('(block)/"{"/after'), sites);
		expect(matched).toHaveLength(1);
		expect(matched[0]!.address).toBe('lbrace_after');
	});

	it('returns nothing for an address naming no site', () => {
		const sites = addressSites([site('block', 'lbrace_after')]);
		expect(matchAddress(parsePreferencePath('(nowhere)/"{"/after'), sites)).toEqual([]);
	});
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

The path for a site is its kind followed by the segments its address decomposes into. `parseSeamLabel` and `parseSpacingLabel` from `dsl/primitives/spacing.ts` already decompose today's addresses; `site-addresses.ts` uses them to build the canonical path, so the mapping from old address to new path lives in one place and Task 10 deletes it with the old spellings.

```ts
import { parseSeamLabel, parseSpacingLabel, parseFlankAddress } from '../../dsl/primitives/spacing.ts';
import { comparePreferencePaths, parsePreferencePath } from '../../dsl/primitives/preference-path.ts';
import type { PathSegment } from '../../dsl/transform/transform-path.ts';
import { publicKindName, type RuleSpacingSite } from './render-rules.ts';

export interface AddressedSite extends RuleSpacingSite {
	readonly path: readonly PathSegment[];
}

export function addressSites(sites: readonly RuleSpacingSite[]): AddressedSite[] {
	return sites
		.map((site) => ({ ...site, path: pathOf(site) }))
		.sort((a, b) => comparePreferencePaths(a.path, b.path));
}

function pathOf(site: RuleSpacingSite): readonly PathSegment[] {
	const kind: PathSegment = { kind: 'kind-match', name: publicKindName(site.kind) };
	const seam = parseSeamLabel(site.address);
	if (seam !== undefined) {
		return [kind, { kind: 'kind-match', name: seam.token }, { kind: 'kind-match', name: seam.side }];
	}
	const spacing = parseSpacingLabel(site.address);
	if (spacing !== undefined) {
		const slot: PathSegment = { kind: 'fieldName', name: site.slot };
		const separator: PathSegment = { kind: 'kind-match', name: 'separator' };
		return spacing.side === undefined
			? [kind, slot, separator]
			: [kind, slot, separator, { kind: 'kind-match', name: spacing.side }];
	}
	const flank = parseFlankAddress(site.address);
	if (flank !== undefined) {
		return [kind, { kind: 'fieldName', name: site.slot }, { kind: 'kind-match', name: flank.side }];
	}
	return [kind, ...parsePreferencePath(site.address)];
}

export function matchAddress(
	address: readonly PathSegment[],
	sites: readonly AddressedSite[]
): AddressedSite[] {
	return sites.filter((site) => isPrefixOf(address, site.path));
}

function isPrefixOf(address: readonly PathSegment[], path: readonly PathSegment[]): boolean {
	if (address.length > path.length) return false;
	for (let i = 0; i < address.length; i++) {
		if (!segmentMatches(address[i]!, path[i]!)) return false;
	}
	return true;
}

function segmentMatches(a: PathSegment, b: PathSegment): boolean {
	if (a.kind === 'wildcard') return true;
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'index':
			return a.value === (b as { value: number }).value;
		case 'literal':
			return a.text === (b as { text: string }).text;
		case 'kind-match':
		case 'fieldName':
			return a.name === (b as { name: string }).name;
		default:
			return true;
	}
}
```

- [ ] **Step 4: Run to verify passing**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts
```
Expected: PASS.

- [ ] **Step 5: Glossary**

In `docs/glossary/compiler-model.md`:

```markdown
### `packages/codegen/src/compiler/model/site-addresses.ts::addressSites`

Every site with its canonical path, sorted. A site's index in the result is its
site number, which is what makes a prefix-scoped declaration a contiguous
range rather than a scan.

### `packages/codegen/src/compiler/model/site-addresses.ts::pathOf`

A site's address decomposed into path segments. It is the only place the old
flat spellings — seam, separator, flank — are read, so retiring them is a
deletion here rather than a search.

### `packages/codegen/src/compiler/model/site-addresses.ts::matchAddress`

The sites an address names: itself and everything beneath it. A wildcard
matches any segment, so an address with an interior wildcard is a scan while a
concrete prefix is a range.
```

- [ ] **Step 6: Commit**

```bash
git commit -F <msgfile> -- \
  packages/codegen/src/compiler/model/site-addresses.ts \
  packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts \
  docs/glossary/compiler-model.md
```

---

### Task 5: Specificity by site set, and conflict detection

**Files:**
- Modify: `packages/codegen/src/compiler/model/site-addresses.ts`
- Modify: `packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts`
- Docs: `docs/glossary/compiler-model.md`

**Interfaces:**
- Consumes: `AddressedSite`, `matchAddress` from Task 4; `AddressBinding` from Task 3.
- Produces: `resolveBindings(bindings: readonly AddressBinding[], sites: readonly AddressedSite[], labelArms: ReadonlyMap<string, string>): Map<number, string>` — site index to resolved arm, most specific binding winning.

- [ ] **Step 1: Write the failing tests**

```ts
import { resolveBindings } from '../site-addresses.ts';

describe('resolveBindings', () => {
	const sites = addressSites([
		site('token_tree_punctuation', 'comma_after'),
		site('token_tree_punctuation', 'colon_after')
	]);
	const labelArms = new Map([['punctuation/after', 'space']]);

	it('applies a broad binding to every site it matches', () => {
		const out = resolveBindings([{ address: '(token_tree_punctuation)', label: 'punctuation/after' }], sites, labelArms);
		expect([...out.values()]).toEqual(['space', 'space']);
	});

	it('lets a narrower binding win over a broader one', () => {
		const out = resolveBindings(
			[
				{ address: '(token_tree_punctuation)', label: 'punctuation/after' },
				{ address: '(token_tree_punctuation)/(colon)/(after)', arm: 'tight' }
			],
			sites,
			labelArms
		);
		const bySite = new Map([...out].map(([i, arm]) => [sites[i]!.address, arm]));
		expect(bySite.get('comma_after')).toBe('space');
		expect(bySite.get('colon_after')).toBe('tight');
	});

	it('rejects two bindings whose site sets overlap without nesting', () => {
		const wide = addressSites([site('a', 'x_after'), site('a', 'y_after'), site('b', 'x_after')]);
		expect(() =>
			resolveBindings(
				[
					{ address: '(a)', arm: 'space' },
					{ address: '_/(x)/(after)', arm: 'tight' }
				],
				wide,
				new Map()
			)
		).toThrow(/overlap/);
	});

	it('rejects an address naming no site', () => {
		expect(() => resolveBindings([{ address: '(nowhere)', arm: 'space' }], sites, new Map())).toThrow(
			/names no site/
		);
	});
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts -t resolveBindings
```
Expected: FAIL — `resolveBindings is not a function`.

- [ ] **Step 3: Implement**

Append to `site-addresses.ts`:

```ts
import type { AddressBinding } from '../../dsl/wire/options-block.ts';

export function resolveBindings(
	bindings: readonly AddressBinding[],
	sites: readonly AddressedSite[],
	labelArms: ReadonlyMap<string, string>
): Map<number, string> {
	const indexOf = new Map(sites.map((site, i) => [site, i]));
	const matched = bindings.map((binding) => {
		const hits = matchAddress(parsePreferencePath(binding.address), sites);
		if (hits.length === 0) throw new Error(`options: '${binding.address}' names no site`);
		return { binding, hits: new Set(hits.map((site) => indexOf.get(site)!)) };
	});

	for (let i = 0; i < matched.length; i++) {
		for (let j = i + 1; j < matched.length; j++) {
			const a = matched[i]!.hits;
			const b = matched[j]!.hits;
			const shared = [...a].some((site) => b.has(site));
			if (!shared) continue;
			const nests = [...a].every((site) => b.has(site)) || [...b].every((site) => a.has(site));
			if (!nests) {
				throw new Error(
					`options: '${matched[i]!.binding.address}' and '${matched[j]!.binding.address}' overlap without one containing the other`
				);
			}
		}
	}

	const out = new Map<number, string>();
	for (const { binding, hits } of [...matched].sort((a, b) => b.hits.size - a.hits.size)) {
		const arm = binding.arm ?? labelArms.get(binding.label!);
		if (arm === undefined) throw new Error(`options: '${binding.address}' resolves to no arm`);
		for (const site of hits) out.set(site, arm);
	}
	return out;
}
```

Broadest first, narrowest last, so a narrower binding overwrites. The conflict check runs before any writing, so an ambiguous pair fails rather than resolving by declaration order.

- [ ] **Step 4: Run to verify passing**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts
```
Expected: PASS.

- [ ] **Step 5: Glossary**

```markdown
### `packages/codegen/src/compiler/model/site-addresses.ts::resolveBindings`

Each site's arm, with the narrowest binding that reaches it winning. Specificity
is the site set rather than the path length, because two addresses can reach one
site from different roots with neither a prefix of the other. Two bindings whose
sets overlap without one containing the other are a conflict, reported before
anything is written, so an ambiguous pair fails rather than resolving by
declaration order.
```

- [ ] **Step 6: Commit**

```bash
git commit -F <msgfile> -- \
  packages/codegen/src/compiler/model/site-addresses.ts \
  packages/codegen/src/compiler/model/__tests__/site-addresses.test.ts \
  docs/glossary/compiler-model.md
```

---

### Task 6: Site numbering by canonical path order

Behaviour-preserving. Site indices move; nothing else does. This is the task that makes a prefix a range.

**Files:**
- Modify: `packages/codegen/src/emitters/render-options-rs.ts`
- Test: `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts` (create if absent)
- Docs: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `addressSites` from Task 4.
- Produces: `SPACING_SITES` emitted in canonical path order; a new `SITE_PATHS: &[&str]` table parallel to it, holding each site's formatted path.

- [ ] **Step 1: Write the failing test**

```ts
it('emits sites in canonical path order with a parallel path table', () => {
	const plan = buildRenderOptionsPlan(/* the fixture the neighbouring tests use */);
	const addresses = plan.spacingSites.map((s) => s.constName);
	expect(addresses).toEqual([...addresses].sort());
	expect(plan.sitePaths).toHaveLength(plan.spacingSites.length);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-options-rs.test.ts
```
Expected: FAIL — `sitePaths` undefined.

- [ ] **Step 3: Sort the site list and emit the path table**

In `render-options-rs.ts`, where `spacingSites` is assembled, replace the current ordering with `addressSites(sites)` and carry `formatPreferencePath(site.path)` onto each row. Emit beside `SPACING_SITES`:

```rust
pub static SITE_PATHS: &[&str] = &[
    "(abstract_type)/(abstract_type)/(after)",
    …
];
```

- [ ] **Step 4: Run to verify passing, then regenerate**

```bash
pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-options-rs.test.ts
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
```
Expected: `options.rs` churns heavily (every `SITE_*` constant renumbers); `transport.rs` changes only where field order follows site order; **`test-fixtures.json` must not move for any grammar.**

- [ ] **Step 5: Verify the renumbering is behaviour-neutral**

```bash
cd rust && cargo build -p sittir-rust && cd ..
pnpm run validate:native
```
Expected: every metric identical. A renumbering that changed behaviour means a site index leaked somewhere it was treated as stable — find it rather than accepting the movement.

- [ ] **Step 6: Full suite and commit**

```bash
pnpm exec vitest run
git commit -F <msgfile> -- \
  packages/codegen/src/emitters/render-options-rs.ts \
  packages/codegen/src/emitters/__tests__/render-options-rs.test.ts \
  docs/glossary/emitters.md \
  packages/{rust,typescript,python}/src \
  packages/{rust,typescript,python}/.sittir \
  rust/crates/sittir-{rust,typescript,python}/src/render
```

---

### Task 7: Range resolution on the native side

**Files:**
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` — the emitted `resolve()`.
- Test: `rust/crates/sittir-core/src/options.rs` — unit tests for the range helper.
- Docs: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `SITE_PATHS` from Task 6.
- Produces: `pub fn site_range(prefix: &str) -> (usize, usize)` in the generated `options.rs`, and a `resolve()` that walks a nested JSON object rather than scanning six tables.

- [ ] **Step 1: Write the failing Rust test**

In the generated crate's test module (emit it alongside `resolve`):

```rust
#[test]
fn a_prefix_names_a_contiguous_range() {
    let (start, end) = site_range("(block)");
    assert!(end > start);
    for i in start..end {
        assert!(SITE_PATHS[i].starts_with("(block)"));
    }
    for (i, path) in SITE_PATHS.iter().enumerate() {
        if path.starts_with("(block)/") || *path == "(block)" {
            assert!(i >= start && i < end, "site {i} {path} outside the range");
        }
    }
}
```

- [ ] **Step 2: Run to verify failure**

```bash
cd rust && cargo test -p sittir-rust a_prefix_names_a_contiguous_range
```
Expected: FAIL — `site_range` not found.

- [ ] **Step 3: Implement `site_range` and the nested walk**

Emit into `options.rs`:

```rust
pub fn site_range(prefix: &str) -> (usize, usize) {
    let start = SITE_PATHS.partition_point(|path| path.as_bytes() < prefix.as_bytes());
    let mut end = start;
    while end < SITE_PATHS.len() && path_under(SITE_PATHS[end], prefix) {
        end += 1;
    }
    (start, end)
}

fn path_under(path: &str, prefix: &str) -> bool {
    path == prefix || (path.starts_with(prefix) && path.as_bytes().get(prefix.len()) == Some(&b'/'))
}
```

Replace `resolve()`'s six-branch loop with a recursive walk that builds a path from the nested keys and applies each leaf through `site_range`. Keep the unknown-key error: a path that yields an empty range is `Err(format!("options: unknown key {path}"))`.

- [ ] **Step 4: Run to verify passing**

```bash
cd rust && cargo test -p sittir-rust && cargo test -p sittir-core
```
Expected: PASS.

- [ ] **Step 5: Gate**

```bash
cd rust/crates/sittir-rust && pnpm run build && cd ../../..
pnpm run validate:native
pnpm exec vitest run
```
Expected: no metric movement, no fixture movement, suite green.

- [ ] **Step 6: Commit** (pathspec as in Task 6)

---

### Task 8: The nested TypeScript surface

**Files:**
- Modify: `packages/codegen/src/emitters/options.ts`
- Modify: `packages/{rust,typescript,python}/tests/__snapshots__/options.test.ts.snap`
- Docs: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `OptionsDeclarations` from Task 3, `addressSites` from Task 4.
- Produces: an `Options` type with two intersected halves — labels nested by their path, addresses nested by theirs.

- [ ] **Step 1: Write the failing test**

In `packages/rust/tests/options.test.ts`, beside the existing pin:

```ts
it('nests a label and an address by their paths', () => {
	const source = readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8');
	expect(source).toContain('body?: {');
	expect(source).toContain("'{'?: {");
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/rust/tests/options.test.ts
```
Expected: FAIL — the emitted type is still flat.

- [ ] **Step 3: Emit both halves nested**

In `options.ts`, replace the flat `SpacingLabel`/`KindSpacing` union emission with a recursive object-type printer over the sorted site paths, and a second over the declared label paths, intersected.

- [ ] **Step 4: Regenerate, update the pins, verify**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
pnpm exec vitest run -u packages/{rust,typescript,python}/tests/options.test.ts
```
Before accepting the updated snapshots, diff them and confirm the change is a re-nesting of the same keys — no key gained or lost. A key that disappears is a site that lost its address.

- [ ] **Step 5: Full gate and commit** (pathspec as in Task 6, plus the three snapshots)

---

### Task 9: Migrate the three grammars

135 `preference()` calls move from `patches:` to `options:` — rust 54, typescript 59, python 22. This is the task that moves rendered output, and the only one that does.

**Files:**
- Modify: `packages/rust/grammar.sittir.ts:78-126,160-400`
- Modify: `packages/typescript/grammar.sittir.ts:179-250,390-400`
- Modify: `packages/python/grammar.sittir.ts:85-102,205-230`

**Interfaces:**
- Consumes: everything from Tasks 1-8.
- Produces: no `preference()` call remains under `patches:` in any grammar.

- [ ] **Step 1: Migrate rust, mechanically**

Each declaration maps by its current shape:

| today | becomes |
| --- | --- |
| `eq_before: preference('eq_before','space')` | label `'assignment/before': preference('assignment/before','space')` + a binding per owning kind |
| `named_imports: { lbrace_after: … }` | `'(named_imports)/"{"/after'` |
| `empty_separator_space: 'newline'` | `'_/_:/(_)/after'` — the gap is the child's |
| `block: { lbrace_after: preference('block_body_before','indent') }` | binding `'(block)/"{"/after': 'body/before'` |

- [ ] **Step 2: Regenerate rust and diff the fixtures**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
git diff -- rust/crates/sittir-rust/test-fixtures.json | head -80
```
Expected: **no movement.** The migration is a re-spelling; any rendered string that changes means a declaration landed on a different site set than it used to. Chase it before continuing — that is the whole point of migrating before deleting.

- [ ] **Step 3: Repeat for typescript and python**

Same procedure, one grammar at a time, fixtures unchanged each time.

- [ ] **Step 4: Full gate**

```bash
cd rust/crates/sittir-rust && pnpm run build && cd ../../..
pnpm run validate:native && pnpm exec vitest run && cd rust && cargo test -p sittir-core
```

- [ ] **Step 5: Commit** (one commit per grammar, pathspec each)

---

### Task 10: Retire the old surface

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts:340-400` — delete `renderDefaultsOf`'s five branches, `onePreference`, `isSeamDefaultKey`, `isFlankDefaultKey`.
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` — delete `LABELS`, `FLANK_SITES`, `SUPERTYPE_MEMBERS`, `flank_supertype`.
- Modify: `packages/codegen/src/compiler/model/site-addresses.ts` — `pathOf` loses its seam/separator/flank branches; a site's path comes from its own address.
- Docs: prune the retired entries from `docs/glossary/dsl-wire.md` and `docs/glossary/emitters.md`.

- [ ] **Step 1: Delete, then type-check**

```bash
pnpm exec tsc --noEmit -p packages/codegen
```
Expected: no output. Any error names a consumer the deletion missed.

- [ ] **Step 2: Assert the old spellings are gone**

```bash
date +%s > .infigraph/.search-fallback-allowed
```
then, in a separate call:
```bash
rg -n "separator_space|_start'|_end'|LABELS" packages/codegen/src --glob '!**/__tests__/**'
```
Expected: no hits outside `site-addresses.ts`'s migration comment-free code.

- [ ] **Step 3: Regenerate all three and gate**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
cd rust/crates/sittir-rust && pnpm run build && cd ../../..
pnpm run validate:native && pnpm exec vitest run && cd rust && cargo test -p sittir-core
```
Expected: fixtures unchanged, every metric identical, suite green.

- [ ] **Step 4: Check the site-count ratchet**

Rust's spacing site count is 1149 at the start of this plan. Tasks 1-10 must not exceed that: they re-address sites, they do not mint them. A higher count here means a path decomposition split a site that used to be one. Task 11 mints deliberately and moves the ceiling with a recorded reason.

- [ ] **Step 5: Commit**

---

---

### Task 11: A sibling gap belongs to the child before it

The gap between two siblings has three owners today — the preceding child's
trailing edge, the slot's separator, the following child's leading edge — and
the writer picks the widest. So a list cannot say "blank line between items,
but not after an attribute": rust's rebuild renders a spurious blank line
between `#[derive(Debug, Clone, PartialEq, Eq)]` and the `pub enum` it
decorates, because both are `source_file` statements and the slot's separator
is `blankline` for all of them.

The fix is not a new kind of site. A child's trailing edge already is one —
`("attribute_item", "attribute_item_after", …)` — it is merely global to the
kind, and global is wrong: an attribute wants a newline after it among
statements and a space after it among parameters. This task gives kind edges
(parent kind, slot, child kind) granularity so the two can differ, and lets a
slot hand its gaps to its children by declaring its separator `tight`.

No writer change. Once the separator contributes nothing, the preceding
child's edge is the only mark in the gap, so coalescing has nothing left to
arbitrate and specificity decides alone.

**Files:**
- Modify: `packages/codegen/src/compiler/model/render-rules.ts` — `withKindEdges`, `spacingSitesOf`
- Modify: `packages/codegen/src/compiler/model/__tests__/render-rules.test.ts`
- Modify: `packages/rust/grammar.sittir.ts`
- Docs: `docs/glossary/compiler-model.md`

**Interfaces:**
- Consumes: `AddressedSite`, `resolveBindings` from Tasks 4-5.
- Produces: a kind-edge site per (parent kind, slot, child kind), addressed
  `(<parent>)/<slot>:/(<child>)/after`. The existing global `(<child>)/after`
  stays as the broad address those narrow ones override — subset specificity,
  no new resolution rule. A slot admitting one child kind keeps one site.

- [ ] **Step 1: Write the failing test**

In `render-rules.test.ts`:

```ts
it('gives a child edge per (slot, child kind) where a slot is heterogeneous', () => {
	const sites = spacingSitesOf(renderRules, nodeMap).filter(
		(s) => s.kind === 'source_file' && s.slot === 'statements'
	);
	const addresses = sites.map((s) => s.address);
	expect(addresses).toContain('statements_attribute_item_after');
	expect(addresses).toContain('statements_enum_item_after');
});

it('keeps one child edge where a slot admits one kind', () => {
	const sites = spacingSitesOf(renderRules, nodeMap).filter(
		(s) => s.kind === 'enum_variant_list_elements' && s.address.endsWith('_after')
	);
	expect(sites).toHaveLength(1);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/render-rules.test.ts -t 'child edge'
```
Expected: FAIL — one global edge per child kind.

- [ ] **Step 3: Mint child edges per slot**

In `withKindEdges`, where `part('before')` and `part('after')` are built for a
kind, a kind reached as a repeat element also takes a pair addressed by its
seating: `siteKey(`${slot}_${publicKindName(childKind)}`, seamLabel(...))`.
A slot whose values resolve to a single kind emits the current single pair
unchanged, so homogeneous slots keep their site and their address.

The render side selects among them by the element's kind, which `ListView`
already knows per item — the same `base + ordinal` shape as the punctuation
arm seams, not a named field per child kind.

- [ ] **Step 4: Run to verify passing**

```bash
pnpm exec vitest run packages/codegen/src/compiler/model/__tests__/render-rules.test.ts
```
Expected: PASS.

- [ ] **Step 5: Regenerate and confirm the corpus has not moved**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
git diff --stat -- rust/crates/sittir-rust/test-fixtures.json
```
Expected: **no movement.** Minting alone changes nothing — every new site
inherits the arm the single site had.

- [ ] **Step 6: Delegate the slot and declare the exception**

In `packages/rust/grammar.sittir.ts`, replace the `source_file` separator
declaration with:

```ts
'(source_file)/statements:/(_)/after':              'blankline',
'(source_file)/statements:/(attribute_item)/after': 'newline',
```

The slot's `empty_separator_space` declaration goes; a repeat with no separator
token has nothing between its elements but this gap. `(_)` matches any kind, as
in scm, where `_` matches any node at all. The first line is the slot's default
gap; the second matches a strict subset of it and wins.

The last element's `after` needs no special case: the writer drops a seam
payload with nothing following it, so a trailing gap at end-of-render
disappears rather than trailing whitespace onto the output.

- [ ] **Step 7: Verify the rebuild**

```bash
cd rust/crates/sittir-rust && pnpm run build && cd ../../..
pnpm exec vitest run packages/rust/tests/examples-verify.test.ts
```
Expected: the generated rebuild of `splice.rs` no longer carries a blank line
between the derive attribute and `pub enum SpliceError`, and still carries one
between every other pair of top-level items. Blank lines move from 4 correct /
1 spurious / 3 missing to 4 correct / 0 spurious / 3 missing.

- [ ] **Step 8: Record the ratchet move**

The site count rises by the number of heterogeneous repeat slots across the
three grammars. Record the new ceiling with its reason: an edge now
distinguishes the child it belongs to, which is what makes a per-child gap
declarable.

- [ ] **Step 9: Full gate and commit**

```bash
pnpm run validate:native && pnpm exec vitest run && cd rust && cargo test -p sittir-core
```


## Self-Review

**Spec coverage.** Path segments including literals — Task 1. Sides as segments, three terminals — Tasks 2, 9. Model-addressed — Task 4 (`pathOf` builds from the model's sites, never from a tree query). `options:`/`patches:` split — Task 3. Labels as paths, declared labels win — Task 3. `_bindings` three-form value — Tasks 3, 5. Site-set specificity and conflicts — Task 5. Sorted-path numbering — Task 6. Runs and ranges — Task 7. Both nested TS faces — Task 8. Migration — Task 9. Retirement of the six tables — Task 10.

**Not covered, deliberately:** the render context, `FillOptions` deletion and the per-node option fields are plan 2. Task 11 goes beyond the spec's address grammar into site granularity: a child's trailing edge exists but is global to the kind, and a per-slot gap needs it scoped to where the child sits. It needs no writer change, so the spec's non-goal on coalescing holds. Interior wildcards fall back to a scan (Task 4's `matchAddress` filters rather than ranges) — correct but not optimised, which the spec permits.

**Gap found and closed:** the spec's `separator` admitting either whitespace or token kinds needs the arm-family check to survive the rewrite. `resolveBindings` (Task 5) resolves an arm but does not validate it against the site's `arms`. Add to Task 5 Step 3, after `const arm = …`:

```ts
		const site = sites[[...hits][0]!]!;
		if (!site.arms.includes(arm as never)) {
			throw new Error(`options: '${binding.address}' is '${arm}', not one of ${site.arms.join(', ')}`);
		}
```

with a test in Task 5 Step 1:

```ts
	it('rejects an arm the site does not admit', () => {
		expect(() => resolveBindings([{ address: '(token_tree_punctuation)', arm: 'blankline' }], sites, new Map())).toThrow(
			/not one of/
		);
	});
```

**Type consistency:** `AddressedSite` is produced by `addressSites` (Task 4) and consumed by `matchAddress` and `resolveBindings` (Tasks 4, 5) and the emitter (Task 6). `AddressBinding` is produced by `readOptionsBlock` (Task 3) and consumed by `resolveBindings` (Task 5). `formatPreferencePath` (Task 2) is used by Task 6's `SITE_PATHS` and Task 7's `site_range` comparison — both operate on the same string form.
