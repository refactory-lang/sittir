# Alias Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close #314, #289, #290, #291 and #214 on the identity model the repo already has: storage kind is the grammar symbol, the alias target is a display name, and no layer invents a node the parser never issues.

**Architecture:** Evaluate stops synthesizing a hidden `_<target>` rule for inline alias content and distributes the alias over the arms instead; link builds one `displayUnions` map from the aliased refs and every consumer of a display name reads it. `publicKindName` is split into a display-name accessor and a storage-identifier accessor. Two `patches:` additions (`rule()`, a promoting `alias()`) close the authoring gaps. One preflight diagnostic guards aliases over sequences and repeats. The validator compares grammar types.

**Tech Stack:** TypeScript codegen (`packages/codegen/src`), vitest, tree-sitter CLI regen of three grammars, `pnpm run validate:native`, web-tree-sitter (`grammarType`/`grammarId`) in `packages/tools`.

**Spec:** `docs/superpowers/specs/2026-09-21-alias-identity-design.md`

## Global Constraints

- DRY: one storage identity per node (`grammar_id()`), one display identity (the alias target from the alias mapping); nothing derives either by string manipulation.
- Generated outputs are never hand-edited. After any edit under `packages/codegen/src/**`, regenerate all three grammars and commit the manifests:
  `for g in typescript rust python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done`
- Gate for every task that touches codegen: `pnpm run validate:native` read-render-parse and AST-match rows equal the baselines in rust, typescript and python; `cargo check --workspace` green; api-surface snapshots change only where the task says.
- `pnpm run type-check` and `pnpm run lint` clean before every push; run vitest as its own shell call after a regen.
- Comments live in `docs/glossary/<dir>.md`, never in `packages/codegen/src/`. Glossary entries never cite issue, PR, spec or task numbers.
- Commit with explicit pathspecs (`git commit -- <paths>`); never `git add -A`; never `--no-verify`; never `--delete-branch`.
- Ratchets only tighten: the phantom-kind count and the `desugarDivergences` baseline may only shrink; a count above its ceiling is a stop.
- The older `aliasedTo`/`aliasedToId` ref form is out of scope; read whichever form a ref carries through one accessor (Task 1 defines it).

---

## File map

| file | responsibility after this plan |
| --- | --- |
| `packages/codegen/src/compiler/evaluate.ts` | `rewriteInlineAliases` distributes an alias over a choice; synthesizes `_<target>` only for a single non-symbol, non-literal, non-choice content that is not a sequence or repeat |
| `packages/codegen/src/compiler/link.ts` | builds `displayUnions`; `foldAliasLiteralsIntoEnumRules` reads the distributed literal arms; `collectAliasedHiddenKinds` retired once no consumer reads it |
| `packages/codegen/src/compiler/types.ts` | `LinkedGrammar.displayUnions: ReadonlyMap<string, ReadonlySet<string>>` carried to `NodeMap.displayUnions` |
| `packages/codegen/src/compiler/model/display-name.ts` (new) | `displayNameOf(ref)`, `storageIdentifier(kind)`; replaces `render-rules.ts::publicKindName` |
| `packages/codegen/src/emitters/types.ts`, `is.ts` emitter, `wrap.ts` | emit one union type per display union; no `_<target>` twin |
| `packages/codegen/src/dsl/primitives/rule.ts` (new) | `rule(name, body)` placeholder |
| `packages/codegen/src/dsl/transform/transform.ts` | `resolvePatch` handles `rule()`; `resolveAliasPlaceholder` sets `named: true`; `registerAliasedVariant` stamps `hoisted` only on compound bodies |
| `packages/codegen/src/compiler/diagnostics/alias-distributed.ts` (new) | the `alias-distributed` preflight diagnostic |
| `packages/tools/src/validate/read-render-parse.ts` | `astStructuralDiff` compares `grammarType`; tolerances deleted |
| `packages/{rust,python}/grammar.sittir.ts` | overrides retired through the new primitives |

---

### Task 1: Distribute an inline alias over its arms; build `displayUnions`

> **Amended 2026-09-22** (spec §A). Task 1 landed at a4aa98dcc with a
> follow-up (fe8366532) that flips `rule.hidden` for aliased targets; the
> follow-up is reverted by this amendment. The remaining Task 1 work is:
>
> 1. `link.ts::unhideAliasedTargets` is deleted (spec §A.1). `hidden` is
>    `isParserHiddenName(name)` and no phase changes it. Keep the
>    `SYMBOL + aliasedTo` shape matching it introduced, but in
>    `collectDisplayUnions`, where both ref forms must be read.
> 2. `evaluate.ts::choiceArmsThrough` no longer looks through a hidden
>    single-use rule; evaluate distributes over inline content only
>    (spec §A.3). Move the look-through to `collectDisplayUnions`: an
>    aliased `SYMBOL` whose rule is hidden and has no entry in
>    `kindEntries` (the same miss `kindid-unstamped-symbols` reports) is
>    expanded, recursively, to the arms the parser issues; one with a
>    kind entry (`_lhs_expression`) is a member as itself.
> 3. `assemble.ts` turns every `displayUnions` entry into an
>    AssembledEnvelope whose `content` slot is the storage node: the
>    storage struct for a nonterminal, the AssembledEnum of the storage
>    kinds (or the leaf, or their union) for terminals (spec §A.2). The
>    envelope gets the ordinary struct, wrap, transport, factory and
>    render template; the template writes the content.
>    `read_node.rs::stamped_kind` stamps `kind_id()` for an aliased node
>    and places the `grammar_id()` node in `content`.
> 3b. `dsl/enrich.ts::applyUnaliasDistinct` is generalized: a bucket with
>    a nonterminal or own-rule member is split into unique
>    (storage, display) pairs (visible storage drops the alias; hidden
>    storage mints the underscore-less name); a terminals-only bucket is
>    left as the envelope's enum. The all-alias-site skip added in Task 1
>    is narrowed to that terminals-only case.
> 4. Gate for the task is now: rust 135/137, python 115/116 unchanged and
>    typescript read-render-parse back to 112/114 with the three
>    `pair.key` fixtures passing; `_reserved_identifier` absent from the
>    node map; no `Rule.hidden` differing from its name; no display name is also a
>    storage kind after enrich.
> 5. The explanatory comment added to `dsl/enrich.ts::applyUnaliasDistinct`
>    moves to `docs/glossary/dsl.md`.

**Files:**
- Modify: `packages/codegen/src/compiler/evaluate.ts:458-507` (`rewriteInlineAliases`)
- Modify: `packages/codegen/src/compiler/link.ts:132-292` (`link`), `:662-706` (`foldAliasLiteralsIntoEnumRules`)
- Modify: `packages/codegen/src/compiler/types.ts` (`LinkedGrammar`, `NormalizedGrammar`, `NodeMap`: add `displayUnions`)
- Modify: `packages/codegen/src/compiler/normalize.ts:263,327` (carry `displayUnions` like `aliasedHiddenKinds`)
- Modify: `packages/codegen/src/compiler/assemble.ts:311` (carry `displayUnions`)
- Test: `packages/codegen/src/compiler/__tests__/evaluate-inline-alias.test.ts` (new), `packages/codegen/src/compiler/__tests__/link-display-unions.test.ts` (new)

**Interfaces:**
- Consumes: `innermostNamedAliasContent(content)` (evaluate.ts), `SymbolRule` with `aliasedTo?: string` or `aliasedFrom?: string` (both forms exist).
- Produces: `aliasTargetOf(ref: SymbolRule): string | undefined` in `packages/codegen/src/types/rule.ts` (reads `aliasedTo`, else `undefined`; a ref in the `aliasedFrom` form has its target as `name`, so the accessor returns `ref.name` when `ref.aliasedFrom !== undefined`). `LinkedGrammar.displayUnions: ReadonlyMap<string, ReadonlySet<string>>` mapping display name to the set of storage kind names (rule names or literal texts) that display under it.

- [ ] **Step 1: Write the failing evaluate test**

```ts
// packages/codegen/src/compiler/__tests__/evaluate-inline-alias.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateGrammar } from '../evaluate.ts'; // the entry the other evaluate tests use

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const alias = (content: unknown, value: string) => ({ type: 'ALIAS', named: true, value, content });

describe('inline alias content is distributed over its arms', () => {
	it('an alias over a choice becomes a choice of aliased arms and mints no hidden rule', () => {
		const g = evaluateGrammar({
			name: 'demo',
			rules: {
				source: { type: 'SEQ', members: [alias({ type: 'CHOICE', members: [sym('identifier'), S('type')] }, 'property_identifier')] },
				identifier: { type: 'PATTERN', value: '[a-z]+' }
			}
		});
		const member = (g.rules.source as { members: unknown[] }).members[0] as { type: string; members: { type: string; value: string; content: unknown }[] };
		expect(member.type).toBe('CHOICE');
		expect(member.members.map((m) => m.type)).toEqual(['ALIAS', 'ALIAS']);
		expect(member.members.every((m) => m.value === 'property_identifier')).toBe(true);
		expect(g.rules._property_identifier).toBeUndefined();
	});

	it('an alias over a hidden rule whose body is a choice distributes through the rule when the alias is its only use', () => {
		const g = evaluateGrammar({
			name: 'demo',
			rules: {
				source: { type: 'SEQ', members: [alias({ type: 'CHOICE', members: [sym('identifier'), sym('_reserved')] }, 'property_identifier')] },
				_reserved: { type: 'CHOICE', members: [S('type'), S('public')] },
				identifier: { type: 'PATTERN', value: '[a-z]+' }
			}
		});
		const member = (g.rules.source as { members: unknown[] }).members[0] as { members: { content: { type: string; value?: string; name?: string } }[] };
		expect(member.members.map((m) => m.content.name ?? m.content.value)).toEqual(['identifier', 'type', 'public']);
	});

	it('an alias over a single symbol or literal is unchanged', () => {
		const g = evaluateGrammar({ name: 'demo', rules: { source: alias(sym('x'), 'y'), x: S('x') } });
		expect(g.rules.source).toMatchObject({ type: 'ALIAS', value: 'y', content: { type: 'SYMBOL', name: 'x' } });
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/__tests__/evaluate-inline-alias.test.ts`
Expected: FAIL, `g.rules._property_identifier` is defined and the member is an `ALIAS` over a `CHOICE`.

- [ ] **Step 3: Implement distribution in `rewriteInlineAliases`**

Replace the `case ALIAS` branch:

```ts
case ALIAS: {
	if (rule.named && rule.value) {
		const inner = innermostNamedAliasContent(rule.content);
		const arms = choiceArmsThrough(inner, rules, usesOf);
		if (arms !== undefined) {
			return {
				type: CHOICE,
				members: arms.map((arm) => ({ ...rule, content: recurse(arm) }))
			} as Rule<'evaluate'>;
		}
		const isBareSymbolToKnownSource =
			inner.type === SYMBOL && (rules[inner.name] !== undefined || externals.has(inner.name));
		const targetAlreadyExists = rules[rule.value] !== undefined;
		if (!targetAlreadyExists && !isBareSymbolToKnownSource && inner.type !== STRING && inner.type !== PATTERN) {
			const syntheticHiddenName = `_${rule.value}`;
			if (!rules[syntheticHiddenName]) {
				rules[syntheticHiddenName] = recurse(rule.content);
				provenanceByKind.set(syntheticHiddenName, 'evaluate-synthesized');
				ctx.desugarDivergences.push({ site: 'inline-alias-source', name: syntheticHiddenName });
			}
			return { ...rule, content: { type: SYMBOL, name: syntheticHiddenName } };
		}
	}
	return { ...rule, content: recurse(rule.content) };
}
```

Add beside it:

```ts
/** The arms an alias distributes over: the members of an inline CHOICE, or of a
 *  hidden rule whose body is a CHOICE and whose only reference is this alias;
 *  nested choices flatten. Undefined when the content is not a choice. */
function choiceArmsThrough(
	content: Rule<'evaluate'>,
	rules: Record<string, Rule<'evaluate'>>,
	usesOf: ReadonlyMap<string, number>
): readonly Rule<'evaluate'>[] | undefined {
	if (content.type === CHOICE) return content.members.flatMap((m) => choiceArmsThrough(m, rules, usesOf) ?? [m]);
	if (content.type === SYMBOL && content.name.startsWith('_') && usesOf.get(content.name) === 1) {
		const body = rules[content.name];
		if (body?.type === CHOICE) return choiceArmsThrough(body, rules, usesOf);
	}
	return undefined;
}
```

`usesOf` is a `Map<string, number>` of symbol-reference counts over all rule bodies, computed once in `synthesizeInlineAliasSources` before the loop (a walk over every rule counting `SYMBOL` names) and passed to `rewriteInlineAliases` as a fourth parameter. A hidden rule distributed through this way keeps its own rules entry; link's existing dead-rule handling drops it when nothing references it.

- [ ] **Step 4: Run the evaluate test**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/__tests__/evaluate-inline-alias.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing link test for `displayUnions`**

```ts
// packages/codegen/src/compiler/__tests__/link-display-unions.test.ts
import { describe, it, expect } from 'vitest';
import { link } from '../link.ts';
import { rawGrammarFrom } from './helpers/raw-grammar.ts'; // the helper the other link tests use

describe('link builds one display union per alias target', () => {
	it('collects every storage kind that displays under a name', () => {
		const linked = link(
			rawGrammarFrom({
				source: { type: 'SEQ', members: [
					{ type: 'CHOICE', members: [
						{ type: 'ALIAS', named: true, value: 'property_identifier', content: { type: 'SYMBOL', name: 'identifier' } },
						{ type: 'ALIAS', named: true, value: 'property_identifier', content: { type: 'STRING', value: 'type' } }
					] }
				] },
				identifier: { type: 'PATTERN', value: '[a-z]+' }
			})
		);
		expect([...linked.displayUnions.get('property_identifier')!].sort()).toEqual(['identifier', 'type']);
	});

	it('a rule that is also an alias target is a member of its own union', () => {
		const linked = link(
			rawGrammarFrom({
				generic_type: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'identifier' }] },
				generic_type_with_turbofish: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'identifier' }, { type: 'STRING', value: '::' }] },
				use: { type: 'ALIAS', named: true, value: 'generic_type', content: { type: 'SYMBOL', name: 'generic_type_with_turbofish' } },
				identifier: { type: 'PATTERN', value: '[a-z]+' }
			})
		);
		expect([...linked.displayUnions.get('generic_type')!].sort()).toEqual(['generic_type', 'generic_type_with_turbofish']);
	});
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/__tests__/link-display-unions.test.ts`
Expected: FAIL, `displayUnions` is undefined on `LinkedGrammar`.

- [ ] **Step 7: Build `displayUnions` in link**

In `packages/codegen/src/types/rule.ts`:

```ts
export function aliasTargetOf(ref: SymbolRule<PhaseName>): string | undefined {
	if (ref.aliasedFrom !== undefined) return ref.name;
	return ref.aliasedTo;
}
export function storageNameOf(ref: SymbolRule<PhaseName>): string {
	return ref.aliasedFrom ?? ref.name;
}
```

In `link.ts`, after `canonicalizeCatalogLiteralRefs` (all refs stamped, literal refs carry `.literal`):

```ts
function collectDisplayUnions(rules: Record<string, Rule<'link'>>): ReadonlyMap<string, ReadonlySet<string>> {
	const unions = new Map<string, Set<string>>();
	const add = (display: string, storage: string): void => {
		const set = unions.get(display) ?? new Set<string>();
		set.add(storage);
		unions.set(display, set);
	};
	const visit = (rule: Rule<'link'>): void => {
		if (rule.type === SYMBOL) {
			const display = aliasTargetOf(rule);
			if (display !== undefined) add(display, rule.literal ?? storageNameOf(rule));
			return;
		}
		if ('members' in rule) rule.members.forEach(visit);
		else if ('content' in rule && rule.content !== undefined) visit(rule.content);
	};
	for (const rule of Object.values(rules)) visit(rule);
	for (const display of unions.keys()) if (rules[display] !== undefined) add(display, display);
	return unions;
}
```

Store it on the returned `LinkedGrammar` as `displayUnions`; add the field to `LinkedGrammar`, `NormalizedGrammar` and `NodeMap` in `compiler/types.ts` and carry it through `normalize.ts:263,327` and `assemble.ts:311` exactly where `aliasedHiddenKinds` is carried today.

`foldAliasLiteralsIntoEnumRules` (link.ts:662-706) keeps its job: the distributed literal arms are the "alias-of-terminal occurrence" shape it already recognises (`ALIAS(STRING)` kept by `resolveRule`), so no change beyond confirming its test still passes.

- [ ] **Step 8: Run the link test and the compiler suite**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler`
Expected: PASS; the tests that asserted `_property_identifier`-style synthesized rules (search `evaluate-synthesized` and `inline-alias-source` in `src/compiler/__tests__`) are updated to the distributed shape, never preserved by weakening.

- [ ] **Step 9: Regenerate, gate, inspect the twin removal**

Run the regen loop from Global Constraints, then `pnpm run validate:native`, then `pnpm run type-check`, then `pnpm exec vitest run` as its own call.
Expected: native rows equal the baselines; `packages/typescript/src/node-model.json5` no longer lists `_property_identifier`, `_statement_identifier`, `_shorthand_property_identifier`, `_shorthand_property_identifier_pattern`, `_import_identifier`, `_identifier` or `_module_export_name` under `supertypes`; the api-surface snapshots lose `wrap_PropertyIdentifier`-style entries and `_PropertyIdentifier` types and nothing else; `desugarDivergences` no longer records `inline-alias-source` entries, so the phantom-kind baseline is lowered to the new count (ratchet tightens). Any other snapshot movement is a stop: keep the tree, report.

The display union type (`export type PropertyIdentifier = Identifier | ReservedIdentifier;`) must still be emitted. Find its emitter by searching `emitters/types.ts` for the code path that emitted it from the synthesized supertype, and point it at `nodeMap.displayUnions` so the union's members are the storage kinds' type names (a literal member is the keyword's kind type, e.g. `TypeKeyword`). `is.<display>()` in the `is` emitter narrows to the same union.

- [ ] **Step 10: Commit**

```bash
git add -- packages/codegen/src/compiler/evaluate.ts packages/codegen/src/compiler/link.ts packages/codegen/src/compiler/types.ts packages/codegen/src/compiler/normalize.ts packages/codegen/src/compiler/assemble.ts packages/codegen/src/types/rule.ts packages/codegen/src/emitters/types.ts packages/codegen/src/emitters/is.ts packages/codegen/src/compiler/__tests__/evaluate-inline-alias.test.ts packages/codegen/src/compiler/__tests__/link-display-unions.test.ts packages/*/src packages/*/.sittir rust/crates/sittir-*/src rust/crates/sittir-*/index.d.ts packages/*/tests/__snapshots__ packages/tools/validation-history.jsonl
git commit -m "feat(compiler): an inline alias distributes over its arms; link builds one display union per target"
```

---

### Task 2: Split `publicKindName` into a display-name accessor and a storage identifier

**Files:**
- Create: `packages/codegen/src/compiler/model/display-name.ts`
- Modify: `packages/codegen/src/compiler/model/render-rules.ts:116-118` (delete `publicKindName`) and every reference: `render-rules.ts`, `site-preferences.ts`, `site-addresses.ts`, `supertype-members.ts`, `whitespace-arms.ts`, `emitters/render-module.ts`, `emitters/render-options-rs.ts`, `emitters/options.ts`, `emitters/shared.ts` (85 references; `find_all_references` on `render-rules.ts::publicKindName` lists them)
- Test: `packages/codegen/src/compiler/model/__tests__/display-name.test.ts` (new)

**Interfaces:**
- Consumes: `aliasTargetOf(ref)` and `storageNameOf(ref)` from Task 1; `NodeMap.displayUnions`.
- Produces:
  - `displayNameOf(kind: string, nodeMap: NodeMap): string` — the kind's display name: `kind` when the grammar has a rule of that name that is visible, else the unique display union that contains `kind` when there is exactly one, else `kind`. A kind that displays under two names at different sites has no single display name; the function throws naming the kind and the names, so a caller that needs a per-site name passes the ref instead.
  - `displayNameOfRef(ref: SymbolRule<'link'>): string` — `aliasTargetOf(ref) ?? storageNameOf(ref)`.
  - `storageIdentifier(kind: string): string` — the kind's own name, hidden prefix kept, through the existing identifier casing (`_as_pattern` → `_AsPattern`). Reuses the casing helper the transport already uses for hidden struct names.

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/compiler/model/__tests__/display-name.test.ts
import { describe, it, expect } from 'vitest';
import { displayNameOf, storageIdentifier } from '../display-name.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';

describe('display names come from the alias mapping, never from a strip', () => {
	it('a hidden kind aliased to a non-matching name displays under that name', () => {
		const nodeMap = makeNodeMapWith(new Map(), { displayUnions: new Map([['case_as_pattern', new Set(['_as_pattern'])]]) });
		expect(displayNameOf('_as_pattern', nodeMap)).toBe('case_as_pattern');
	});
	it('a kind that is its own rule displays as itself even when it is also an alias target', () => {
		const nodeMap = makeNodeMapWith(new Map(), { displayUnions: new Map([['generic_type', new Set(['generic_type', 'generic_type_with_turbofish'])]]) });
		expect(displayNameOf('generic_type', nodeMap)).toBe('generic_type');
	});
	it('a kind with two display names has no single one', () => {
		const nodeMap = makeNodeMapWith(new Map(), { displayUnions: new Map([['a', new Set(['_x'])], ['b', new Set(['_x'])]]) });
		expect(() => displayNameOf('_x', nodeMap)).toThrow(/'_x' displays as a, b/);
	});
	it('a storage identifier keeps the hidden prefix', () => {
		expect(storageIdentifier('_as_pattern')).toBe('_AsPattern');
		expect(storageIdentifier('as_pattern')).toBe('AsPattern');
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/model/__tests__/display-name.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the module**

```ts
// packages/codegen/src/compiler/model/display-name.ts
import type { NodeMap } from '../types.ts';
import type { SymbolRule } from '../../types/rule.ts';
import { aliasTargetOf, storageNameOf } from '../../types/rule.ts';
import { toPascalCase } from '../../emitters/naming.ts'; // the casing helper transport struct names use

export function displayNameOf(kind: string, nodeMap: NodeMap): string {
	const node = nodeMap.nodes.get(kind);
	if (node !== undefined && !kind.startsWith('_')) return kind;
	const names = [...nodeMap.displayUnions].filter(([, members]) => members.has(kind)).map(([name]) => name);
	if (names.length === 1) return names[0]!;
	if (names.length > 1) throw new Error(`display name: '${kind}' displays as ${names.join(', ')}; resolve it per reference`);
	return kind;
}

export function displayNameOfRef(ref: SymbolRule<'link'>): string {
	return aliasTargetOf(ref) ?? storageNameOf(ref);
}

export function storageIdentifier(kind: string): string {
	return kind.startsWith('_') ? `_${toPascalCase(kind.slice(1))}` : toPascalCase(kind);
}
```

If the casing helper lives under another name, use that name; do not add a second casing function.

- [ ] **Step 4: Run the test**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/model/__tests__/display-name.test.ts`
Expected: PASS

- [ ] **Step 5: Replace every `publicKindName` reference**

For each of the 85 references, decide which question the site asks and substitute:

| the site needs | replace with |
| --- | --- |
| a name to match `options:` keys, `bindings.scm`, node-types, or an options address (`site-preferences.ts`, `site-addresses.ts`, `options.ts`, `render-options-rs.ts` address labels) | `displayNameOf(kind, nodeMap)` or `displayNameOfRef(ref)` when a ref is in hand |
| a key for a spacing site, a struct or enum name, a wrap function name, or a map keyed by kind (`render-rules.ts` `spacingSitesOf`/`seatedSites`/`ownsKindEdges`, `render-module.ts` seat and seam sites, `supertype-members.ts`) | the raw `kind`, and `storageIdentifier(kind)` where an identifier is spelled |

Record the decision per file in the commit message body as a two-column list. Then delete `publicKindName`.

- [ ] **Step 6: Regenerate and gate**

Run the regen loop, `pnpm run validate:native`, `pnpm run type-check`, `cargo check --workspace`, then vitest.
Expected: generated output byte-identical apart from `generated.manifest.json` and the bundled `grammar.js` (every live alias today strips to its own display name, so the split changes nothing yet). Any generated diff is a real divergence: stop, keep the tree, report the site.

- [ ] **Step 7: Commit**

```bash
git add -- packages/codegen/src/compiler/model/display-name.ts packages/codegen/src/compiler/model/__tests__/display-name.test.ts packages/codegen/src/compiler/model/render-rules.ts packages/codegen/src/compiler/model/site-preferences.ts packages/codegen/src/compiler/model/site-addresses.ts packages/codegen/src/compiler/model/supertype-members.ts packages/codegen/src/compiler/model/whitespace-arms.ts packages/codegen/src/emitters/render-module.ts packages/codegen/src/emitters/render-options-rs.ts packages/codegen/src/emitters/options.ts packages/codegen/src/emitters/shared.ts packages/*/.sittir/generated.manifest.json packages/*/.sittir/grammar.js
git commit -m "refactor(compiler,emitters): display names read the alias mapping; storage identifiers keep the hidden prefix"
```

---

### Task 3: `rule(name, body)` placeholder

**Files:**
- Create: `packages/codegen/src/dsl/primitives/rule.ts`
- Modify: `packages/codegen/src/dsl/transform/transform.ts:77-95` (`PatchValue`, the placeholder guard list), `:594-647` (`resolvePatch`)
- Modify: `packages/codegen/src/grammar-shapes/path-type.ts:101-106` (`TransformPatchValue`)
- Modify: `packages/codegen/src/dsl/index.ts` (export `rule`)
- Test: `packages/codegen/src/dsl/__tests__/rule-placeholder.test.ts` (new)

**Interfaces:**
- Consumes: `wireRegisterSyntheticRule(name, content): boolean` (wire.ts:67), `symbolRef(name)`, `wireGetCurrentRuleKind()`, `rulesEqual` is link-phase; transform compares with `canonical()` from `dsl/transform/token-forms.ts` (JSON with `id`/`metadata` dropped) since both bodies are runtime rules.
- Produces: `rule(name: string, body: ($: DollarProxy) => RuntimeRule): RulePlaceholder`; `isRulePlaceholder(v)`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/dsl/__tests__/rule-placeholder.test.ts
import { describe, it, expect } from 'vitest';
import { rule } from '../primitives/rule.ts';
import { applyTransformForTest } from './_test-helpers.ts'; // the helper transform tests use to run patches inside a wire context

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });

describe('rule() declares a real rule at a path', () => {
	it('replaces the content with a symbol and deposits the authored body without a hoisted annotation', () => {
		const original = { type: 'SEQ', members: [sym('for_in_clause'), { type: 'REPEAT', content: sym('if_clause') }] };
		const { result, deposits } = applyTransformForTest('list_comprehension', { type: 'SEQ', members: [S('['), original] }, {
			1: rule('comprehension_clauses', ($: any) => ({ type: 'REPEAT1', content: { type: 'CHOICE', members: [$.for_in_clause, $.if_clause] } }))
		});
		expect((result as any).members[1]).toEqual(sym('comprehension_clauses'));
		const body = deposits.get('comprehension_clauses') as any;
		expect(body.type).toBe('REPEAT1');
		expect(body.annotations?.hoisted).toBeUndefined();
	});

	it('the same name at two paths must carry equal bodies', () => {
		const body = ($: any) => ({ type: 'REPEAT1', content: $.if_clause });
		const other = ($: any) => ({ type: 'REPEAT1', content: $.for_in_clause });
		expect(() =>
			applyTransformForTest('demo', { type: 'SEQ', members: [sym('a'), sym('b')] }, { 0: rule('x', body), 1: rule('x', other) })
		).toThrow(/rule\('x'\): bodies differ at demo\/0 and demo\/1/);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/dsl/__tests__/rule-placeholder.test.ts`
Expected: FAIL, `../primitives/rule.ts` not found.

- [ ] **Step 3: Add the primitive, the type members and the resolver branch**

```ts
// packages/codegen/src/dsl/primitives/rule.ts
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

export interface RulePlaceholder {
	readonly __sittirPlaceholder: 'rule';
	readonly name: string;
	readonly body: ($: Record<string, RuntimeRule>) => RuntimeRule;
}

export function isRulePlaceholder(v: unknown): v is RulePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'rule';
}

export function rule(name: string, body: RulePlaceholder['body']): RulePlaceholder {
	return { __sittirPlaceholder: 'rule' as const, name, body };
}
```

`transform.ts`: add `RulePlaceholder` to `PatchValue` and `isRulePlaceholder` to the guard list at line 95; in `resolvePatch`, before the `isAliasPlaceholder` branch:

```ts
if (isRulePlaceholder(patch)) {
	const parentKind = wireGetCurrentRuleKind();
	if (!parentKind) throw new Error(`rule('${patch.name}'): no current rule kind — rule() must be used inside a rule callback`);
	const body = wrapInPrec(patch.body(wireDollarProxy()), precStack);
	const prior = wireGetSyntheticRule(patch.name);
	if (prior !== undefined && canonical(prior.body) !== canonical(body)) {
		throw new Error(`rule('${patch.name}'): bodies differ at ${prior.site} and ${parentKind}/${wireGetCurrentPatchPath()}`);
	}
	if (prior === undefined && !wireRegisterSyntheticRule(patch.name, body, `${parentKind}/${wireGetCurrentPatchPath()}`)) {
		throw new Error(`registerSyntheticRule('${patch.name}'): no active wire() context`);
	}
	return symbolRef(patch.name);
}
```

`wire.ts`: `wireRegisterSyntheticRule` gains an optional third parameter `site: string` stored beside the deposit; add `wireGetSyntheticRule(name): { body: RuntimeRule; site: string } | undefined`; `wireDollarProxy()` returns the same `$` proxy the wire rule callbacks receive; `wireGetCurrentPatchPath()` returns the key being applied (set by `applyPathPatches` around each `applyPath`). `path-type.ts`: add `RulePlaceholder` to `TransformPatchValue`. Export `rule` from `dsl/index.ts` beside `alias`.

- [ ] **Step 4: Run the test**

Run: `cd packages/codegen && pnpm exec vitest run src/dsl/__tests__/rule-placeholder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -- packages/codegen/src/dsl/primitives/rule.ts packages/codegen/src/dsl/transform/transform.ts packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/grammar-shapes/path-type.ts packages/codegen/src/dsl/index.ts packages/codegen/src/dsl/__tests__/rule-placeholder.test.ts
git commit -m "feat(dsl): rule(name, body) declares a real rule at a patch path"
```

---

### Task 4: `alias(name)` promotes an unnamed alias; leaf mints are not hoisted

**Files:**
- Modify: `packages/codegen/src/dsl/transform/transform.ts:859-871` (`resolveAliasPlaceholder`), `:873-913` (`registerAliasedVariant`)
- Test: `packages/codegen/src/dsl/__tests__/alias-placeholder.test.ts` (new)

**Interfaces:**
- Consumes: `withHoistedAnnotation`, `wireRegisterSyntheticRule`, `matchesEmpty`, `factorOutEmptiness`.
- Produces: no new names. Behaviour: retarget sets `named: true`; a mint whose body is a `STRING` or `PATTERN` carries no `hoisted` annotation.

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/dsl/__tests__/alias-placeholder.test.ts
import { describe, it, expect } from 'vitest';
import { alias } from '../primitives/alias.ts';
import { applyTransformForTest } from './_test-helpers.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });

describe('alias() on an existing unnamed alias', () => {
	it('promotes it to a named alias and keeps the content', () => {
		const member = { type: 'ALIAS', named: false, value: '"', content: P('[bc]?"') };
		const { result } = applyTransformForTest('string_literal', { type: 'SEQ', members: [member, S('x')] }, { 0: alias('string_open') });
		expect((result as any).members[0]).toMatchObject({ type: 'ALIAS', named: true, value: 'string_open', content: P('[bc]?"') });
	});
});

describe('alias() minting a bare literal', () => {
	it('deposits the literal under the hidden name without a hoisted annotation', () => {
		const { result, deposits } = applyTransformForTest('_pattern', { type: 'CHOICE', members: [S('x'), S('_')] }, { 1: alias('wildcard_pattern') });
		expect(deposits.get('_wildcard_pattern')).toEqual(S('_'));
		expect((result as any).members[1]).toMatchObject({ type: 'ALIAS', named: true, value: 'wildcard_pattern' });
	});
	it('still stamps hoisted on a compound body', () => {
		const { deposits } = applyTransformForTest('p', { type: 'CHOICE', members: [{ type: 'SEQ', members: [S('a'), S('b')] }] }, { 0: alias('ab') });
		expect((deposits.get('_ab') as any).annotations).toEqual({ hoisted: true });
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/dsl/__tests__/alias-placeholder.test.ts`
Expected: FAIL, `named` stays `false`; the literal deposit carries `annotations: { hoisted: true }`.

- [ ] **Step 3: Implement**

`resolveAliasPlaceholder`, the ALIAS branch:

```ts
if ((originalMember as { type?: string }).type === 'ALIAS') {
	return { ...(originalMember as object), named: true, value: patch.name } as unknown as RuntimeRule;
}
```

`registerAliasedVariant`, replace both `withHoistedAnnotation(...)` calls with `hoistedUnlessLeaf(...)`:

```ts
function hoistedUnlessLeaf(body: RuntimeRule): RuntimeRule {
	const t = (body as { type?: string }).type;
	return t === 'STRING' || t === 'PATTERN' ? body : withHoistedAnnotation(body);
}
```

- [ ] **Step 4: Run the test and the dsl suite**

Run: `cd packages/codegen && pnpm exec vitest run src/dsl`
Expected: PASS. `transform-enrich-lift.test.ts:35` and `wire.test.ts:118-121` assert `hoisted` on compound bodies and stay green.

- [ ] **Step 5: Commit**

```bash
git add -- packages/codegen/src/dsl/transform/transform.ts packages/codegen/src/dsl/__tests__/alias-placeholder.test.ts
git commit -m "feat(dsl): alias() promotes an unnamed alias; a literal mint is a subtype, not a hoist"
```

---

### Task 5: `alias-distributed` preflight diagnostic

> **Amended 2026-09-22** (spec §A.4). The same module also emits
> `display-union-mixed`: a `displayUnions` entry whose members include
> both a terminal storage kind (a literal, pattern or external token) and a
> nonterminal one. `severity: 'error'`, `canProceed: false`, `details:
> { display, terminals, nonterminals }`. It reads the link-phase
> `displayUnions`, so the diagnostics collector gains that input beside
> the evaluate-phase rules. Silent on all three grammars today; the unit
> fixture aliases a token and a seq-bodied rule to one name.

**Files:**
- Create: `packages/codegen/src/compiler/diagnostics/alias-distributed.ts`
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:~200-240` (`collectGrammarDiagnosticsForGrammar`: add the new diagnostics to `allDiagnostics`)
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/alias-distributed.test.ts` (new)

**Interfaces:**
- Consumes: `RawGrammar.rules` (evaluate-phase rules, after Task 1's distribution), `GrammarDiagnostic` shape (`scope`, `code`, `severity`, `grammar`, `ownerKind`, `message`, `canProceed`, `details`).
- Produces: `diagnoseDistributedAliases(input: { grammar: string; rules: Record<string, Rule<'evaluate'>> }): GrammarDiagnostic[]` with `code: 'alias-distributed'`, `severity: 'error'`, `canProceed: false`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/compiler/diagnostics/__tests__/alias-distributed.test.ts
import { describe, it, expect } from 'vitest';
import { diagnoseDistributedAliases } from '../alias-distributed.ts';

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const alias = (content: unknown, value: string) => ({ type: 'ALIAS', named: true, value, content });

describe('alias-distributed', () => {
	it('fires on an alias over a sequence of two or more members', () => {
		const out = diagnoseDistributedAliases({ grammar: 'demo', rules: { p: alias({ type: 'SEQ', members: [S('a'), S('b')] }, 't') } as never });
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ code: 'alias-distributed', ownerKind: 'p', canProceed: false });
		expect(out[0]!.message).toMatch(/alias\('t'\) over a sequence of 2 members/);
	});
	it('fires on an alias over a repeat', () => {
		const out = diagnoseDistributedAliases({ grammar: 'demo', rules: { p: alias({ type: 'REPEAT', content: sym('x') }, 't'), x: S('x') } as never });
		expect(out.map((d) => d.code)).toEqual(['alias-distributed']);
	});
	it('looks through a hidden rule used only by the alias', () => {
		const out = diagnoseDistributedAliases({ grammar: 'demo', rules: { p: alias(sym('_body'), 't'), _body: { type: 'SEQ', members: [S('a'), S('b')] } } as never });
		expect(out).toHaveLength(1);
	});
	it('is silent on a symbol, a literal, a pattern, a choice and a one-member sequence', () => {
		const rules = {
			a: alias(sym('x'), 't'), b: alias(S('s'), 't'), c: alias({ type: 'PATTERN', value: 'p' }, 't'),
			d: alias({ type: 'CHOICE', members: [S('1'), S('2')] }, 't'), e: alias({ type: 'SEQ', members: [sym('x')] }, 't'), x: S('x')
		};
		expect(diagnoseDistributedAliases({ grammar: 'demo', rules: rules as never })).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/diagnostics/__tests__/alias-distributed.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// packages/codegen/src/compiler/diagnostics/alias-distributed.ts
import { ALIAS, CHOICE, OPTIONAL, REPEAT, REPEAT1, SEQ, SYMBOL, FIELD, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';

type R = Rule<'evaluate'>;

function referenceCounts(rules: Record<string, R>): Map<string, number> {
	const counts = new Map<string, number>();
	const visit = (rule: R): void => {
		if (rule.type === SYMBOL) counts.set(rule.name, (counts.get(rule.name) ?? 0) + 1);
		else if ('members' in rule) rule.members.forEach(visit);
		else if ('content' in rule && rule.content !== undefined) visit(rule.content as R);
	};
	Object.values(rules).forEach(visit);
	return counts;
}

function distributedShape(content: R, rules: Record<string, R>, counts: Map<string, number>): string | undefined {
	if (content.type === SEQ) return content.members.length >= 2 ? `a sequence of ${content.members.length} members` : undefined;
	if (content.type === REPEAT || content.type === REPEAT1) return 'a repeat';
	if (content.type === SYMBOL && content.name.startsWith('_') && counts.get(content.name) === 1) {
		const body = rules[content.name];
		return body === undefined ? undefined : distributedShape(body, rules, counts);
	}
	return undefined;
}

export function diagnoseDistributedAliases(input: { grammar: string; rules: Record<string, R> }): GrammarDiagnostic[] {
	const counts = referenceCounts(input.rules);
	const out: GrammarDiagnostic[] = [];
	const visit = (rule: R, owner: string): void => {
		if (rule.type === ALIAS) {
			const shape = rule.named ? distributedShape(rule.content as R, input.rules, counts) : undefined;
			if (shape !== undefined) {
				out.push({
					scope: 'grammar', code: 'alias-distributed', severity: 'error', grammar: input.grammar, ownerKind: owner,
					message: `alias('${String(rule.value)}') over ${shape}: tree-sitter applies the alias to every member, so the model would describe one node where the parser issues several`,
					canProceed: false, details: { target: rule.value, shape }
				});
			}
			visit(rule.content as R, owner);
			return;
		}
		if ('members' in rule) rule.members.forEach((m) => visit(m, owner));
		else if ('content' in rule && rule.content !== undefined) visit(rule.content as R, owner);
	};
	for (const [name, rule] of Object.entries(input.rules)) visit(rule, name);
	return out;
}
```

In `collectGrammarDiagnosticsForGrammar`, add `...diagnoseDistributedAliases({ grammar: input.rawGrammar.name, rules: input.rawGrammar.rules })` to `allDiagnostics`.

- [ ] **Step 4: Run the test, then the preflight on all three grammars**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/diagnostics`; then `for g in typescript rust python; do pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics --grammar $g; done`
Expected: unit test PASS; no `alias-distributed` record for any grammar.

- [ ] **Step 5: Commit**

```bash
git add -- packages/codegen/src/compiler/diagnostics/alias-distributed.ts packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts packages/codegen/src/compiler/diagnostics/__tests__/alias-distributed.test.ts
git commit -m "feat(diagnostics): an alias over a sequence or a repeat is a blocking preflight diagnostic"
```

---

### Task 6: The validator compares grammar types; tolerances deleted

**Files:**
- Modify: `packages/tools/src/validate/read-render-parse.ts:220-330` (`astStructuralDiff`), `:898-925` (call site), the `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR` declaration and `leafAliasKey`
- Test: `packages/tools/src/validate/__tests__/ast-structural-diff.test.ts`

**Interfaces:**
- Consumes: web-tree-sitter `Node.grammarType: string`, `Node.grammarId: number`.
- Produces: `astStructuralDiff(a, b, path?, variantChildKinds?)`; the `rootAliasPair` and `leafAliasPairs` parameters are gone.

- [ ] **Step 1: Update the test to the new signature and the grammar-type comparison**

In `ast-structural-diff.test.ts`, replace every call that passed a tolerance with the four-parameter form, and add:

```ts
it('two nodes with the same grammar type but different display names are equal', () => {
	const a = fakeNode({ type: 'generic_type', grammarType: 'generic_type_with_turbofish', grammarId: 246 });
	const b = fakeNode({ type: 'generic_type_with_turbofish', grammarType: 'generic_type_with_turbofish', grammarId: 246 });
	expect(astStructuralDiff(a, b)).toBeNull();
});
it('two nodes with different grammar types differ even when the display names match', () => {
	const a = fakeNode({ type: 'generic_type', grammarType: 'generic_type', grammarId: 245 });
	const b = fakeNode({ type: 'generic_type', grammarType: 'generic_type_with_turbofish', grammarId: 246 });
	expect(astStructuralDiff(a, b)).toMatch(/grammar type generic_type ≠ generic_type_with_turbofish/);
});
```

`fakeNode` is the test file's existing node stub, extended with `grammarType` and `grammarId`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd packages/tools && pnpm exec vitest run src/validate/__tests__/ast-structural-diff.test.ts`
Expected: FAIL on the new signature and on the first new case.

- [ ] **Step 3: Implement**

In `astStructuralDiff`: remove the `rootAliasPair` and `leafAliasPairs` parameters and the block at lines 236-254; compare `a.grammarId !== b.grammarId` and report `` `${path || 'root'}: grammar type ${a.grammarType} ≠ ${b.grammarType}` ``; the child descent at line 323 passes no tolerance. Keep `variantChildKinds` (a sittir-side group-lift transparency, not an alias fact). Delete `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR` and `leafAliasKey`. At the call site (`:910-918`) delete `rootAliasPair` and pass `variantChildKinds` as the fourth argument. `findNodeAt` (`:125,162,172`) keeps matching on `type`, since `renderedKind` there is the display kind the validator was asked for.

- [ ] **Step 4: Run the test and the three validation runs**

Run: `cd packages/tools && pnpm exec vitest run src/validate`; then `pnpm run validate:native`.
Expected: PASS; read-render-parse and AST-match rows equal the baselines with the tolerances gone. A row that moves is a stop: it names a real alias-position divergence the tolerance was hiding.

- [ ] **Step 5: Commit**

```bash
git add -- packages/tools/src/validate/read-render-parse.ts packages/tools/src/validate/__tests__/ast-structural-diff.test.ts packages/tools/validation-history.jsonl
git commit -m "fix(validator): the structural diff compares grammar types; the alias tolerances go"
```

---

### Task 7: Retire the four overrides through the new primitives

**Files:**
- Modify: `packages/rust/grammar.sittir.ts` (`_wildcard_pattern` rule and `string_literal` rule → patches)
- Modify: `packages/python/grammar.sittir.ts` (`case_as_pattern` and `comprehension_clauses` rules → patches)
- Test: the existing `packages/{rust,python}/tests/nodes.test.ts` (generated) and `packages/tools/tests/census/hoisted.test.ts`

**Interfaces:**
- Consumes: `rule()` (Task 3), promoting `alias()` and unhoisted leaf mints (Task 4), display names from the mapping (Task 2).

- [ ] **Step 1: rust `_wildcard_pattern`**

Delete the `_wildcard_pattern: ($) => '_'` entry under `rules:`; keep `patches: { _pattern: { '-1': alias('wildcard_pattern') } }`. Regenerate rust, run `pnpm run validate:native` and `pnpm exec vitest run packages/tools/tests/census/hoisted.test.ts`.
Expected: rust rows equal; the hoisted census reports no new unseated kind (the mint carries no `hoisted`).

- [ ] **Step 2: rust `string_literal`**

Delete the `string_literal` entry under `rules:`; add `patches: { string_literal: { 0: alias('string_open') } }` (promotes the base's unnamed `alias(/[bc]?"/, '"')`). Regenerate rust; `pnpm run validate:native`.
Expected: rust rows equal; `b"…"` and `c"…"` round-trip in the corpus rows that carry them.

- [ ] **Step 3: python `case_as_pattern`**

Delete the `case_as_pattern` entry under `rules:`; add `patches: { case_pattern: { 0: alias('case_as_pattern') } }`. Regenerate python; `cargo check --workspace`; `pnpm run validate:native`.
Expected: cargo green (the `_AsPattern…` struct keeps its own spacing sites keyed `_as_pattern`; `as_pattern`'s are keyed `as_pattern`); python rows equal.

- [ ] **Step 4: python `comprehension_clauses`**

Delete the `comprehension_clauses` rule and the four comprehension-kind rewrites under `rules:`; add:

```ts
patches: {
	list_comprehension: { 1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause))) },
	dictionary_comprehension: { 1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause))) },
	set_comprehension: { 1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause))) },
	generator_expression: { 1: rule('comprehension_clauses', ($) => repeat1(choice($.for_in_clause, $.if_clause))) }
}
```

The index is the position of `_comprehension_clauses` in each base rule; confirm each against `packages/python/.sittir/src/grammar.json` before writing. Regenerate python; `pnpm run validate:native`.
Expected: python rows equal; `(x for x in y for z in w)` renders once per clause in the corpus rows.

- [ ] **Step 5: Full gate and commit**

Run the regen loop for all three, `pnpm run validate:native`, `pnpm run type-check`, `pnpm run lint`, vitest.

```bash
git add -- packages/rust/grammar.sittir.ts packages/python/grammar.sittir.ts packages/*/src packages/*/.sittir rust/crates/sittir-*/src rust/crates/sittir-*/index.d.ts packages/*/tests/__snapshots__ packages/tools/validation-history.jsonl
git commit -m "refactor(rust,python): four hand-written rules retire into alias() and rule() patches"
```

---

### Task 8: Glossary, spec status, PR

**Files:**
- Modify: `docs/glossary/compiler.md` (entries for `rewriteInlineAliases`, `choiceArmsThrough`, `collectDisplayUnions`, `aliasTargetOf`, `storageNameOf`; delete the `publicKindName` body note), `docs/glossary/compiler-model.md` (`display-name.ts` entries), `docs/glossary/compiler-diagnostics.md` (`alias-distributed`), `docs/glossary/dsl-primitives.md` (`rule`), `docs/glossary/dsl-transform.md` (`resolveAliasPlaceholder` promotion, `hoistedUnlessLeaf`), `docs/glossary/tools.md` (`astStructuralDiff` grammar-type comparison)
- Modify: `docs/superpowers/specs/2026-09-21-alias-identity-design.md` (status: implemented, with the date)
- Modify: `docs/KNOWN_ISSUES.md` (remove the `generic_type` tolerance note if present)

- [ ] **Step 1: Write the glossary entries**

One `###` section per new or changed declaration, by qualified name, stating the live constraint (why a surviving nested sequence under an alias is a diagnostic; why a display name never comes from a strip; why a literal mint is not hoisted). No issue or PR numbers.

- [ ] **Step 2: Open the PR**

Base `feat/bindings-vocabulary`. Body: the before/after validation table for the three grammars, the list of deleted names (`publicKindName`, `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR`, `leafAliasKey`, the seven typescript `_` twins), and the four retired overrides. Closes #314, #289, #290, #291, #214.

```bash
git add -- docs/glossary/compiler.md docs/glossary/compiler-model.md docs/glossary/compiler-diagnostics.md docs/glossary/dsl-primitives.md docs/glossary/dsl-transform.md docs/glossary/tools.md docs/superpowers/specs/2026-09-21-alias-identity-design.md docs/KNOWN_ISSUES.md
git commit -m "docs(glossary,specs): alias identity entries; spec marked implemented"
```
