# Enum leaves are kind-id-stored — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `AssembledEnum` is kind-id-stored at the model, every consumer reads the stamp, and a token tree's comma is spelled `TSKindId.Comma` with no leaf factory.

**Architecture:** One stamp (`KindStorage = 'kindId'` on `AssembledEnum`), one per-value storage record carrying the member set, and four consumers that already branch on `isKindIdStored` (classifier, wrap projection, types/`fieldTypeComponents`, transport ids) extended to a member SET instead of a single id. Each task holds the byte gate and the counts.

**Tech Stack:** TypeScript (ESM), vitest, the codegen pipeline, `validate counts`.

**Spec:** `docs/superpowers/specs/2026-09-07-enum-leaf-kind-id-storage-design.md`

## Global Constraints

- Branch `feat/strict-rebuild-from-source` (stacked on #272). Committed there: `8e74754fd` (examples type-checked), `46e32ebfe` (the broad supertype walk — superseded by Task 2 below; do not revert, rewrite). Uncommitted at the time of writing: the narrowed walk in `shared.ts`, transitive enum-member ids in `render-module.ts::resolveAcceptedTransportIds` (keep), a glossary edit, and a stale regen of all three grammars (will be regenerated).
- Generated outputs are never hand-edited. Regenerate with `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`, all three, sequentially.
- No explanatory comments in `packages/codegen/src/`; glossary entries in `docs/glossary/emitters.md` / `docs/glossary/compiler-model.md` (or wherever `node-map.ts` entries live — check `docs/glossary/README.md`).
- No spec/plan/PR numbers in code or docs. Commit by pathspec; source before regen with `--no-verify`; generated separately.
- Gates per task: byte gate (six dogfood renders, baseline `$TMPDIR/…/scratchpad/enum-arms/base/renders` or re-capture at `8e74754fd`), `validate counts` all three identical to the floors in the spec, fixture counts (`rust 1486 render`, read from `gen` output), `pnpm exec vitest run packages/codegen packages/tools packages/cli packages/rust packages/typescript packages/python`, `rtk cargo test --workspace --exclude sittir-parity-tests`, `pnpm run type-check && pnpm run type-check:examples`, `bash scripts/assert-scope-boundaries.sh`. A moved number stops for review.
- Probe scripts from the previous attempt live in the session scratchpad (`enum-arms/probe*.mts`, `dogfood.ts`, `eval-dump.mts`); recreate from the plan text if the scratchpad is gone.

---

### Task 1: Diagnose the rust read-render-parse loss before changing anything — DONE

Cause recorded in the spec (Blast radius, "Transport arm precedence"): the `_type` supertype transport routes the primitive member ids to its `Identifier` variant (alias wire ids from `alias(choice(primitives), $.identifier)` in `_path`/`_pattern`/`_expression_except_range`), and those arms precede `PrimitiveType`'s. Repro: `sittir tool probe-kind -g rust -k parameter -s 'fn f(a: u8, b: T) {}'` → wrapped `_type: 28`, rendered `a:`. Fix lives in Task 4b.

---

### Task 2: The stamp — `AssembledEnum` is kind-id-stored; the value record carries the member set — DONE

**Files:**
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (`AssembledEnum.storage`, `ValueStorage`, `isKindIdStored`, `fixedTextOfKind`)
- Modify: `packages/codegen/src/emitters/shared.ts` (`classifyValueStorage`, `resolveHiddenKeywordLeaf`, `kindEnumAltIdPairs`, `enumArmsOf`, `classifyFieldStorageInfo`)
- Modify: `packages/codegen/src/emitters/transport-projection.ts::terminalTransportLiteralForKind`, `packages/codegen/src/emitters/factories.ts::kindEnumTextMapExpr`
- Test: `packages/codegen/src/emitters/__tests__/enum-leaf-kind-id-storage.test.ts` (create); update `field-storage-supertype-arms.test.ts`

**Interfaces:**
- Produces:

```ts
// node-map.ts
export type ValueStorage =
	| { readonly via: 'node'; readonly kind: string; readonly typeName: string; readonly missing?: true }
	| { readonly via: 'kindId'; readonly kind: string; readonly kindId?: number; readonly text?: string; readonly immediate?: boolean;
	    readonly members?: readonly { readonly kind: string; readonly kindId: number | undefined; readonly text: string }[] }
	| { readonly via: 'literal'; readonly text: string; readonly immediate?: boolean };
export function isKindIdStored(node: AssembledNode): node is AssembledKeyword | AssembledToken | AssembledEnum;
```

- [ ] **Step 1: Failing tests**

```ts
// enum-leaf-kind-id-storage.test.ts
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledEnum, AssembledPattern, AssembledSupertype, isKindIdStored } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { classifyValueStorage, fieldTypeComponents, resolveFieldStorageInfo } from '../shared.ts';

const kindEntries = [
	{ id: 1, kind: 'u8', symbolName: 'anon_sym_u8', anon: false },
	{ id: 2, kind: 'bool', symbolName: 'anon_sym_bool', anon: false }
];
function makeNodeMap() {
	const rule: SeqRule<'link'> = { type: SEQ, members: [{ type: FIELD, name: 'type', content: { type: SYMBOL, name: '_type' } }] };
	const typeRule: ChoiceRule = { type: CHOICE, members: [{ type: SYMBOL, name: 'identifier' }, { type: SYMBOL, name: '_primitive_type' }] };
	const nodes = new Map<string, AssembledNode>();
	nodes.set('field', new AssembledBranch('field', flatten(rule), flatten(rule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('_primitive_type', new AssembledEnum('_primitive_type', { type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] }, { kindEntries }));
	nodes.set('_type', new AssembledSupertype('_type', typeRule, [{ name: 'identifier' }, { name: '_primitive_type' }]));
	return makeNodeMapWith(nodes);
}
describe('an enum leaf is kind-id-stored', () => {
	it('the model stamps it', () => {
		expect(isKindIdStored(makeNodeMap().nodes.get('_primitive_type')!)).toBe(true);
	});
	it('a reference to it stamps the member set', () => {
		const nodeMap = makeNodeMap();
		const slot = nodeMap.nodes.get('field')!.slots[0]!;
		const enumRef = slot.values.find((v) => 'node' in v && v.node !== undefined && (v.node as { name?: string }).name === '_type');
		// through the supertype the slot's own value is the supertype; the per-member stamp is on the enum ref inside enumArmsOf.
		const info = resolveFieldStorageInfo(slot, nodeMap);
		expect(info.kind).toBe('mixedEnum');
		expect(info.enumKinds).toEqual(['u8', 'bool']);
		expect(enumRef).toBeDefined();
	});
	it('a direct enum reference yields via kindId with members', () => {
		const nodeMap = makeNodeMap();
		const storage = classifyValueStorage({ node: nodeMap.nodes.get('_primitive_type')!, multiplicity: 'single' } as never, nodeMap);
		expect(storage).toMatchObject({ via: 'kindId', kind: '_primitive_type', members: [{ kind: 'u8', kindId: 1, text: 'u8' }, { kind: 'bool', kindId: 2, text: 'bool' }] });
	});
	it('the type components list one literal per member', () => {
		const nodeMap = makeNodeMap();
		const slot = nodeMap.nodes.get('field')!.slots[0]!;
		const literals = fieldTypeComponents(slot, nodeMap).filter((c) => c.kind === 'literal').map((c) => c.value);
		expect(literals).toEqual(['u8', 'bool']);
	});
});
```

- [ ] **Step 2: Run, expect failure** (`isKindIdStored` false; `members` absent; components have no literals).

- [ ] **Step 3: Implement**

In `node-map.ts`: add `override get storage(): KindStorage { return 'kindId'; }` to `AssembledEnum`; widen `isKindIdStored`'s guard to include `AssembledEnum`; in `fixedTextOfKind` return `undefined` when the node is an `AssembledEnum`; extend the `kindId` arm of `ValueStorage` with the optional `members` field shown above.

In `shared.ts::classifyValueStorage`, before the `isKindIdStored(target)` branch:

```ts
	if (target instanceof AssembledEnum) {
		return {
			via: 'kindId',
			kind,
			members: [...target.resolvedByText].map(([text, entry]) => ({ kind: entry.kind, kindId: entry.id, text }))
		};
	}
```

In `shared.ts::enumArmsOf`: replace the `seatEnum`/`seatKeyword` pair with one `seat(value, node)` that reads `valueStorageOf(value, nodeMap)`: `via: 'kindId'` with `members` → push each member; `via: 'kindId'` with `text` → push `{ kind: storage.kind, kindId: storage.kindId, text }` (keep `keywordRefWireIdentity` for the id, as today); otherwise a node arm. Keep the aliased-into-another-kind exclusion for supertype subtypes. Delete the `AssembledEnum` branch from `classifyFieldStorageInfo` (it now reads `enumArmsOf` only — already the case after the previous task).

In `shared.ts::fieldTypeComponents`: when `storage.via === 'kindId' && storage.members`, push one `typeComponentOf({ via: 'kindId', kind: m.kind, kindId: m.kindId, text: m.text })` per member instead of one component. In `kindEnumAltIdPairs`, `resolveHiddenKeywordLeaf`, `transport-projection.ts::terminalTransportLiteralForKind`, `factories.ts::kindEnumTextMapExpr`: where `target.text` / `resolved.text` is read after `isKindIdStored`, skip `AssembledEnum` targets (they have no single text) — for `kindEnumTextMapExpr` emit one `[text, id]` row per `resolvedByText` entry instead.

- [ ] **Step 4: Run the new test and the codegen suite** — expected: PASS; any other failure is a consumer that read `.text` on an enum target; fix it the same way.

- [ ] **Step 5: Commit (source, `--no-verify`)** with the tests and the glossary entries for `AssembledEnum.storage`, `ValueStorage`, `classifyValueStorage`, `enumArmsOf`, `fieldTypeComponents`.

---

### Task 3: Types, factories, coercers, ir — no leaf surface for an enum — DONE (the model mints no `rawFactoryName`/`fromFunctionName` for an enum, so every factory-bearing site skips it; `emitEnumTest` and the enum branches of factories/from/ir deleted; `synonym.boolean` is legacy and simply disappears for rust)

**Files:**
- Modify: `packages/codegen/src/emitters/types.ts` (`emitLeafTerminalAliases` line ~566–575: the `storage === 'kindId'` branch must emit `enumMemberDiscriminant(node, kindEntries)` for an enum; `keywordNamespaceKinds` at ~263 gains enums, so their `Ns` namespaces are emitted like keywords' (`surface === undefined`)).
- Modify: `packages/codegen/src/emitters/shared.ts::classifyFactoryEmission` (return `'skip-kind-id-stored'`-style skip for `AssembledEnum`; find the existing skip vocabulary and reuse the value keywords use if one exists), `classifyFromEmission` follows.
- Modify: `packages/codegen/src/emitters/factories.ts::emitLeaf` / `dispatchNode` (`case 'enum'` no longer emits), `from.ts:198/888/1462` enum branches removed, `ir.ts` leaf loops (patterns and keywords only — already in the earlier plan's Task 4; fold it here).
- Test: extend `enum-leaf-kind-id-storage.test.ts` with an `emitTypes` assertion: `export type PrimitiveType = TSKindId.U8 | TSKindId.Bool;` and no `Terminal<` for it; an `emitFactories` assertion: no `buildPrimitiveType`.

- [ ] Steps: failing test → implement → `pnpm exec vitest run packages/codegen` → commit source.

---

### Task 4: Wrap projection reads an enum leaf node as its member id — NOT NEEDED (measured: rust read-render-parse 134/137 and fixtures 1486 with the existing `projectMixedEnumStorage`; the read data already carries the member id for aliased enum leaves)

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` (`projectMixedEnumStorage` template ~1367: add a `$text` branch guarded by `entry.$type` being one of the slot's enum OWN symbols; thread an `enumSymbolIds` argument from `kindEnumAltIdPairs`-style derivation — the enum's own catalog id per `enumArmsOf` member whose enum has `hasKindId`), and the wrap-emit tests in `packages/codegen/src/emitters/__tests__/wrap-*.test.ts`.
- Test: the emitted projection maps `{ $type: 352, $text: ',' }` → `TSKindId.Comma` and leaves `{ $type: Identifier, $text: 'type' }` unchanged.

- [ ] Steps: failing test → implement → suite → commit source.

---

### Task 4b: Supertype transport enums route kind-id-stored subtypes first — DONE

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (the supertype `buildKindIdArms` loop over `validSubtypes` at ~1520, and the per-slot `enumArmsFirst` sort at ~2048)
- Test: `packages/codegen/src/emitters/__tests__/transport-arm-precedence.test.ts` (create)

**Interfaces:**
- Produces: `function kindIdStoredFirst<T extends { node: AssembledNode }>(entries: readonly T[]): T[]` in `render-module.ts` — stable sort, `isKindIdStored(node)` entries first. Both builders call it; the per-slot `enumArmsFirst` sort is deleted.

- [ ] **Step 1: Failing test** — build a node map with a supertype `_t` over `identifier` (pattern) and `_prim` (enum u8|bool), with `terminalAliasWireIds` mapping `identifier` → `[1, 28, 2]` (u8 aliased onto identifier elsewhere); emit the render module (find the emitter entry the existing render-module tests use, e.g. `emitRenderModule`/`emitTransportEnums`) and assert the `_TTransport` number branch has `28 => Ok(Self::Prim(` and no `28 => Ok(Self::Identifier(`.
- [ ] **Step 2: Run, expect failure** (`28 => Ok(Self::Identifier(` present).
- [ ] **Step 3: Implement** `kindIdStoredFirst` and use it for `validSubtypes` in the supertype builder and in place of `enumArmsFirst`.
- [ ] **Step 4: Codegen suite green; commit source** with a glossary entry for `kindIdStoredFirst` and the updated `resolveAcceptedTransportIds`/supertype-enum prose.

---

### Task 5: Regenerate, census, gates

- [ ] Regenerate all three grammars; capture fixture counts from the `gen` output (rust 1486 render expected).
- [ ] Census: types diff — every `Terminal<` enum alias gone, every enum-bearing slot union lists member ids; list the kinds in the commit message.
- [ ] Byte gate identical; `validate counts` identical to the spec floors; suites; cargo; type-check; scope boundaries.
- [ ] If rust read-render-parse moves, the transport arm precedence (Task 4b) is the first suspect — fix at the emitter, never in generated output.
- [ ] Commit generated output; update the spec status.

---

### Task 6: The rust strict example spells its token trees with kind ids

Same as the earlier plan's Task 5: `TSKindId.Comma` in `delimTokens`, `ir.stringLiteralOpen('"')` (from the `userFacing` exposure in Task 3), the source's own `write!` strings; `pnpm run type-check:examples` at 0; byte gate shows `#[derive(Debug,Clone,PartialEq,Eq)]`; commit.
