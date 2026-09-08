# Enum and keyword arms through supertypes — Implementation Plan
> **Status:** Tasks 2–3 SUPERSEDED by `2026-09-07-enum-leaf-kind-id-storage.md` (the classifier-only walk moved the gates; the stamp now lives on the model). Tasks 4–6 remain.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A slot that reaches an enum-of-literals or keyword kind through a transparent supertype stores the literal's kind id, so a token in a token tree is spelled `TSKindId.Comma`; the dogfood examples are type-checked; the aliased pattern leaves `ir` drops by name prefix are exposed by the model's own fact.

**Architecture:** One walk over a slot's arms (`enumArmsOf`) that looks through `AssembledSupertype` subtypes feeds both the storage classifier and the wrap's text→id table; nothing downstream changes because `mixedEnum` slots already read, type, transport and render kind ids. The ir emitter's leaf loops test `node.userFacing` (the assemble-time fact) instead of the `_` prefix.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, the codegen pipeline (`pnpm exec tsx packages/cli/src/cli.ts gen …`), the validators (`validate counts`).

**Spec:** `docs/superpowers/specs/2026-09-07-strict-rebuild-from-source-design.md`

## Global Constraints

- Generated outputs (`packages/<g>/src/*`, `packages/<g>/.sittir/*`, `rust/crates/sittir-<g>/*`) are never hand-edited; regenerate with `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`.
- No explanatory comments in `packages/codegen/src/`; document in `docs/glossary/emitters.md` under the qualified name (`### \`packages/codegen/src/emitters/shared.ts::enumArmsOf\``).
- No spec/plan/PR numbers in code or docs.
- Commit by pathspec: `git commit -m … -- <paths>`; a source-only commit before regen needs `--no-verify`; commit generated output separately.
- A moved gate stops for review; never revert to make it pass.
- Gates: byte gate (six dogfood renders identical), `validate counts` for all three grammars identical (rust 149/149 · 207/207 · 134/137 · 1517/1517; typescript 145/145 · 193/193 · 112/114 · 1202/1202; python 126/126 · 142/142 · 115/116 · 1390/1390), `pnpm exec vitest run packages/codegen packages/tools packages/cli packages/rust packages/typescript packages/python`, `rtk cargo test --workspace --exclude sittir-parity-tests`, `pnpm run type-check`, `bash scripts/assert-scope-boundaries.sh`.
- Byte gate script: render `rebuildSplice()`, `rebuildSpliceStrict()`, `rebuildFormat()`, `rebuildFormatStrict()`, `rebuildProbeSweep()`, `rebuildProbeSweepStrict()` from `examples/17|18|19-dogfood-*.ts` via `node.$render()` and diff against a baseline captured at HEAD before editing (the strict rust render is 920 B after the `Formatter<'_>` change).

---

### Task 1: Type-check the dogfood examples

**Files:**
- Modify: `examples/tsconfig.json`
- Modify: `examples/16-dogfooding.ts:20`
- Modify: `examples/17-dogfood-rust-strict.ts:1-20`, `examples/18-dogfood-typescript-strict.ts:1-12`, `examples/19-dogfood-python-strict.ts:1-8` (header comments only)

**Interfaces:**
- Consumes: nothing.
- Produces: `pnpm run type-check:examples` covers `16-dogfooding.ts`, `17-dogfood-rust.ts`, `17-dogfood-rust-strict.ts`, `18-dogfood-typescript.ts`, `18-dogfood-typescript-strict.ts`, `19-dogfood-python.ts`, `19-dogfood-python-strict.ts`.

- [ ] **Step 1: Add the dogfood files to the examples project**

Replace the `include` array in `examples/tsconfig.json` with:

```json
"include": [
	"./helpers.ts",
	"./01-construct-nodes.ts",
	"./02-render-round-trip.ts",
	"./07-read-source.ts",
	"./09-type-guards.ts",
	"./16-dogfooding.ts",
	"./17-dogfood-rust.ts",
	"./17-dogfood-rust-strict.ts",
	"./18-dogfood-typescript.ts",
	"./18-dogfood-typescript-strict.ts",
	"./19-dogfood-python.ts",
	"./19-dogfood-python-strict.ts"
]
```

- [ ] **Step 2: Run the type-check to see the one pre-existing error**

Run: `pnpm run type-check:examples`
Expected: exactly one error, `16-dogfooding.ts(20,5): error TS2322 … Property 'kind' is missing in type '{ members: PropertySignature.Built[]; }' but required in type '{ kind: "object_type"; }'`.

- [ ] **Step 3: Tag the interface body's kind**

In `examples/16-dogfooding.ts` the `body` value of `ir.interfaceDeclaration({ … })` is a config on a multi-kind slot; a config on such a slot names its kind. Change

```ts
				body: {
					members: grammar.kinds.map((kind) =>
```

to

```ts
				body: {
					kind: 'object_type',
					members: grammar.kinds.map((kind) =>
```

- [ ] **Step 4: Make the strict headers state what they build**

In `examples/18-dogfood-typescript-strict.ts` replace the paragraph beginning `// The whole file rebuilds here:` with:

```ts
// What rebuilds here is the file's skeleton: the import with its type
// modifier and both function declarations with parameter and return
// annotations. Each body holds two statements (`let result = …;` and
// `return result;`); the real bodies are not written. The coercion half
// renders the same functions with empty bodies and no annotations; every
// shape below is constructible on this surface.
```

In `examples/19-dogfood-python-strict.ts` replace the paragraph beginning `// The whole shape rebuilds here` with:

```ts
// What rebuilds here is the file's skeleton: real `import` statements, a
// `def main()` carrying an indented suite, and a module holding them. The
// suite holds one call statement; the real function bodies and the helper
// functions are not written. The coercion half renders the imports as
// comments and the module as a single call line; none of that is a surface
// limit.
```

In `examples/17-dogfood-rust-strict.ts` replace the paragraph beginning `// All six top-level items rebuild here` with:

```ts
// All six top-level items rebuild here with their real signatures,
// including `#[derive(…)]` and the `write!(f, …)` match arms.
// `apply_edits` holds its first two statements and an empty `sort_by`
// closure; the validation loop, the comparator and the apply loop are not
// written. The factory surface is currently the healthier of the two: the
// coercion rebuild renders those same arms as empty `{}` and drops the
// `sort_by` comparator, both of which are constructible below.
```

- [ ] **Step 5: Run the type-check to verify zero errors**

Run: `pnpm run type-check:examples`
Expected: no output, exit 0.

- [ ] **Step 6: Run the example verification suites**

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts`
Expected: all pass (the `it.fails` cases still fail as expected).

- [ ] **Step 7: Commit**

```bash
git commit -m "chore(examples): type-check the dogfood examples; the strict headers state what they build" -- examples/tsconfig.json examples/16-dogfooding.ts examples/17-dogfood-rust-strict.ts examples/18-dogfood-typescript-strict.ts examples/19-dogfood-python-strict.ts
```

---

### Task 2: One walk over a slot's enum and keyword arms, through supertypes

**Files:**
- Modify: `packages/codegen/src/emitters/shared.ts` (`classifyFieldStorageInfo`, `kindEnumTextIdPairs`; new `enumArmsOf`)
- Test: `packages/codegen/src/emitters/__tests__/field-storage-supertype-arms.test.ts` (create)
- Modify: `docs/glossary/emitters.md` (entries for `enumArmsOf`, `classifyFieldStorageInfo`, `kindEnumTextIdPairs`)

**Interfaces:**
- Consumes: `AssembledSupertype.subtypes: readonly NodeOrTerminal[]` (each `{ node: { kind: 'unresolved-ref', name }, storageKindId?, multiplicity }`), `AssembledEnum.resolvedKinds / resolvedKindIds / resolvedByText / values`, `AssembledKeyword.text / resolvedKind / resolvedKindId`, `keywordRefWireIdentity(value, node)`, `storageKindOfRef(node)`, `isNodeRef(value)`, `isTerminalValue(value)`, `nodeMap.nodes: Map<string, AssembledNode>`.
- Produces:

```ts
export interface EnumArm {
	readonly kind: string;        // catalog kind of the member (e.g. 'comma', 'u8', 'self')
	readonly id: number | undefined;
	readonly text: string;        // the literal's text
}
export interface EnumArms {
	readonly arms: readonly EnumArm[];   // deduped by kind, first occurrence wins
	readonly texts: readonly string[];   // deduped by text, in arm order
	readonly sawNodeArm: boolean;        // any arm that is a node (incl. non-enum subtypes of a supertype)
	readonly verbatim: boolean;          // an arm that cannot be seated as an id (single-value enum, unresolved keyword, non-terminal value)
}
export function enumArmsOf(field: AssembledNonterminal, nodeMap: NodeMap): EnumArms;
```

- [ ] **Step 1: Write the failing test**

Create `packages/codegen/src/emitters/__tests__/field-storage-supertype-arms.test.ts`:

```ts
import { CHOICE, FIELD, PATTERN, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledEnum,
	AssembledKeyword,
	AssembledPattern,
	AssembledSupertype
} from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { enumArmsOf, resolveFieldStorageInfo, kindEnumTextIdPairs } from '../shared.ts';

const kindEntries = [
	{ id: 1, kind: 'u8', symbolName: 'anon_sym_u8', anon: false },
	{ id: 2, kind: 'bool', symbolName: 'anon_sym_bool', anon: false },
	{ id: 3, kind: 'self', symbolName: 'anon_sym_self', anon: false }
];

// token_tree: seq(field('tokens', repeat($._token))); _token is a supertype over
// a pattern, a keyword and an enum-of-literals — the shape of rust's
// `_delim_tokens` → `_non_special_token` → `token_tree_punctuation`.
function makeTokenTreeNodeMap() {
	const treeRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'tokens', content: { type: REPEAT, content: { type: SYMBOL, name: '_token' } } }]
	};
	const tokenRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'self' },
			{ type: SYMBOL, name: '_primitive_type' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('token_tree', new AssembledBranch('token_tree', flatten(treeRule), flatten(treeRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }, { kindEntries }));
	nodes.set(
		'_primitive_type',
		new AssembledEnum(
			'_primitive_type',
			{ type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] },
			{ kindEntries }
		)
	);
	nodes.set(
		'_token',
		new AssembledSupertype('_token', tokenRule, [{ name: 'identifier' }, { name: 'self' }, { name: '_primitive_type' }])
	);
	return makeNodeMapWith(nodes);
}

describe('enum and keyword arms reached through a supertype', () => {
	it('enumArmsOf lists the enum members and the keyword, and notes the pattern as a node arm', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const tree = nodeMap.nodes.get('token_tree')!;
		const slot = tree.slots.find((s) => s.name === 'tokens')!;
		const arms = enumArmsOf(slot, nodeMap);
		expect(arms.arms.map((a) => [a.kind, a.id, a.text])).toEqual([
			['self', 3, 'self'],
			['u8', 1, 'u8'],
			['bool', 2, 'bool']
		]);
		expect(arms.texts).toEqual(['self', 'u8', 'bool']);
		expect(arms.sawNodeArm).toBe(true);
		expect(arms.verbatim).toBe(false);
	});

	it('the slot classifies mixedEnum with the members as its enum kinds', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const slot = nodeMap.nodes.get('token_tree')!.slots.find((s) => s.name === 'tokens')!;
		const info = resolveFieldStorageInfo(slot, nodeMap);
		expect(info.kind).toBe('mixedEnum');
		expect(info.enumKinds).toEqual(['self', 'u8', 'bool']);
		expect([...info.enumKindsById.entries()]).toEqual([
			['self', 3],
			['u8', 1],
			['bool', 2]
		]);
		expect(info.texts).toEqual(['self', 'u8', 'bool']);
	});

	it('the wrap text→id pairs come from the same walk', () => {
		const nodeMap = makeTokenTreeNodeMap();
		const slot = nodeMap.nodes.get('token_tree')!.slots.find((s) => s.name === 'tokens')!;
		expect(kindEnumTextIdPairs(slot, nodeMap, kindEntries)).toEqual([
			['self', 3],
			['u8', 1],
			['bool', 2]
		]);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/field-storage-supertype-arms.test.ts`
Expected: FAIL — `enumArmsOf` is not exported (import error), or, if only the second case is run, `info.kind` is `'verbatim'` / `'mixedEnum'` with `enumKinds` `[]`.

- [ ] **Step 3: Write `enumArmsOf` and make both consumers read it**

In `packages/codegen/src/emitters/shared.ts`, above `classifyFieldStorageInfo`, add:

```ts
export interface EnumArm {
	readonly kind: string;
	readonly id: number | undefined;
	readonly text: string;
}

export interface EnumArms {
	readonly arms: readonly EnumArm[];
	readonly texts: readonly string[];
	readonly sawNodeArm: boolean;
	readonly verbatim: boolean;
}

export function enumArmsOf(field: AssembledNonterminal, nodeMap: NodeMap): EnumArms {
	const arms: EnumArm[] = [];
	const texts: string[] = [];
	const seenKinds = new Set<string>();
	const seenTexts = new Set<string>();
	const visitedSupertypes = new Set<string>();
	let sawNodeArm = false;
	let verbatim = false;
	const push = (kind: string, id: number | undefined, text: string): void => {
		if (!seenKinds.has(kind)) {
			seenKinds.add(kind);
			arms.push({ kind, id, text });
		}
		if (!seenTexts.has(text)) {
			seenTexts.add(text);
			texts.push(text);
		}
	};
	const visitNode = (value: NodeBackedRef, node: AssembledNode | undefined): void => {
		if (node instanceof AssembledEnum) {
			if (node.values.length <= 1 || node.resolvedKinds.length === 0) {
				verbatim = true;
				return;
			}
			for (const [text, entry] of node.resolvedByText) push(entry.kind, entry.id, text);
			return;
		}
		if (node instanceof AssembledKeyword || node instanceof AssembledToken) {
			const text = node.text;
			const { kindName, kindId } = keywordRefWireIdentity(value, node);
			if (kindName === undefined || text === undefined) {
				verbatim = true;
				return;
			}
			push(kindName, kindId, text);
			return;
		}
		if (node instanceof AssembledSupertype) {
			if (visitedSupertypes.has(node.kind)) return;
			visitedSupertypes.add(node.kind);
			for (const sub of node.subtypes) {
				if (!isNodeRef(sub)) continue;
				visitNode(sub, nodeMap.nodes.get(storageKindOfRef(sub.node)));
			}
			return;
		}
		sawNodeArm = true;
	};
	for (const value of field.values) {
		if (isNodeRef(value)) {
			visitNode(value, nodeMap.nodes.get(storageKindOfRef(value.node)));
			continue;
		}
		if (!isTerminalValue(value)) {
			verbatim = true;
			continue;
		}
		if (value.resolvedKind !== undefined) push(value.resolvedKind, value.resolvedKindId, value.value);
		else if (!seenTexts.has(value.value)) {
			seenTexts.add(value.value);
			texts.push(value.value);
		}
	}
	return { arms, texts, sawNodeArm, verbatim };
}
```

Replace the body of `classifyFieldStorageInfo` after the two presence branches (`boolean`, `bitflag`) with:

```ts
	const verbatim = (): FieldStorageInfo => ({
		kind: 'verbatim',
		texts: [],
		enumKinds: [],
		enumKindsById: new Map(),
		collapsesMultiplicity: false
	});
	const walked = enumArmsOf(field, nodeMap);
	if (walked.verbatim || walked.arms.length === 0) return verbatim();
	const enumKindsById = new Map<string, number>();
	for (const arm of walked.arms) if (arm.id !== undefined) enumKindsById.set(arm.kind, arm.id);
	return {
		kind: walked.sawNodeArm ? 'mixedEnum' : 'kindEnum',
		texts: [...walked.texts],
		enumKinds: walked.arms.map((a) => a.kind),
		enumKindsById,
		collapsesMultiplicity: false
	};
```

Replace the body of `kindEnumTextIdPairs` with:

```ts
	const out: (readonly [string, number])[] = [];
	const seen = new Set<string>();
	for (const arm of enumArmsOf(field, nodeMap).arms) {
		const id = arm.id ?? kindEntries?.find((e) => e.kind === arm.kind)?.id;
		if (id === undefined || seen.has(arm.text)) continue;
		seen.add(arm.text);
		out.push([arm.text, id]);
	}
	return out;
```

Keep the `kindEntries` parameter (the keyword fallback still reads it). Import `AssembledSupertype` into `shared.ts` from `../compiler/model/node-map.ts` if it is not already imported.

- [ ] **Step 4: Run the new test and the codegen suite**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/field-storage-supertype-arms.test.ts`
Expected: PASS (3 tests).

Run: `pnpm exec vitest run packages/codegen`
Expected: 1222 tests pass, 1 skipped, plus the 3 new (1225 pass). A failure in an existing storage test is a finding: stash the change, rerun that test, and record whether it pinned the old behaviour before changing its expectation.

- [ ] **Step 5: Glossary**

In `docs/glossary/emitters.md`, add before the `classifyFieldStorageInfo` entry:

````markdown
### `packages/codegen/src/emitters/shared.ts::enumArmsOf`

```text
/**
 * The one walk over a slot's arms that seats fixed-text members as kind
 * ids: an enum-of-literals arm contributes every member, a keyword or
 * token arm contributes itself, and a transparent supertype arm is looked
 * through to its subtypes, recursively, so `_delim_tokens` →
 * `_non_special_token` → `token_tree_punctuation` seats `TSKindId.Comma`
 * exactly as a direct enum arm does. Any other node arm (a pattern, a
 * compound) is a node arm. `verbatim` marks an arm that cannot be seated
 * as an id at all (a single-value enum, a keyword with no wire identity,
 * a non-terminal value); the classifier then falls back to text for the
 * whole slot. `classifyFieldStorageInfo` and `kindEnumTextIdPairs` both
 * read this walk; neither re-derives it.
 */
```
````

In the `classifyFieldStorageInfo` entry replace the first sentence of the prose with: `One encoding per slot, derived from \`enumArmsOf\`: a slot whose arms are all fixed-text members (directly or through a supertype) classifies \`kindEnum\`; a slot mixing those with node arms classifies \`mixedEnum\`.` In the `kindEnumTextIdPairs` entry replace the `#### body` comment text with `// The arms come from enumArmsOf — the same walk classifyFieldStorageInfo reads.`

- [ ] **Step 6: Commit (source only, before regen)**

```bash
git commit --no-verify -m "feat(emitters): enum and keyword arms are seated as kind ids through a supertype; one walk feeds the classifier and the wrap table" -- packages/codegen/src/emitters/shared.ts packages/codegen/src/emitters/__tests__/field-storage-supertype-arms.test.ts docs/glossary/emitters.md
```

---

### Task 3: Regenerate, census the reclassified slots, hold the gates

**Files:**
- Regenerate: `packages/rust/src`, `packages/rust/.sittir`, `rust/crates/sittir-rust/{src,index.d.ts,test-fixtures.json}` and the typescript and python equivalents.

**Interfaces:**
- Consumes: Task 2.
- Produces: the census (which kinds' slots changed class) recorded in the generated commit message.

- [ ] **Step 1: Capture the byte-gate baseline and the current generated types**

```bash
S=$TMPDIR/enum-arms; mkdir -p $S/base
for g in rust typescript python; do cp packages/$g/src/types.ts $S/base/$g-types.ts; done
```

Then run the byte-gate script (Global Constraints) into `$S/base/renders`.

- [ ] **Step 2: Regenerate all three grammars**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src || exit 1; done
```

Expected: exit 0 for each.

- [ ] **Step 3: Census the reclassified slots**

```bash
for g in rust typescript python; do echo "== $g"; diff $S/base/$g-types.ts packages/$g/src/types.ts | awk '/^[<>].*readonly _/' | sed -E 's/^([<>])\s*readonly (_[a-z0-9_]+).*/\1 \2/' | sort -u; done
```

Expected for rust: the `_delim_tokens` slots of `delim_token_tree_{paren,bracket,brace}`, the `_tokens` slots of `token_tree_{paren,bracket,brace}` and the `_token_patterns` slots of the pattern trees now read `readonly _delim_tokens?: readonly (TSKindId.Plus | … | TSKindId.Comma | … | Identifier | StringLiteral | … | DelimTokenTree)[]` and no longer name `TokenTreePunctuation`, `PrimitiveType`, `TokenKeywords`, `Self`, `Super`, `Crate`, `MutableSpecifier` as node types. Any other slot in the list is a slot that also reaches a keyword or enum through a supertype; list every one in the commit message. A slot that LOST members (a kind id that used to be admitted and is not any more) is a finding — stop and review.

- [ ] **Step 4: Byte gate and counts**

Run the byte-gate script into `$S/after/renders` and `diff -r $S/base/renders $S/after/renders`.
Expected: identical.

Run: `pnpm exec tsx packages/cli/src/cli.ts validate counts`
Expected: every number identical to Global Constraints. A moved number stops the task.

- [ ] **Step 5: Suites**

Run: `pnpm exec vitest run packages/codegen packages/tools packages/cli` — expected: 0 failed.
Run: `pnpm exec vitest run packages/rust packages/typescript packages/python` — expected: 0 failed beyond the 13 expected-fail cases.
Run: `rtk cargo test --workspace --exclude sittir-parity-tests` — expected: 112 passed.
Run: `pnpm run type-check && pnpm run type-check:examples && bash scripts/assert-scope-boundaries.sh` — expected: pass.

- [ ] **Step 6: Commit the generated output**

```bash
git commit -m "chore(generated): regenerate for enum and keyword arms seated through supertypes

Reclassified slots: <list from Step 3>" -- packages/rust/.sittir packages/rust/src packages/rust/tests/nodes.test.ts rust/crates/sittir-rust packages/typescript/.sittir packages/typescript/src packages/typescript/tests/nodes.test.ts rust/crates/sittir-typescript packages/python/.sittir packages/python/src packages/python/tests/nodes.test.ts rust/crates/sittir-python
```

(Only paths that changed are staged; `git status --short` before committing.)

---

### Task 4: `ir` exposes aliased pattern leaves by the model's fact

**Files:**
- Modify: `packages/codegen/src/emitters/ir.ts:243-253` (`isFlatLeafOrKeyword`)
- Modify: `packages/rust/tests/examples-verify.test.ts` (ir entry ratchet ceiling), and the typescript and python `examples-verify.test.ts` ratchets
- Test: `packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts` (create)
- Modify: `docs/glossary/emitters.md` (`isFlatLeafOrKeyword` entry)

**Interfaces:**
- Consumes: `AssembledNodeBase.userFacing` (assemble stamps it: a hidden kind is user-facing when it is an alias source or a variant child).
- Produces: `ir.stringLiteralOpen('"')`, `ir.fieldIdentifier('x')`, `ir.typeIdentifier('T')` and every other user-facing aliased pattern leaf on `ir`; enum leaves stay off `ir` (their values are kind ids).

- [ ] **Step 1: Write the failing test**

Create `packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts`:

```ts
import { CHOICE, PATTERN, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledEnum, AssembledPattern } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitIr } from '../ir.ts';

// A hidden pattern leaf that is an alias source (rust `_string_literal_open`,
// visible as `string_literal_open`) is user-facing; a hidden pattern that is
// nothing's alias (sittir's `_space`) is not; an enum of literals is a set
// of kind ids and gets no builder.
function makeNodeMap() {
	const nodes = new Map<string, AssembledNode>();
	const open = new AssembledPattern('_string_literal_open', { type: PATTERN, value: '[bc]?"' });
	open.userFacing = true;
	const space = new AssembledPattern('_space', { type: PATTERN, value: ' +' });
	space.userFacing = false;
	const punct = new AssembledEnum('_token_tree_punctuation', {
		type: CHOICE,
		members: [{ type: STRING, value: ',' }, { type: STRING, value: '+' }]
	});
	punct.userFacing = true;
	nodes.set('_string_literal_open', open);
	nodes.set('_space', space);
	nodes.set('_token_tree_punctuation', punct);
	return makeNodeMapWith(nodes);
}

describe('ir leaf exposure follows userFacing, not the name prefix', () => {
	it('exposes a user-facing aliased pattern leaf and hides a non-user-facing one', () => {
		const source = emitIr({ grammar: 'rust', nodeMap: makeNodeMap() });
		expect(source).toContain('stringLiteralOpen: F.');
		expect(source).not.toContain('space: F.');
	});
	it('gives an enum of literals no builder', () => {
		const source = emitIr({ grammar: 'rust', nodeMap: makeNodeMap() });
		expect(source).not.toContain('tokenTreePunctuation: F.');
	});
});
```

If `emitIr`'s exported name or config shape differs, read the top of `packages/codegen/src/emitters/ir.ts` and use the exported entry point that returns the module source (the ir emitter's `emit*` function taking `{ grammar, nodeMap, generatedIdTables? }`); the assertions stand.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts`
Expected: FAIL on `stringLiteralOpen: F.` (the `_` prefix drops it today).

- [ ] **Step 3: Implement**

In `packages/codegen/src/emitters/ir.ts` replace `isFlatLeafOrKeyword` with:

```ts
function isFlatLeafOrKeyword(
	kind: string,
	node: AssembledNode,
	kindEntries: ReturnType<typeof collectKindEntries> | undefined
): boolean {
	if (!node.userFacing || node.factoryInline) return false;
	if (!(node instanceof AssembledKeyword) && !(node instanceof AssembledPattern)) return false;
	if (!node.irKey || !node.rawFactoryName || !isValidIdent(node.irKey)) return false;
	return !kindEntries || hasCatalogEntry(kindEntries, kind);
}
```

and in the leaf loop (`irValueLines.push('  // Leaf node factories')`) change the class test to `if (!(node instanceof AssembledPattern)) continue;`. Remove `AssembledEnum` from the import if it is no longer referenced in the file.

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate and raise the ratchets deliberately**

Regenerate all three grammars (Task 3 Step 2). Then count the callable `ir` builders per grammar:

```bash
for g in rust typescript python; do pnpm exec tsx -e "import { ir } from '@sittir/$g'; console.log('$g', Object.keys(ir).filter(k => typeof (ir as any)[k] === 'function').length)"; done
```

In each package's `tests/examples-verify.test.ts` `ir entry ratchet` block, set `toBeLessThanOrEqual(<new count>)` and update the comment's numbers to the new totals; the commit message names the leaves that appeared (`stringLiteralOpen`, `fieldIdentifier`, `typeIdentifier`, …) and the ones that left (enum leaves such as `compoundAssignmentExprOperator`, which never had a node slot to feed).

- [ ] **Step 6: Gates**

Byte gate identical; `validate counts` identical; the six vitest suites, cargo, type-check, scope boundaries as in Task 3 Step 5.

- [ ] **Step 7: Glossary and commits**

Replace the `isFlatLeafOrKeyword` entry text in `docs/glossary/emitters.md` with:

```text
/** Does this keyword / pattern kind get a flat `ir.<irKey>` entry —
 *  user-facing (the assemble-time fact: visible, or hidden but an alias
 *  source or a variant child; sittir's own whitespace kinds are not), not
 *  inlined, with a factory, a legal identifier for a key and a catalog id?
 *  An enum of literals gets no entry: its values are kind ids, and a slot
 *  holding one takes `TSKindId.<Member>`. One predicate for the pre-pass
 *  that maps flat keys to their factory references and for the two
 *  emission loops. */
```

```bash
git commit --no-verify -m "feat(ir): expose aliased pattern leaves by the model's user-facing fact; enums of literals get no builder" -- packages/codegen/src/emitters/ir.ts packages/codegen/src/emitters/__tests__/ir-leaf-exposure.test.ts docs/glossary/emitters.md packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts
git commit -m "chore(generated): regenerate for the ir leaf exposure" -- packages/rust/.sittir packages/rust/src rust/crates/sittir-rust packages/typescript/.sittir packages/typescript/src rust/crates/sittir-typescript packages/python/.sittir packages/python/src rust/crates/sittir-python
```

---

### Task 5: The rust strict example spells its token trees strictly

**Files:**
- Modify: `examples/17-dogfood-rust-strict.ts` (`deriveStrict`, `writeCall`, the three `writeCall(...)` call sites, helper consts)

**Interfaces:**
- Consumes: Task 3 (`delimTokens` admits `TSKindId.Comma`), Task 4 (`ir.stringLiteralOpen`).
- Produces: a strict example with no coercing call.

- [ ] **Step 1: Add the token helpers and make both token-tree sites strict**

After the `scopedTy` const add:

```ts
const str = (text: string) =>
	ir.stringLiteral.strict({ stringOpen: ir.stringLiteralOpen('"'), elements: [ir.stringContent(text)] });
```

Replace the `arguments:` value in `deriveStrict` with:

```ts
				arguments: ir.delimTokenTree.paren.strict({
					delimTokens: [id('Debug'), TSKindId.Comma, id('Clone'), TSKindId.Comma, id('PartialEq'), TSKindId.Comma, id('Eq')],
				}),
```

Replace `writeCall` with:

```ts
function writeCall(format: string) {
	return ir.macroInvocation.strict({
		macro: id('write'),
		arguments: ir.delimTokenTree.paren.strict({ delimTokens: [id('f'), TSKindId.Comma, str(format)] }),
	});
}
```

and the three call sites with the source's own strings:

```ts
writeCall('invalid edit range: start={start}, end={end}')
writeCall('edit out of bounds: end={end} > source length={source_len}')
writeCall('edit range not at UTF-8 char boundary: start={start}, end={end}')
```

Add `TSKindId` to the `@sittir/rust` import.

- [ ] **Step 2: Type-check and render**

Run: `pnpm run type-check:examples` — expected: 0 errors.
Run the byte-gate script and read `rust-strict`: expected `#[derive(Debug,Clone,PartialEq,Eq)]` (tight by declared default) and `write!(f,"invalid edit range: start={start}, end={end}")`; the render re-parses clean (`pnpm exec vitest run packages/rust/tests/examples-verify.test.ts`).

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(examples): the rust strict dogfood spells its token trees strictly with kind-id punctuation and the source's format strings" -- examples/17-dogfood-rust-strict.ts
```

---

### Task 6: Spec status

- [ ] **Step 1:** In `docs/superpowers/specs/2026-09-07-strict-rebuild-from-source-design.md` change the status line to `> **Status:** Storage and exposure landed (2026-09-07); the emitter follows its own plan.` and commit:

```bash
git commit -m "docs(spec): record the storage and exposure slice as landed" -- docs/superpowers/specs/2026-09-07-strict-rebuild-from-source-design.md
```
