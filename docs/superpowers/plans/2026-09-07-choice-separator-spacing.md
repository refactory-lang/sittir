# Choice Separator Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A separated list whose separator is a choice of literal tokens declares the token a built node uses, carries it as a kind-id option like every other preference, and gets the ordinary separator spacing sites, so typescript interface bodies (and, by retiring one skip-list entry on the way, enum bodies) lay out one member per line.

**Architecture:** The declared token is a site preference under the list's slot key (`preference('separator', 'semi')`), collected beside the delimiter default into the spacing-site table the resolver already walks (a declared preference rides `SPACING_SITES` the way `statement_terminator` does); the transport's existing `separator_kind` field is filled from that site, the factory stamps the declared default, and the render's fallback arm prints the default's text. `gapOf` then treats a choice-of-literals separator as a gap named by the list kind, so `spaceRenderRules` injects `<kind>_separator_space_before` / `_after` unchanged. On the enum side, `fieldSeparatedListElements` declines by shape when an element arm is already fielded, which lets `_enum_body_elements` leave the skip list and take the canonical list spelling.

**Tech Stack:** TypeScript codegen (`packages/codegen`), generated Rust render crates, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-07-choice-separator-spacing-design.md` (this plan fixes the declaration's label to `separator`, mirroring `delimiter`, and names the spacing labels by the list kind: `object_type_content_separator_space_after`. The spec is updated with this plan.) Enum retirement: `docs/superpowers/specs/2026-09-07-enrich-skip-list-retirement-design.md`, class B only.

## Global Constraints

- The six dogfood renders (`<scratchpad>/dogfood.ts`) are byte-identical to the baseline captured in Task 0: none of them holds an object type, an interface or an enum.
- `validate counts` identical to the Task 0 capture: rust 149/149 207/207 134/137 1517/1517; typescript 145/145 193/193 112/114 1202/1202; python 126/126 142/142 115/116 1390/1390.
- After Task 8 the typescript `generate()` run emits no `non-literal-separator` warning; rust and python were already silent.
- `pnpm run type-check`; `pnpm exec vitest run --root packages/codegen`, `--root packages/tools`, `--root packages/cli`; per-package `pnpm exec vitest run` in `packages/{rust,typescript,python}`; `rtk cargo test --workspace --exclude sittir-parity-tests`; `bash scripts/assert-scope-boundaries.sh`.
- Generated files (`packages/<g>/src/*`, `packages/<g>/.sittir/*`, `rust/crates/sittir-<g>/src/*`, `rust/crates/sittir-<g>/index.d.ts`, `rust/crates/sittir-<g>/test-fixtures.json`) are never hand-edited; regenerate.
- No comments in `packages/codegen/src/`; every added or changed declaration gets a `###` entry in `docs/glossary/<dir>.md` (Task 9).
- Regen protocol when `rust/crates/sittir-core` changes (it does not in this plan): none needed; the typescript grammar and codegen change, so regenerate all three grammars once (`gen --grammar <g> --all --output packages/<g>/src --skip-ts-chain`) and typescript again after Task 8.
- Commits by pathspec (`git commit -- <paths>`); a source-only commit before regeneration needs `--no-verify` for the manifest hook.
- A failed gate stops for review; never revert, stash or clean up a failing state.
- Test edits are gated by a hook: call `mcp__infigraph__generate_test_context` once per session before the first test edit.

---

### Task 0: Baseline

**Files:**
- Scratchpad only.

- [ ] **Step 1: Capture the dogfood renders at HEAD**

```bash
S=<scratchpad>; pnpm exec tsx $S/dogfood.ts $S/renders-baseline
```

Expected: six files, `rust.txt` 2412 bytes, `ts.txt` 479 bytes, `py.txt` 196 bytes (post brace-seam shape).

- [ ] **Step 2: Capture the typescript probe renders**

Write `<scratchpad>/otc-probe.mts`:

```ts
import { ir } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/typescript/src/index.ts';
import { TSKindId } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/typescript/src/types.ts';

const sig = (name: string) => ir.propertySignature({ name: ir.identifier(name), type: ir.typeAnnotation({ type: ir.predefinedType('string') }) });
const otc = ir.objectTypeContent as unknown as { strict: (...a: unknown[]) => { $render(): string; _separator?: number } };
console.log(JSON.stringify(otc.strict(sig('a'), sig('b')).$render()));
console.log(JSON.stringify(otc.strict({ separator: TSKindId.Semi }, sig('a'), sig('b')).$render()));
console.log(JSON.stringify(ir.enumBody({ enumBodyElements: [ir.propertyIdentifier('A'), ir.propertyIdentifier('B')] } as never).$render()));
```

Run: `pnpm exec tsx <scratchpad>/otc-probe.mts`. Expected today: `"a: string b: string"`, `"a: string b: string"` (the kind-id option is dropped), and an enum body on one line. If the enum line throws, note the message; Task 8 fixes the factory shape too.

- [ ] **Step 3: Record the warning count**

Run: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output <scratchpad>/gen-probe --skip-ts-chain 2>&1 | grep -c non-literal-separator`
Expected: `1`.

---

### Task 1: The `separator` label in the DSL and in `patches:`

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/spacing.ts` (beside `DELIMITER_LABEL`)
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`renderDefaultsOf`, the `patchSetsOf` loop)
- Test: `packages/codegen/src/dsl/__tests__/render-defaults.test.ts`

**Interfaces:**
- Produces: `SEPARATOR_LABEL = 'separator'`, `isSeparatorAddress(address: string): boolean`; a wired grammar with `object_type_content: [{ content: preference('separator', 'semi') }]` yields `defaults.sites.object_type_content.content_separator = { label: 'separator', arm: 'semi' }`.

- [ ] **Step 1: Write the failing test**

Append to the `seam defaults declared in patches` describe in `render-defaults.test.ts`:

```ts
	it('lifts a separator default under a list slot with its arm unchecked, beside the delimiter default', () => {
		const wired = wire({
			rules: { ...rules, list: () => str('l') },
			patches: {
				list: [{ content: preference('separator', 'semi') }, { content: preference('delimiter', 'Delimiter.Trailing') }]
			}
		} as never);
		expect(wired.__wireContext__?.defaults?.sites).toEqual({
			list: {
				content_separator: { label: 'separator', arm: 'semi' },
				content_delimiter: { label: 'delimiter', arm: 'Delimiter.Trailing' }
			}
		});
	});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/dsl/__tests__/render-defaults.test.ts -t "separator default"`
Expected: FAIL — `patches: list.content_separator defaults to 'semi', not one of tight, space, newline`.

- [ ] **Step 3: Implement**

`spacing.ts`, after `isDelimiterAddress`:

```ts
export const SEPARATOR_LABEL = 'separator';

export function isSeparatorAddress(address: string): boolean {
	return address.endsWith(`_${SEPARATOR_LABEL}`);
}
```

`wire.ts`: import `SEPARATOR_LABEL` from `'../primitives/spacing.ts'` beside `DELIMITER_LABEL`; in `renderDefaultsOf`'s `patchSetsOf` loop replace the `checked` expression:

```ts
				const checked =
					label === DELIMITER_LABEL
						? checkDelimiterArm(`${key}.${address}`, arm)
						: label === SEPARATOR_LABEL
							? arm
							: seam !== undefined
								? checkWhitespaceArm(`${key}.${address}`, arm)
								: checkSpacingArm(`${key}.${address}`, arm);
```

The arm is a token kind name the wire has no catalog to check; Task 2 checks it against the list's separator arms.

- [ ] **Step 4: Run the test and the file**

Run: `pnpm exec vitest run --root packages/codegen src/dsl/__tests__/render-defaults.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "feat(wire): a separator default under a list slot, preference('separator', <kind>)" -- packages/codegen/src/dsl/primitives/spacing.ts packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/dsl/__tests__/render-defaults.test.ts
```

---

### Task 2: Separator sites in the site-preference model

**Files:**
- Modify: `packages/codegen/src/compiler/model/site-preferences.ts` (`PreferenceSource`, `collectSitePreferences`)
- Modify: `packages/codegen/src/compiler/model/render-rules.ts` (`validateRenderDefaults`)
- Modify: `packages/codegen/src/emitters/options.ts` (`deriveOptionsShape`)
- Create: `packages/codegen/src/compiler/model/__tests__/site-preferences-separator.test.ts`

**Interfaces:**
- Consumes: `SEPARATOR_LABEL`, `isSeparatorAddress` (Task 1); `AssembledList.separatorRule: RenderRule | undefined`; `tokenKind(text, kindEntries)` (module-private in site-preferences.ts).
- Produces: a `SitePreference` with `source: 'separator'`, `slot: 'content'`, `address: 'content_separator'`, `label: 'separator'`, `arms: [{ value: 'comma', kind: 'comma' }, { value: 'semi', kind: 'semi' }]`, `defaultArm: 'semi'` for every `AssembledList` whose `separatorRule` is defined. Build errors: a list with a choice separator and no declared default; a declared arm not among the choice's kinds; a declared `<slot>_separator` naming no such list.

- [ ] **Step 1: Write the failing test**

```ts
import { CHOICE, PATTERN, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledList, AssembledPattern, type AssembledNode, type SeparatedListElementRule } from '../node-map.ts';
import type { RenderRule, SimplifiedRule } from '../../../types/rule.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { collectSitePreferences } from '../site-preferences.ts';

const SIMPLIFIED: SimplifiedRule = { type: SYMBOL, name: 'member' };
const RENDER: RenderRule = { type: SYMBOL, name: 'member' };
const SEP: RenderRule = { type: CHOICE, members: [{ type: STRING, value: ',' }, { type: STRING, value: ';' }] };
const kindEntries = [
	{ kind: 'member_list', member: 'MemberList', id: 1 },
	{ kind: 'member', member: 'Member', id: 2 },
	{ kind: 'comma', member: 'Comma', id: 3, symbolName: ',', anon: true },
	{ kind: 'semi', member: 'Semi', id: 4, symbolName: ';', anon: true }
];

function listNodeMap(separatorRule: RenderRule | undefined) {
	const rule: SeparatedListElementRule = { type: SYMBOL, name: 'member', multiplicity: 'nonEmptyArray', separator: { value: separatorRule ?? { type: STRING, value: ',' }, trailing: 'optional' } };
	const nodes = new Map<string, AssembledNode>();
	nodes.set('member_list', new AssembledList('member_list', rule, undefined, { separatorRule, simplifiedRule: SIMPLIFIED, renderRule: RENDER }));
	nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('collectSitePreferences — separator sites', () => {
	it('a list with a choice separator is a site whose arms are the literal kinds and whose default is the declared one', () => {
		const sites = collectSitePreferences({
			nodeMap: listNodeMap(SEP),
			kindEntries,
			defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'semi' } } } }
		});
		const site = sites.find((s) => s.source === 'separator')!;
		expect(site).toEqual({ kind: 'member_list', slot: 'member', address: 'member_separator', label: 'separator', arms: [{ value: 'comma', kind: 'comma' }, { value: 'semi', kind: 'semi' }], defaultArm: 'semi', source: 'separator' });
	});

	it('an undeclared choice separator, a foreign arm, and a declaration naming no list are build errors', () => {
		expect(() => collectSitePreferences({ nodeMap: listNodeMap(SEP), kindEntries })).toThrow(/member_list\.member chooses its separator per instance \(comma, semi\); declare preference\('separator', <kind>\)/);
		expect(() => collectSitePreferences({ nodeMap: listNodeMap(SEP), kindEntries, defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'colon' } } } } })).toThrow(/member_list\.member_separator is 'colon', not one of comma, semi/);
		expect(() => collectSitePreferences({ nodeMap: listNodeMap(undefined), kindEntries, defaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'comma' } } } } })).toThrow(/member_list\.member_separator names no list with a choice separator/);
	});
});
```

The slot in this fixture is `member` (the fixture's canonical single-field name), so the address is `member_separator`; in the shipped grammar it is `content_separator`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/model/__tests__/site-preferences-separator.test.ts`
Expected: FAIL — no site with `source: 'separator'`.

- [ ] **Step 3: Implement**

`site-preferences.ts`:

```ts
export type PreferenceSource = 'declared' | 'spacing' | 'delimiter' | 'separator';
```

Import `SEPARATOR_LABEL, isSeparatorAddress` from `'../../dsl/primitives/spacing.ts'`. Add, after the delimiter loop in `collectSitePreferences` (before `return out`):

```ts
	const declaredSeparators = new Map<string, string>();
	for (const [kind, sites] of Object.entries(config.defaults?.sites ?? {})) {
		for (const [address, site] of Object.entries(sites)) {
			if (isSeparatorAddress(address)) declaredSeparators.set(`${publicKindName(kind)} ${address}`, site.arm);
		}
	}
	const consumedSeparators = new Set<string>();
	for (const [kind, node] of config.nodeMap.nodes) {
		if (!(node instanceof AssembledList) || node.separatorRule === undefined) continue;
		const slot = node.slots[0]?.name;
		if (slot === undefined) continue;
		const arms = separatorArmKinds(kind, node.separatorRule, config.kindEntries);
		const address = `${slot}_${SEPARATOR_LABEL}`;
		const key = `${publicKindName(kind)} ${address}`;
		const arm = declaredSeparators.get(key);
		if (arm === undefined) {
			throw new Error(`defaults: ${publicKindName(kind)}.${slot} chooses its separator per instance (${arms.join(', ')}); declare preference('separator', <kind>) under the slot`);
		}
		if (!arms.includes(arm)) throw new Error(`defaults: ${key.replace(' ', '.')} is '${arm}', not one of ${arms.join(', ')}`);
		consumedSeparators.add(key);
		out.push({ kind, slot, address, label: SEPARATOR_LABEL, arms: arms.map((value) => ({ value, kind: value })), defaultArm: arm, source: 'separator' });
	}
	for (const key of declaredSeparators.keys()) {
		if (!consumedSeparators.has(key)) throw new Error(`defaults: ${key.replace(' ', '.')} names no list with a choice separator`);
	}
```

and the helper beside `tokenKind`:

```ts
function separatorArmKinds(kind: string, rule: RenderRule, kindEntries: readonly KindEntryLike[]): string[] {
	const r = rule as { type: string; value?: string; members?: RenderRule[] };
	if (r.type === STRING && typeof r.value === 'string') {
		const name = tokenKind(r.value, kindEntries);
		if (name === undefined) throw new Error(`defaults: separator token '${r.value}' of ${publicKindName(kind)} has no kind in the catalog`);
		return [name];
	}
	if (r.type === CHOICE && r.members !== undefined) return r.members.flatMap((m) => separatorArmKinds(kind, m, kindEntries));
	throw new Error(`defaults: ${publicKindName(kind)} has a separator of shape ${r.type}; only a literal or a choice of literals is supported`);
}
```

Import `CHOICE, STRING` from `'../../types/rule-types.ts'` with the `// @rule-type-consts` marker, and `RenderRule` from `'../../types/rule.ts'`.

`render-rules.ts`, `validateRenderDefaults`: `if (isDelimiterAddress(address) || isSeparatorAddress(address)) continue;` (import `isSeparatorAddress`).

`options.ts`, `deriveOptionsShape`: `if (site.source !== 'delimiter' && site.source !== 'separator') {` — a separator site is a per-kind key only, like the delimiter.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/model src/emitters/__tests__/emitter-options.test.ts`
Expected: PASS. If `render-module-emit.test.ts` or `emitter-options.test.ts` fixtures build a list with a choice separator and no default, they now throw the "chooses its separator per instance" error: give those fixtures `defaults: { labels: {}, sites: { <kind>: { <slot>_separator: { label: 'separator', arm: '<first arm kind>' } } } }`.

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "feat(model): a choice separator is a site preference with a declared default" -- packages/codegen/src/compiler/model/site-preferences.ts packages/codegen/src/compiler/model/render-rules.ts packages/codegen/src/emitters/options.ts packages/codegen/src/compiler/model/__tests__/site-preferences-separator.test.ts
```

---

### Task 3: The gap of a choice separator, named by the list kind

**Files:**
- Modify: `packages/codegen/src/compiler/model/render-rules.ts` (`gapOf`, `collectGaps`)
- Test: `packages/codegen/src/compiler/model/__tests__/render-rules.test.ts`

**Interfaces:**
- Produces: a list kind `object_type_content` with separator `choice(',', ';')` gets spacing sites `object_type_content.content object_type_content_separator_space_before` and `_after` (addresses `content_separator_space_before` / `_after`).

- [ ] **Step 1: Write the failing test**

In the `spaceRenderRules` describe of `render-rules.test.ts`:

```ts
	it('spaces a choice-of-literals separator like a literal one, naming the gap by the list kind', () => {
		const sep = { type: CHOICE, members: [str(','), str(';')] } as unknown as RenderRule;
		const list = sym('member', { id: 'r9', multiplicity: 'nonEmptyArray', fieldName: 'content', separator: { value: sep } });
		const config = { nodeMap: nodeMapOf({ object_type_content: list }, { r9: 'content' }), kindEntries };
		const out = spaceRenderRules(config);
		expect(spacingSitesOf(out, config.nodeMap).map((s) => `${s.address}:${s.label}`)).toEqual([
			'content_separator_space_before:object_type_content_separator_space_before',
			'content_separator_space_after:object_type_content_separator_space_after'
		]);
		expect(spacedSeparatorOf(out.rules.object_type_content!)?.token).toBe(sep);
	});
```

(`sym`'s options bag in this file spreads extra properties onto the rule; if it does not, build the rule as an object literal `{ type: SYMBOL, name: 'member', id: 'r9', multiplicity: 'nonEmptyArray', fieldName: 'content', separator: { value: sep } } as unknown as RenderRule`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/model/__tests__/render-rules.test.ts -t "choice-of-literals"`
Expected: FAIL — no sites.

- [ ] **Step 3: Implement**

`gapOf` takes the kind:

```ts
function gapOf(kind: string, rule: RenderRule, kindEntries: readonly KindEntryLike[]): { readonly token?: string } | undefined {
	const sep = bag(rule).separator;
	if (sep === undefined) return {};
	const value = bag(sep.value);
	if (value.type === CHOICE && value.members !== undefined && value.members.every((m) => bag(m).type === STRING)) {
		return { token: publicKindName(kind) };
	}
	if (value.type !== STRING || typeof value.value !== 'string' || value.value === '') return undefined;
	const entry = findEntryForLiteralText(kindEntries, value.value);
	if (entry === undefined) throw new Error(`separator token '${value.value}' has no kind in the catalog`);
	return { token: publicKindName(entry.kind) };
}
```

and in `collectGaps`: `const gap = gapOf(kind, r, config.kindEntries);`.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/model`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "feat(render-rules): a choice-of-literals separator gets its spacing sites, named by the list kind" -- packages/codegen/src/compiler/model/render-rules.ts packages/codegen/src/compiler/model/__tests__/render-rules.test.ts
```

---

### Task 4: The separator site in the options table, the fill and the render fallback

**Files:**
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`SpacingSite`, `planRenderOptions`)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`fillOptionsStructImpl`, the list-view branch of `buildTypedTemplateBody`, `buildSeparatorKindMatchLines`)
- Test: `packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`, `packages/codegen/src/emitters/__tests__/render-module-separated-list.test.ts`

**Interfaces:**
- Consumes: `SitePreference` with `source: 'separator'` (Task 2).
- Produces: a `SpacingSite` row `("object_type_content", "content_separator", "separator", 20, &[14, 20])` with `constName: 'SITE_OBJECT_TYPE_CONTENT_CONTENT_SEPARATOR'`, `fieldIdent: 'separator_kind'`, `wireKey: '_separator'`, `role: 'separator'`, no `side`, and the label NOT registered in `LABELS`; generated `fill_options` line `self.separator_kind.get_or_insert(table.spacing[options::SITE_OBJECT_TYPE_CONTENT_CONTENT_SEPARATOR]);`; render `token: match node.separator_kind { Some(14) => ",", Some(20) => ";", _ => ";" }`.

- [ ] **Step 1: Write the failing tests**

`render-options-rs.test.ts`, in the `planRenderOptions` describe:

```ts
	it('a separator site rides the spacing table under its kind, fills separator_kind, and registers no label', () => {
		const entries = [...kindEntries, { kind: 'comma', member: 'Comma', id: 14, symbolName: ',', anon: true }];
		const site: SitePreference = { kind: 'object_type_content', slot: 'content', address: 'content_separator', label: 'separator', arms: [{ value: 'comma', kind: 'comma' }, { value: 'semi', kind: 'semi' }], defaultArm: 'semi', source: 'separator' };
		const plan = planRenderOptions([...sites, site], entries, supertypes, whitespaceText);
		const row = plan.spacingSites.find((s) => s.role === 'separator')!;
		expect([row.constName, row.fieldIdent, row.wireKey, row.defaultId, row.allowedIds, row.side]).toEqual(['SITE_OBJECT_TYPE_CONTENT_CONTENT_SEPARATOR', 'separator_kind', '_separator', 20, [14, 20], undefined]);
		expect(plan.labels.map((l) => l.label)).not.toContain('separator');
		expect(renderOptionsRs(plan)).toContain('("object_type_content", "content_separator", "separator", 20, &[14, 20]),');
	});
```

`render-module-separated-list.test.ts`, beside the nonterminal-separator render test (the one asserting `separator: match node.separator_kind` lines): add an assertion set on an emission whose `renderDefaults` declares the default. The fixture's emit helper takes a nodeMap and id tables; pass `renderDefaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'semi' } } } }` through the same inputs object `emitRenderModule` reads `renderDefaults` from (`RenderOptionsInputs.renderDefaults`), then:

```ts
		expect(emitted).toContain('self.separator_kind.get_or_insert(table.spacing[options::SITE_MEMBER_LIST_MEMBER_SEPARATOR]);');
		expect(emitted).toContain('_ => ";",');
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/render-options-rs.test.ts src/emitters/__tests__/render-module-separated-list.test.ts`
Expected: FAIL — no row with `role`, no fill line, fallback `""`.

- [ ] **Step 3: Implement**

`render-options-rs.ts`: `SpacingSite` gains `readonly role?: 'separator';`. In `planRenderOptions`, before the generic push (after the delimiter branch):

```ts
		if (site.source === 'separator') {
			spacing.push({
				kind,
				slot: site.slot,
				address: site.address,
				label: site.label,
				constName: `SITE_${screaming(kind)}_${screaming(site.address)}`,
				fieldIdent: 'separator_kind',
				wireKey: '_separator',
				defaultId: idOf(kindEntries, site.defaultArm, at),
				allowedIds: site.arms.map((arm) => idOf(kindEntries, arm.kind ?? arm.value, at)),
				role: 'separator'
			});
			continue;
		}
```

`render-module.ts`: a lookup beside `delimiterSiteOf`:

```ts
function separatorSiteOf(plan: RenderPlan, node: AssembledNode): SpacingSite | undefined {
	const kind = publicKindName(node.kind);
	return plan.spacingSites.find((site) => site.kind === kind && site.role === 'separator');
}
```

`synthesizedSpacingSites` already excludes it (no `side`). In `fillOptionsStructImpl`, after the delimiter line:

```ts
		const sep = node instanceof AssembledList ? separatorSiteOf(plan, node) : undefined;
		if (sep !== undefined) body.push(`        self.separator_kind.get_or_insert(table.spacing[options::${sep.constName}]);`);
```

In the list-view branch of `buildTypedTemplateBody`, the fallback passed to `buildSeparatorKindMatchLines` becomes the declared default's text when the plan has a separator site for the node: the text is the catalog entry's `symbolName` for the site's `defaultId`. `buildTypedTemplateBody` receives `kindIdByKind` (name → id); build the reverse once where `kindIdByKind` is constructed in `emitRenderModule` (a `Map<number, string>` of id → `symbolName ?? kind` from the same `kindEntries`), thread it as `kindTextById: ReadonlyMap<number, string> | undefined` next to `kindIdByKind` through `renderTypedFn` → `buildTypedTemplateBody`, and compute:

```ts
			const separatorSite = node === undefined ? undefined : separatorSiteOf(plan, node);
			const fallback = separatorSite === undefined ? fieldSepLiteral : JSON.stringify(kindTextById?.get(separatorSite.defaultId) ?? '');
			const separatorMatchLines =
				separatedList?.separatorRule !== undefined
					? buildSeparatorKindMatchLines(separatedList.separatorRule, fallback, kindIdByKind)
					: undefined;
```

- [ ] **Step 4: Run the emitter suites**

Run: `pnpm exec vitest run --root packages/codegen src/emitters`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "feat(options): the declared separator fills separator_kind and is the render fallback" -- packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts packages/codegen/src/emitters/__tests__/render-module-separated-list.test.ts
```

---

### Task 5: The factory option is a kind id and the default is stamped

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (`separatedListSurface`, `emitSeparatedListFactory`, new `declaredSeparatorDefault`)
- Modify: `packages/codegen/src/emitters/from.ts` (`buildOptionsPreservingCall`)
- Modify: `packages/tools/src/validate/common.ts` (`separatedListFactoryOptions`), `packages/tools/src/exercise/roundtrip.ts` (its `CommonModule` type)
- Test: `packages/codegen/src/emitters/__tests__/factories-separated-list.test.ts`, `packages/codegen/src/emitters/__tests__/from-separated-list.test.ts`, `packages/tools/src/validate/__tests__/*` (whichever pins `separatedListFactoryOptions`)

**Interfaces:**
- Produces: generated `separator?: TSKindId.Comma | TSKindId.Semi` in the options bag and `$with.separator(v: TSKindId.Comma | TSKindId.Semi)`; `const _separator = options.separator ?? TSKindId.Semi;`; `separatedListFactoryOptions` returns `{ separator?: number; delimiter?: number }`.

- [ ] **Step 1: Update the failing tests**

`factories-separated-list.test.ts`, the `nonterminal separator with both flanks optional` test: the stance "an OMITTED separator stays undefined — a defaulted stamp would fabricate a token the node never carried" predates declared defaults; the delimiter already stamps its declared default and the render fills the separator from the same table, so a built node carries the grammar's token. Replace those assertions:

```ts
		expect(emitted).toContain('separator?: TSKindId.Comma | TSKindId.Semi');
		expect(emitted).toContain('const _separator = options.separator ?? TSKindId.Semi;');
		expect(emitted).toContain('separator: (v: TSKindId.Comma | TSKindId.Semi) =>');
		expect(emitted).not.toContain('Record<string, number>');
```

and give that test's `emit` call render defaults: `emitFactories({ grammar: 'test', nodeMap, kindEntries: KIND_ENTRIES, renderDefaults: { labels: {}, sites: { member_list: { member_separator: { label: 'separator', arm: 'semi' } } } } })` (the helper forwards `renderDefaults`; check `__tests__/helpers/emit-factories.ts` and add the pass-through if it lacks one).

`from-separated-list.test.ts`: where the test expects the `separator: (() => { const sk = ...KIND_LITERAL_TEXT.get(sk) ...` preserving call, expect instead `separator: (data as unknown as { _separator?: number; _delimiter?: T.Delimiter })._separator`.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/factories-separated-list.test.ts src/emitters/__tests__/from-separated-list.test.ts`
Expected: FAIL on the new assertions.

- [ ] **Step 3: Implement**

`factories.ts`, `separatedListSurface`: replace `separatorKindUnion` with a kind-id union:

```ts
	const separatorKindUnion =
		candidateKindNames.length > 0 ? candidateKindNames.map((k) => kindDiscriminantExpr(k, nodeMap, kindEntries)).join(' | ') : 'never';
```

(`candidateKindNames` are the literal texts; `kindDiscriminantExpr` resolves a literal text through `findKindEntry`, as the existing arms table already relies on.) Add beside `declaredDelimiterDefault`:

```ts
function declaredSeparatorDefault(node: AssembledList, nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined, renderDefaults: RenderDefaults | undefined): string {
	const slot = node.slots[0]?.name;
	const declared = slot === undefined ? undefined : renderDefaults?.sites[publicKindName(node.kind)]?.[`${slot}_${SEPARATOR_LABEL}`]?.arm;
	if (declared === undefined) throw new Error(`factories: ${node.kind} chooses its separator per instance and declares no default`);
	return kindDiscriminantExpr(declared, nodeMap, kindEntries);
}
```

In `emitSeparatedListFactory`, replace the `if (hasSeparatorKindOption) { if (candidateKindNames.length > 0) { ... Record<string, number> ... } else { ... } }` block with:

```ts
	if (hasSeparatorKindOption) {
		lines.push(`  const _separator = options.separator ?? ${declaredSeparatorDefault(node, nodeMap, kindEntries, renderDefaults)};`);
	}
```

Import `SEPARATOR_LABEL` beside `DELIMITER_LABEL`.

`from.ts`, `buildOptionsPreservingCall`: replace the `separator:` IIFE with `separator: ${sourceFields}._separator`, and drop `KIND_LITERAL_TEXT` from this site (keep the constant if another emission still uses it; otherwise remove its emission too — search `KIND_LITERAL_TEXT` in `from.ts`).

`tools/validate/common.ts`:

```ts
export function separatedListFactoryOptions(data: unknown): { separator?: number; delimiter?: number } | undefined {
	const rec = (data ?? {}) as Record<string, unknown>;
	const delimiter = typeof rec['_delimiter'] === 'number' ? rec['_delimiter'] : undefined;
	const separator = typeof rec['_separator'] === 'number' ? rec['_separator'] : undefined;
	const options: { separator?: number; delimiter?: number } = {};
	if (separator !== undefined) options.separator = separator;
	if (delimiter !== undefined) options.delimiter = delimiter;
	return Object.keys(options).length > 0 ? options : undefined;
}
```

Update its four callers (`validate/from.ts:438,465`, `validate/common.ts:1737,2921,2929`) to drop the `kindLiteralText` argument, and `exercise/roundtrip.ts`'s `CommonModule.separatedListFactoryOptions` type to the new signature. If `kindLiteralText` has no remaining consumer in those files, remove its plumbing.

- [ ] **Step 4: Run the suites**

Run: `pnpm exec vitest run --root packages/codegen && pnpm exec vitest run --root packages/tools && pnpm exec tsc --noEmit -p packages/tools/tsconfig.json`
Expected: PASS, type-check clean.

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "feat(factories): a separated list's separator option is a kind id, stamped from the declared default" -- packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/from.ts packages/tools/src packages/codegen/src/emitters/__tests__/factories-separated-list.test.ts packages/codegen/src/emitters/__tests__/from-separated-list.test.ts
```

---

### Task 6: The shape is supported, so the warning goes

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (`liftSeparators`, the `non-literal-separator` block)
- Test: `packages/codegen/src/compiler/__tests__/link.test.ts` (`liftSeparators emits a warning for a non-literal separator` describe), `packages/codegen/src/compiler/__tests__/generate.test.ts` (both `non-literal-separator` tests)

- [ ] **Step 1: Update the tests**

`link.test.ts`: rename the describe to `liftSeparators lifts a choice-of-literals separator without a diagnostic` and change the assertion to `expect(diagnostics.all()).toHaveLength(0);` while keeping the check that the lifted rule's `separator.value` is the choice.

`generate.test.ts`: delete the `formatCompilerDiagnostics renders the non-literal-separator warning` test, and change the count table to `['rust', 0], ['python', 0], ['typescript', 0]` with the title `generate() emits no non-literal-separator warning for any grammar`.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/compiler/__tests__/link.test.ts -t "choice-of-literals"`
Expected: FAIL — one warning emitted.

- [ ] **Step 3: Implement**

In `liftSeparators`, delete the `if (sep.separator.type !== STRING) { ... ctx.diagnostics.emit(diagnostic); }` block; keep the lift. A separator that is neither a literal nor a choice of literals still fails at `separatorArmKinds` (Task 2) with a build error naming the kind.

- [ ] **Step 4: Run the compiler suites**

Run: `pnpm exec vitest run --root packages/codegen src/compiler`
Expected: PASS (the generate test regenerates into `/tmp`; it takes up to 90 s).

- [ ] **Step 5: Commit**

```bash
git commit --no-verify -m "chore(link): a choice-of-literals separator is supported; retire the non-literal-separator warning" -- packages/codegen/src/compiler/link.ts packages/codegen/src/compiler/__tests__/link.test.ts packages/codegen/src/compiler/__tests__/generate.test.ts
```

---

### Task 7: Typescript declares the object type's separator and layout; regenerate; gate

**Files:**
- Modify: `packages/typescript/grammar.sittir.ts` (`patches:`)
- Regenerate: all three grammars
- Modify: `packages/typescript/tests/options.test.ts` (compile-time check)

- [ ] **Step 1: Declare the defaults**

In the typescript `patches:` block, beside the other spacing labels:

```ts
				object_type_content_separator_space_after: preference('object_type_content_separator_space_after', 'newline'),
```

and, as new kind entries (no `object_type_content` or `object_type` patch entry exists today; add them next to `switch_body`):

```ts
				object_type: {
					opening_after: preference('block_body_before', 'indent'),
					closing_before: preference('block_body_after', 'dedent')
				},
				object_type_content: [
					{ content: preference('separator', 'semi') },
					{ content: preference('delimiter', 'Delimiter.Trailing') }
				],
```

`opening` and `closing` are literal slots (`choice('{', '{|')`), so their seams are slot seams `opening_after` / `closing_before`, already sites on `object_type`.

- [ ] **Step 2: Regenerate**

```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src --skip-ts-chain; done
```

Expected: rust and python regenerate with identical render output (no choice separator; the `_separator`-less factories change only where the `separatedListFactoryOptions` signature is consumed); typescript's `options.rs` gains the `("object_type_content", "content_separator", "separator", …)` row, `transport.rs` the fill line and `_ => ";"`.

- [ ] **Step 3: Probe**

Run: `pnpm exec tsx <scratchpad>/otc-probe.mts`
Expected: first line `"a: string;\n    b: string;"` (the leading indent belongs to the enclosing object type; a bare list rendered alone drops its edge whitespace), second line the same, and `ir.objectType.curly({ members: otc.strict(sig('a'), sig('b')) }).$render()` (add it to the probe) gives:

```
{
    a: string;
    b: string;
}
```

Also parse-and-render `type T = { a: string, b: string }` through `createEngine().parse(src).$render()`: byte-identical to the source (a parsed node keeps its comma and its text).

- [ ] **Step 4: Compile-time check**

`packages/typescript/tests/options.test.ts`: add to `ok` `object_type_content: { content_separator: TSKindId.Semi, content_delimiter: Delimiter.Trailing }` and `object_type_content_separator_space_after: TSKindId.Newline`; to `bad` a `// @ts-expect-error a separator is one of its literal kinds` line `object_type_content: { content_separator: TSKindId.Colon }`. Then `cd packages/typescript && pnpm exec vitest run -u tests/options.test.ts`.

- [ ] **Step 5: Gates**

```bash
S=<scratchpad>; pnpm exec tsx $S/dogfood.ts $S/renders-after; for f in rust rust-strict ts ts-strict py py-strict; do cmp $S/renders-baseline/$f.txt $S/renders-after/$f.txt && echo "$f identical"; done
pnpm exec tsx packages/cli/src/cli.ts validate counts
pnpm run type-check
pnpm exec vitest run --root packages/codegen; pnpm exec vitest run --root packages/tools; pnpm exec vitest run --root packages/cli
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run); done
(cd rust && rtk cargo test --workspace --exclude sittir-parity-tests)
bash scripts/assert-scope-boundaries.sh
```

Expected: six `identical`; counts as in Global Constraints; all green. A typescript `read-render-parse` or `factory-render-parse` count that moves is a finding: `object_type` is in both corpora, so a parsed interface must re-render byte-identically (its `_separator` is captured) and a factory-built one must re-parse (the `;` plus trailing delimiter is valid).

- [ ] **Step 6: Commit generated output and the grammar**

```bash
git commit -m "feat(grammars): typescript object types declare a semicolon separator and indent from their braces" -- packages/typescript/grammar.sittir.ts packages/rust/src packages/typescript/src packages/python/src packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir rust/crates/sittir-rust/src rust/crates/sittir-typescript/src rust/crates/sittir-python/src rust/crates/sittir-rust/index.d.ts rust/crates/sittir-typescript/index.d.ts rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json packages/rust/tests packages/typescript/tests packages/python/tests
```

---

### Task 8: The enum body leaves the skip list

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (`fieldSeparatedListElements`)
- Modify: `packages/typescript/grammar.sittir.ts` (`enrich(...)`'s `skip`, its comment, `patches:`)
- Test: `packages/codegen/src/dsl/__tests__/enrich*.test.ts` (the file that covers `fieldSeparatedListElements`; find it with `mcp__infigraph__search` for `fieldSeparatedListElements`)
- Regenerate: typescript

**Interfaces:**
- Produces: `fieldSeparatedListElements` returns `null` when the (peeled) element is a `CHOICE` any of whose members is a `FIELD`; `_enum_body_elements` keeps its flat list spelling and gets `content_separator_space_before` / `_after` sites.

- [ ] **Step 1: Write the failing test**

In the enrich test file that exercises `fieldSeparatedListElements` (via `enrich()` on a small grammar), add:

```ts
	it('leaves a separated list alone when an element arm already carries a field, but still flattens it', () => {
		const base = {
			rules: {
				_elems: () => seq(choice(field('name', sym('_name')), sym('assignment')), repeat(seq(str(','), choice(field('name', sym('_name')), sym('assignment')))), optional(str(','))),
				_name: () => str('x'),
				assignment: () => str('y')
			}
		};
		const out = enrich(base as never) as unknown as { rules: Record<string, () => unknown> };
		const body = JSON.stringify(out.rules._elems());
		expect(body).not.toContain('"element"');
		expect(body).toContain('"name"');
	});
```

Use the file's existing rule-builder helpers (`seq`, `choice`, `field`, `sym`, `str`, `repeat`, `optional`) or its equivalent literal-object spelling.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/dsl -t "element arm already carries a field"`
Expected: FAIL — an `element` field is minted over the choice.

- [ ] **Step 3: Implement**

In `fieldSeparatedListElements`, after `if (!sameElementShape(leading, innerElement)) continue;`:

```ts
		if (hasFieldedArm(leading)) continue;
```

with, beside `sameElementShape`:

```ts
function hasFieldedArm(rule: Rule): boolean {
	const cursor = peelTransparentElementWrappers(rule);
	const members = (cursor as unknown as { members?: Rule[] }).members;
	return isChoiceType((cursor as { type: string }).type) && Array.isArray(members) && members.some((m) => isFieldType((m as { type: string }).type));
}
```

Then in `packages/typescript/grammar.sittir.ts` remove `'_enum_body_elements'` from `skip` and the comment paragraph about it, and add to `patches:`:

```ts
				enum_body: {
					lbrace_after: preference('block_body_before', 'indent'),
					rbrace_before: preference('block_body_after', 'dedent')
				},
				enum_body_elements: [
					{ content: preference('comma_separator_space_after', 'newline') },
					{ content: preference('delimiter', 'Delimiter.Trailing') }
				],
```

(`enum_body` has no patch entry today; if the regen reports `enum_body_elements` addresses its slot by another name, read the slot name from `packages/typescript/.sittir/render-bodies.json`'s `_enum_body_elements` body and use it.)

- [ ] **Step 4: Regenerate typescript and gate**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src --skip-ts-chain
```

Then the Task 7 Step 5 gate list. Expected: `_enum_body_elements` now renders with `before`/`after` seam locals and `element_start`/`element_end`-style flanks absent (its braces belong to `enum_body`); `packages/typescript/.sittir/src/grammar.json` `_enum_body_elements` unchanged in parser shape (the flat spelling is a DSL-side normalisation; confirm the parser's `grammar.json` rule is structurally the same as before the change, since the grammar executes twice). Counts identical; the dogfood byte gate identical; the probe's enum line renders

```
{
    A,
    B,
}
```

A moved count or a changed `grammar.json` shape stops the task for review.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(enrich): the element mint declines an arm that is already fielded; typescript enum bodies leave the skip list and indent" -- packages/codegen/src/dsl/enrich.ts packages/codegen/src/dsl/__tests__ packages/typescript/grammar.sittir.ts packages/typescript/src packages/typescript/.sittir rust/crates/sittir-typescript/src rust/crates/sittir-typescript/index.d.ts rust/crates/sittir-typescript/test-fixtures.json packages/typescript/tests
```

---

### Task 9: Glossary, spec status, memory, PR

**Files:**
- Modify: `docs/glossary/dsl-primitives.md` (`SEPARATOR_LABEL`, `isSeparatorAddress`), `docs/glossary/dsl-wire.md` (`renderDefaultsOf`), `docs/glossary/compiler-model.md` (`collectSitePreferences`, `separatorArmKinds`, `PreferenceSource`, `gapOf`, `validateRenderDefaults`), `docs/glossary/emitters.md` (`SpacingSite.role`, `planRenderOptions`, `separatorSiteOf`, `fillOptionsStructImpl`, `buildSeparatorKindMatchLines`, `declaredSeparatorDefault`, `separatedListSurface`, `renderOptionsModule`), `docs/glossary/dsl.md` (`fieldSeparatedListElements`, `hasFieldedArm`), `docs/glossary/validate.md` (`separatedListFactoryOptions`)
- Modify: `docs/superpowers/specs/2026-09-07-choice-separator-spacing-design.md` (Status: Realized; the declaration spelling), `docs/superpowers/specs/2026-09-07-enrich-skip-list-retirement-design.md` (class B: done for `_enum_body_elements`)
- Modify: `packages/typescript/grammar.sittir.ts` skip comment already trimmed in Task 8

- [ ] **Step 1: Glossary entries** — one `###` per qualified name above, describing the live constraint: the separator default is required for a choice separator; arms are the choice's literal kinds; the site rides the spacing table under its kind with field `separator_kind`; no top-level label; the render fallback is the default's text; the mint declines a fielded arm.

- [ ] **Step 2: Spec status and PR body** — mark the separator spec Realized, note in the skip-list spec that class B landed for `_enum_body_elements`, and append a section to the PR #271 body with the interface and enum renders and the gate numbers.

- [ ] **Step 3: Commit and push**

```bash
git commit -m "docs: choice separator spacing glossary entries; specs record the landed slice" -- docs/glossary docs/superpowers/specs
git push origin feat/punctuation-seams
```
