# Alias Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close #314, #289, #290, #291 and #214 on the identity model the repo already has: storage kind is the grammar symbol, the alias target is a display name, and no layer invents a node the parser never issues.

**Architecture:** Enrich owns the alias shape for both pipelines: it distributes an alias over its arms (looking through `inline` rules), lifts aliased hidden-rule bodies, mints storage for inline literal aliases, and unaliases overloaded displays so every display has one parser identity (`dsl/rule-transforms.ts`, classified by `dsl/rule-patterns.ts::parserSymbolClassOf`). Link builds one `displayUnions` map from the aliased refs and mints an `AssembledAlias` envelope per catalog alias symbol; the native reader stamps `$type` and `$storageType`. `publicKindName` is split into a display-name accessor and a storage-identifier accessor. Two `patches:` additions (`rule()`, a promoting `alias()`) close the authoring gaps. One preflight diagnostic guards aliases over sequences and repeats. The validator compares grammar types.

**Status (2026-09-24):** Task 1 is done and merged (PR #330 into feat/seat-overlay-options: a4aa98dcc, 3d4e22a6f, 52b19c8c5, daacf6258; lint follow-up #332). Its step list below is kept as history; what landed differs from it and is summarized in the Task 1 note. Tasks 2–8 remain and were re-based on the merged code on 2026-09-24; every `file:line` in them was re-checked against feat/seat-overlay-options at ad445142f. Per the work order this plan resumes after #315, the stack merge into #283 and the options-carriage plan.

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
- The older `aliasedTo`/`aliasedToId` ref form is out of scope; read whichever form a ref carries through `types/rule.ts::aliasTargetOf` / `storageNameOf` (landed with Task 1).
- Terminality is `dsl/rule-patterns.ts::parserSymbolClassOf` (mirrors tree-sitter's extract_tokens; anchored against every alias-site storage in the three parser.c by `dsl/__tests__/parser-symbol-class.test.ts`). No task re-derives whether a storage is a terminal.

---

## File map

| file | responsibility after this plan |
| --- | --- |
| `packages/codegen/src/dsl/rule-transforms.ts` (landed) | `distributeInlineAliasChoices`, `liftAliasedHiddenRuleBodies`, `mintInlineLiteralAliasStorage`, `unaliasOverloadedDisplays`; evaluate synthesizes nothing for alias content |
| `packages/codegen/src/dsl/rule-patterns.ts` (landed) | `parserSymbolClassOf`, `tokenUseCounts`: the one terminality predicate |
| `packages/codegen/src/compiler/link.ts` (landed) | `collectDisplayUnions` builds `displayUnions`; `mintDisplayUnionRules` mints one `AssembledAlias` body per catalog alias symbol; `foldAliasLiteralsIntoEnumRules` reads the distributed literal arms; `collectAliasedHiddenKinds` retires once no consumer reads it (open, Task 2 audits its readers) |
| `packages/codegen/src/compiler/types.ts` (landed) | `LinkedGrammar.displayUnions: ReadonlyMap<string, ReadonlySet<string>>` carried to `NodeMap.displayUnions` |
| `packages/codegen/src/compiler/model/display-name.ts` (new) | `displayNameOf(ref)`, `storageIdentifier(kind)`; replaces `render-rules.ts::publicKindName` |
| `packages/codegen/src/emitters/types.ts`, `is.ts` emitter, `wrap.ts` | emit one union type per display union; no `_<target>` twin |
| `packages/codegen/src/dsl/primitives/rule.ts` (new) | `rule(name, body)` placeholder |
| `packages/codegen/src/dsl/transform/transform.ts` | `resolvePatch` handles `rule()`; `resolveAliasPlaceholder` sets `named: true`; `registerAliasedVariant` stamps `hoisted` only on compound bodies |
| `packages/codegen/src/compiler/diagnostics/alias-distributed.ts` (new) | the `alias-distributed` preflight diagnostic |
| `packages/tools/src/validate/read-render-parse.ts` | `astStructuralDiff` compares `grammarType`; the (already empty) tolerance table and its plumbing deleted |
| `packages/{rust,python}/grammar.sittir.ts` | overrides retired through the new primitives |

---

### Task 1: Distribute an inline alias over its arms; build `displayUnions`

> **DONE 2026-09-24** (PR #330, merged 9e942eb; spec §A.1–A.3, A.5 as
> re-amended in 52b19c8c5). What landed, against the steps below:
>
> - Distribution moved out of evaluate entirely: `dsl/rule-transforms.ts::
>   distributeInlineAliasChoices` runs in enrich for both pipelines,
>   splits over choice arms whether or not the display is a rule, and
>   looks through `inline` rules (tree-sitter substitutes their bodies).
>   `liftAliasedHiddenRuleBodies` lifts a hidden rule whose whole body is
>   an alias; `mintInlineLiteralAliasStorage` mints `_<display>` for an
>   inline literal choice whose display is not a rule (rust
>   `_primitive_type`). `evaluate.ts::rewriteInlineAliases` and the
>   `inline-alias-source` divergence are deleted.
> - `link.ts::unhideAliasedTargets` deleted; `hidden` is the name fact.
>   `collectDisplayUnions` reads both ref forms; `mintDisplayUnionRules`
>   mints a body per catalog alias symbol.
> - Node model: one class, `compiler/model/node-map.ts::AssembledAlias`
>   (`modelType: 'alias'`, `aliasTypeId` required), for a display over
>   visible or uncatalogued storage; a display over a hidden catalogued
>   storage (`lhs_expression`, `primitive_type`) is a plain envelope keyed
>   by the container's grammar symbol. The reader stamps `$type` (type id)
>   and `$storageType` (`read_node.rs::identity`, generated
>   `is_alias_envelope`). Aliases have a raw factory and no `ir` key
>   (user ruling); parents admit content through `admitAliasContent` and
>   the `__aliasContent__` brand.
> - Step 3b landed as `dsl/rule-transforms.ts::unaliasOverloadedDisplays`
>   (replacing `applyUnaliasDistinct` and its diagnostics plumbing): a
>   display that is a rule keeps itself and, when it is a terminal rule,
>   its terminal storages (the parser reuses `sym_identifier`, so
>   contextual keywords stay `identifier`); every other storage splits
>   (visible or literal drops the alias; hidden takes its stripped name,
>   `<display>_<stripped>` on a clash, minted in sorted display order).
>   Terminals-only unions stay (`property_identifier` family,
>   `string_fragment`, rust `doc_comment`). No `reserved_identifier` kind
>   exists in any grammar.
> - Parser divergences introduced, all disclosed in the PR body: rust
>   `inner/outer_line_doc_comment_marker`,
>   `scoped_type_identifier_in_expression_position`, bare `$` in token
>   trees, 17 anonymous primitive tokens; typescript `decorator_*`,
>   `type_query_*`, `tuple_parameter`, `optional_tuple_parameter`,
>   `unary_expression_number`, `string_fragment` over the four unescaped
>   fragments; python `match_block`. ts `string`, `call_expression`,
>   `parenthesized_expression` and rust `token_tree` are supertypes now;
>   the quotes preference binds at `string/variant` (a supertype variant
>   site, `VARIANT_LABEL`, `AssembledSupertype.optionDefaultArm`).
> - Gate met: rust 135/137, ts 112/114, py 115/116; validate totals at
>   100% except the known ts `debugger_statement` case.

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

### Task 2: Display names are stamped on the node; `publicKindName` is gone (landed)

**What landed** (all 74 `publicKindName` references in 10 files, recounted on the branch; the plan's 61 predates Task 1):

- `compiler/model/display-name.ts`: `stampDisplay` sets `AssembledNodeBase.display = { name, source }` at construction from the kind's own catalog row (`findOwnKindEntry`); `displayNameOf(kind, nodeMap)` reads it and throws for a name that is not a node; `displayNameOfEntry(entry, kindEntries)` answers for a catalog row (an anonymous token has no node); `displayNameOfRef(ref)` is the per-site display. The display is the row's parser symbol (`symbolName`), never the literal spelling: a hidden rule the parser shows as an anonymous token displays as that token's kind (typescript `_ternary_qmark` → `qmark`).
- One naming rule for a name the parser does not show, `displayOfParserName` → `undisplayedKindAddress`: a hidden-prefixed parser name keeps its underscore-less address (rust `_let_chain`, `_token_keywords`; python `_augmented_assignment_operator`, `_simple_statements`). No other strip survives.
- A node with no own row: `source` records why, with `supertype` for a supertype tree-sitter issues no symbol for, `alias-name` for a node assemble mints under an alias name, and `phantom` otherwise (the six sittir-minted operator enums, python `keyword_identifier`). Its display comes from the same naming rule. `AssembledSupertype` now receives the catalog; this moved no output.
- Shared displays: the kind that owns its display (`ownsItsDisplay`) holds the options hint home; any other collision throws. The visible-twin merge in `emitOptionsHints` is gone.
- Whitespace arms are stamped on each `whitespaceChoice` member (`annotations.arm`) and read back by `partOf`/`seamChoiceDefault`; `whitespaceSymbolsOf` maps arm to member symbol from the `_whitespace` supertype.
- `admitsNoExtras` names a lexical kind by structure (`isLexicalSymbol`: an external, or a rule lexical all the way down), not by the `_`-reprefix name bridge.
- `isDisplayedLiteral` reads `aliasTargetOf`. `collectAliasedHiddenKinds` and its plumbing are retired: every entry it held was a non-node kind, which `acceptedTransportKinds` never consulted (byte-identical).
- No `storageIdentifier`: nothing needed one.

**Output moves (reviewed and accepted):** python `(parameters)/parameter…` → `(parameters_elements)/parameter…`; typescript `_number` owns its edges as `unary_expression_number` (five sites, three seated); display-sharing `Edged` ids (typescript fragments → `string_fragment` 109, `_ternary_qmark` → 126; rust `raw_string_literal_content` → 155).

**Follow-up:** hidden kinds' `typeName` casing is inconsistent (`_Number` vs `TemplateChars`); unify it through the one identifier casing when a task next touches type names.

---

### Task 3: `rule(name, body)` placeholder (landed)

**What landed, where it differs from the steps below:**
- The name is installed as a rule by `injectPlaceholderHiddenRules` (`placeholderHiddenName` returns it), the same path variant and alias mints take. A name the grammar already has (authored, base, patched or external) is refused at wire time.
- The body is built from the executing pipeline's real `$`, which `buildPatchedParentFn` scopes on the wire context (`currentDollar`, read through `wireDollar()`), not from a simple proxy.
- The patch key is passed into `resolvePatch` as a parameter; there is no current-patch-path global. The deposit keeps its declaring site (`wireRegisterSyntheticRule(name, body, site)`, `wireGetSyntheticRule`).
- The body is not wrapped in the path's precedence (`variant()` is).
- Bodies are compared with `canonicalRuleText`, exported from `token-forms.ts` (it was a private `canonical`). `applyTransformForTest` is added to `_test-helpers.ts`.


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

### Task 4: `alias(name)` promotes an unnamed alias; leaf mints are not hoisted (landed)

**What landed:**
- The ALIAS branch of `resolveAliasPlaceholder` sets `named: true`.
- "Leaf" is what tree-sitter lexes as one token: `lexesAsOneToken` in rule-patterns wraps `extractedToken`, and `hoistedUnlessToken` applies it to `alias()` and `variant()` mints alike (user ruling). Rust `range_pattern_with_left_bare` and `line_comment_content` lose `hoisted` and their seats.
- A leaf variant arm keeps its overlay surface, the way enum arms do (user ruling). The multi-choice-slot arm walk, renamed `authoredArmCandidatesOf`, admits a hoisted group or a variant arm, so `rangePatternWithLeft.bare` is byte-identical.
- Assemble no longer mints a supertype under an alias name. The storage carries the display and the unprefixed type name (user ruling): typescript `_LhsExpression` → `LhsExpression`, rust `_NonSpecialToken` → `NonSpecialToken`. The `alias-name` display source is gone; `ownsItsDisplay` covers only a symbol-less supertype sharing a visible kind's name.


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

### Task 5: `alias-distributed` preflight diagnostic (landed)

**What landed:**
- `display-union` members carry their literal stamp (`DisplayUnionMember { storage, literal }`), set where `collectDisplayUnions` records them. The minter resolves each member by the stamp instead of trying catalog lookups in order. This is its own commit and byte-identical.
- `terminalContentOf` / `terminalSymbolOf` / `choiceArmsOf` moved from enrich's closures into rule-patterns beside `parserSymbolClassOf`; enrich calls them (byte-identical).
- `compiler/diagnostics/alias-distributed.ts`:
  - `diagnoseDistributedAliases` walks with `RuleWalker`. It checks named aliases only, and looks through precedence, `optional` and `field` wrappers and through inlined rules (by `parserSymbolClassOf`), never through `token()`.
  - `diagnoseMixedDisplayUnions` classifies a literal member by its stamp and any other member by `terminalSymbolOf`; a member that is neither a rule, an external nor a literal is a `display-union-unknown-member` error.
  - The collector builds one `ParserSymbolCtx` from the raw grammar for both.
- Silent on all three grammars. The one census hit, typescript's unnamed `alias(seq('unique', 'symbol'), 'unique symbol')`, is out of scope by the named-only rule.


> **Amended 2026-09-24** (spec §A.3, §A.4 as re-amended). Two changes
> from the merged Task 1:
>
> - Look-through follows the parser, not use count: an alias over a
>   SYMBOL whose rule is in the grammar's `inline` list (or whose body an
>   inline chain reaches) is inspected through that body, because
>   tree-sitter substitutes it. A hidden rule that is not inlined is a
>   node of its own and is not looked through, however many uses it has.
>   `distributedShape` below reads `RawGrammar.inline`, not a reference
>   count.
> - `display-union-mixed` is an invariant guard, not a user-facing
>   shape check: `dsl/rule-transforms.ts::unaliasOverloadedDisplays`
>   resolves every mixed bucket in enrich (a single nonterminal beside
>   terminals is split or its terminals drop their alias), so after
>   enrich no `displayUnions` entry can hold both classes. The diagnostic
>   classifies members with `dsl/rule-patterns.ts::parserSymbolClassOf`
>   over a `ParserSymbolCtx` built from the raw grammar (`rules`,
>   `externals`, `inline`, `tokenUseCounts(rules)`), never its own
>   terminal test. `severity: 'error'`, `canProceed: false`, `details:
>   { display, terminals, nonterminals }`. Silent on all three grammars;
>   the unit fixture bypasses enrich and hands link a token and a
>   seq-bodied rule under one name.

**Files:**
- Create: `packages/codegen/src/compiler/diagnostics/alias-distributed.ts`
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:171-249` (`collectGrammarDiagnosticsForGrammar`: add the new diagnostics to `allDiagnostics` at `:224`)
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
	it('looks through an inlined rule, because the parser substitutes its body', () => {
		const out = diagnoseDistributedAliases({ grammar: 'demo', inline: ['_body'], rules: { p: alias(sym('_body'), 't'), _body: { type: 'SEQ', members: [S('a'), S('b')] } } as never });
		expect(out).toHaveLength(1);
	});
	it('does not look through a hidden rule that is not inlined, whatever its use count', () => {
		const out = diagnoseDistributedAliases({ grammar: 'demo', inline: [], rules: { p: alias(sym('_body'), 't'), _body: { type: 'SEQ', members: [S('a'), S('b')] } } as never });
		expect(out).toEqual([]);
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

function distributedShape(content: R, rules: Record<string, R>, inline: ReadonlySet<string>): string | undefined {
	if (content.type === SEQ) return content.members.length >= 2 ? `a sequence of ${content.members.length} members` : undefined;
	if (content.type === REPEAT || content.type === REPEAT1) return 'a repeat';
	if (content.type === SYMBOL && inline.has(content.name)) {
		const body = rules[content.name];
		return body === undefined ? undefined : distributedShape(body, rules, inline);
	}
	return undefined;
}

export function diagnoseDistributedAliases(input: { grammar: string; rules: Record<string, R>; inline: readonly string[] }): GrammarDiagnostic[] {
	const inline = new Set(input.inline);
	const out: GrammarDiagnostic[] = [];
	const visit = (rule: R, owner: string): void => {
		if (rule.type === ALIAS) {
			const shape = rule.named ? distributedShape(rule.content as R, input.rules, inline) : undefined;
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

In `collectGrammarDiagnosticsForGrammar`, add `...diagnoseDistributedAliases({ grammar: input.rawGrammar.name, rules: input.rawGrammar.rules, inline: input.rawGrammar.inline })` to `allDiagnostics`.

The same module exports `diagnoseMixedDisplayUnions(input: { grammar: string; displayUnions: ReadonlyMap<string, ReadonlySet<string>>; symbols: ParserSymbolCtx }): GrammarDiagnostic[]`: for each union, `parserSymbolClassOf(member, input.symbols)` files a member as `'terminal'` or `'nonterminal'` (an `'inlined'` member is filed by its body through the same call the enrich pass uses, `dsl/rule-transforms.ts`'s `terminalSymbol` closure hoisted to an export so the two do not diverge); a union with both classes emits `display-union-mixed`. `ParserSymbolCtx` is built once in the collector from the raw grammar: `{ rules, externals: new Set(externals), inline: new Set(inline), tokenUses: tokenUseCounts(rules) }`. The collector gains the link-phase `displayUnions` as an input beside the evaluate-phase rules.

- [ ] **Step 4: Run the test, then the preflight on all three grammars**

Run: `cd packages/codegen && pnpm exec vitest run src/compiler/diagnostics`; then `for g in typescript rust python; do pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics --grammar $g; done`
Expected: unit test PASS; no `alias-distributed` record for any grammar.

- [ ] **Step 5: Commit**

```bash
git add -- packages/codegen/src/compiler/diagnostics/alias-distributed.ts packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts packages/codegen/src/compiler/diagnostics/__tests__/alias-distributed.test.ts
git commit -m "feat(diagnostics): an alias over a sequence or a repeat is a blocking preflight diagnostic"
```

---

### Task 6: The validator compares grammar types; tolerances deleted (landed)

**What landed:** `astStructuralDiff(a, b, path?, variantChildKinds?)` compares `grammarId` (web-tree-sitter 0.26.9) and reports `grammar type X ≠ Y`. The root-alias pair, the leaf-alias allowlist, `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR` and `leafAliasKey` are deleted. Both callers are updated: the validator, and `probe/kind.ts`, which the steps below miss. Validator rows are unchanged on all three grammars with the tolerances gone.


**Files:**
- Modify: `packages/tools/src/validate/read-render-parse.ts:220-330` (`astStructuralDiff`), `:913-925` (call site), the `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR` declaration at `:214` (already `{}` at ad445142f: no grammar carries a tolerance any more, only the plumbing is left), its comment at `:243` and `leafAliasKey`
- Already done by Task 1: `packages/tools/src/validate/common.ts:562` (`wrapForReparse`) selects the reparse wrapper by the parse kind (`opts.targetKind`), not by stripping underscores. Do not redo it.
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
- Modify: `packages/rust/grammar.sittir.ts:657` (`_wildcard_pattern` rule) and `:667-670` (`string_literal` rule with `_string_literal_open`) → patches
- Modify: `packages/python/grammar.sittir.ts:377` (`case_as_pattern`) and `:381` (`comprehension_clauses`, referenced at `:119`) → patches
- Test: the existing `packages/{rust,python}/tests/nodes.test.ts` (generated) and `packages/tools/tests/census/hoisted.test.ts`

Task 1 already retired two other rust overrides by other means (`_let_chain` → ten `field()` patches; the `_non_delim_token` `$` alias deleted, the bare `$` now drops its alias in enrich) and added one (`_primitive_type: ($, original) => prec(-1, original)` over the enrich mint). Those are settled; this task is the four named here only. The hand-written rule ceilings in the unsupported-shape diagnostics plan (ts 17 / rust 25 / py 22) drop by this task's count when it lands.

**Interfaces:**
- Consumes: `rule()` (Task 3), promoting `alias()` and unhoisted leaf mints (Task 4), display names from the mapping (Task 2).

- [x] **Step 1: rust `_wildcard_pattern`**

Delete the `_wildcard_pattern: ($) => '_'` entry under `rules:`; keep `patches: { _pattern: { '-1': alias('wildcard_pattern') } }`. Regenerate rust, run `pnpm run validate:native` and `pnpm exec vitest run packages/tools/tests/census/hoisted.test.ts`.
Expected: rust rows equal; the hoisted census reports no new unseated kind (the mint carries no `hoisted`).
Landed: the injected rule is appended to the grammar, so rust kind ids from `wildcard_pattern` onward renumber (ids only).

- [x] **Step 2: rust `string_literal`**

Delete the `string_literal` entry under `rules:`; add `alias('string_open')` at `string_literal/0` beside the existing `field('string_open')` patch, as the array form `[{ 0: alias('string_open') }, { 0: field('string_open') }]` (a duplicate key replaces). It promotes the base's unnamed `alias(/[bc]?"/, '"')`.
Prerequisite (landed): an alias over inline content mints the content as the leaf rule `_<name>`; promoted in place it left `string_open` with no model kind and a kindless `string` slot. Landed: storage `_string_open`, typeName `StringOpen` (was `StringLiteralOpen`, the user's ruling). Regenerate rust; `pnpm run validate:native`.
Expected: rust rows equal; `b"…"` and `c"…"` round-trip in the corpus rows that carry them.

- [x] **Step 3: python `case_as_pattern`**

Delete the `case_as_pattern` and `case_pattern` entries under `rules:` (the override references `$.case_as_pattern`); add `patches: { case_pattern: { 0: alias('case_as_pattern') } }`.
Landed (the user's ruling): storage `_as_pattern`, typeName `_AsPattern` (was `CaseAsPattern`, with a typename-collision info diagnostic beside `as_pattern`); without the override, enrich's `simple_pattern` alias of case_pattern's third arm reaches the parser, so node-types gains `simple_pattern`. python from/cov totals 164→163 and 144→143, all passing. Regenerate python; `cargo check --workspace`; `pnpm run validate:native`.
Expected: cargo green (the `_AsPattern…` struct keeps its own spacing sites keyed `_as_pattern`; `as_pattern`'s are keyed `as_pattern`); python rows equal.

- [x] **Step 4: python `comprehension_clauses`**

Delete the `comprehension_clauses` rule and the four comprehension-kind rewrites under `rules:`; add:

```ts
const comprehensionClauses = rule('comprehension_clauses', ($) => field('content', repeat1(choice($.for_in_clause, $.if_clause))));
patches: {
	list_comprehension: { 2: comprehensionClauses },
	dictionary_comprehension: { 2: comprehensionClauses },
	set_comprehension: { 2: comprehensionClauses },
	generator_expression: { 2: comprehensionClauses }
}
```

`_comprehension_clauses` sits at index 2 in all four base rules (`'['`, `field('body', …)`, the clauses). The `field('content', …)` keeps the options address `comprehension_clauses: { 'content:/separator': … }`.

Prerequisite (landed): a `rule()` body used at several sites is built by the installed rule from that rule's own `$` (`declaredRuleFn`), not at the patch site. Built at the site, each body's symbols carried the patching parent as their owner, so the four equal bodies compared unequal and the refs belonged to `list_comprehension`. Regenerate python; `pnpm run validate:native`.
Expected: python rows equal; `(x for x in y for z in w)` renders once per clause in the corpus rows.

- [x] **Step 5: Full gate and commit**

Run the regen loop for all three, `pnpm run validate:native`, `pnpm run type-check`, `pnpm run lint`, vitest.

```bash
git add -- packages/rust/grammar.sittir.ts packages/python/grammar.sittir.ts packages/*/src packages/*/.sittir rust/crates/sittir-*/src rust/crates/sittir-*/index.d.ts packages/*/tests/__snapshots__ packages/tools/validation-history.jsonl
git commit -m "refactor(rust,python): four hand-written rules retire into alias() and rule() patches"
```

---

### Task 7a: Arms are the variants at the end of wire

The user's rule: a sub-factory arm exists exactly where a variant label (`variant`/`variantOf` annotation) exists at the end of wire. Nothing else makes an arm. The field rule lives where variants are made: a fielded slot gets no automatic variant.

**Stamp (enrich).** Enrich stamps `variant: <name>, variantOf: <owner>` on each arm of every unfielded (`_content`) choice. The name is computed once, at stamp time, with today's arm naming: `prefixNamedSuffix(owner, display) ?? display`, where display = the alias target, else the storage name without its leading `_`. A literal arm is named by its token kind. Enrich records every label it stamps in its non-enumerable sidecar.
- A displayed literal (an anonymous literal shown under another kind's display, e.g. `alias('async', $.identifier)`) gets no variant: it is its display.
- A supertype's own members are stamped with the supertype as `variantOf`; the existing variant-subtype path mounts them wherever the supertype sits.
- The clash-fallback rename in `unaliasOverloadedDisplays` (`_number` → `unary_expression_number`) stamps the arm with its own name (`number`) through the same stamp.

**Strip (wire).** When a patch fields a slot after enrich, wire removes the automatic variants on that slot, using the sidecar. `alias(name)` on a site writes that site's label (`variant` = the name's arm label, `variantOf` = the owning rule), overwriting an automatic one. Authored `variant()` stays.

**Overlay.** The arm set is exactly the variant-labelled members. Nesting is a child's own variants under its arm (the ir paths are unchanged). Deleted: display-derived arm naming (`armName`, `kindArmName`, `displayNameOfValue` for arms, `armNaming`'s fallback), grand-arm lifting (`grandArmCandidates`, `flattened`, `hostedApart`, claim counting and deconfliction), `armSubtypes`/`declaredSupertype`, `foldDisplayedLiterals`/`displayedLiteralTarget`, and the unlabelled hoisted-group path.

**Provenance.** A node-model childKind descriptor built from enrich-stamped labels reads `definedBy: 'enrich'` (from `author: 'enrich'` on the stamp), `'override'` otherwise; the descriptor's value is `'enrich'` only when every labelled arm of the kind is enrich-authored. It is a label; nothing branches on it.

- [ ] Enrich stamp, sidecar record, clash-fallback label.
- [ ] Wire strip on field(); alias() writes the label.
- [ ] Overlay arm set = variant-labelled members; deletions above.
- [ ] definedBy 'enrich'.
- [ ] Gates: rows identical; options addresses unmoved; types.ts, factory signatures and transport unmoved; storage gate unchanged; lint 0 (by count); suite; cargo. Node-model may move only by new polymorphVariants childKind entries (report the count per grammar); any modelType change or factorySlots/shape/field move stops.
- [ ] Report the arm diff per grammar before committing, with every ir-path change named.

### Task 7b: A built node carries the alias envelope its read shows

Every alias site is an envelope (the user's rule), and the read materializes it: python `case test():` reads `case_pattern → _simple_pattern {simple_pattern} → _class_pattern`, typescript `a = 1;` reads `assignment_expression._left = {lhs_expression} → _identifier`. A factory or composer at an aliased site builds the content directly (`casePattern.classPattern(...)` → `case_pattern._content = class_pattern`), so built ≠ read; render and the validators still pass because they compare text and parse trees, not the read-vs-built model shape.

Instances: python `_simple_pattern` at case_pattern (alias `simple_pattern`); typescript `_lhs_expression` at assignment_expression and for_header_lhs (alias `lhs_expression`); rust `_non_special_token` at the eleven token-tree kinds (alias `non_special_token`).

- [ ] A composer or factory at an aliased site builds the AssembledAlias envelope, so a built node equals the read node.
- [ ] Pinned test: built python `casePattern.classPattern` and typescript `assignmentExpression` left equal their read shape (text-stripped).
- [ ] Gates as Task 7.

### Task 7c: The identifier leaf guard rejects a reserved word the slot does not admit

A contextual keyword displayed as `identifier` is an identifier only where the parser admits it: each slot lists the keywords it admits (the per-slot admitted keyword sets). Today the identifier leaf guard is the identifier pattern alone, so `ir.identifier('if')` is accepted anywhere.

- [ ] The identifier leaf guard rejects a reserved word unless the slot it is built for admits that keyword, read from the slot's admitted keyword set.
- [ ] Test: an admitting slot builds, renders and reparses the keyword spelling; a non-admitting slot rejects it.
- [ ] Gates as Task 7.

### Task 8: Glossary, spec status, PR

**Files:**
- Modify: `docs/glossary/compiler.md` (delete the `publicKindName` body note; the Task 1 entries for `collectDisplayUnions`, `mintDisplayUnionRules`, `aliasTargetOf`, `storageNameOf` already exist), `docs/glossary/compiler-model.md` (`display-name.ts` entries), `docs/glossary/compiler-diagnostics.md` (`alias-distributed`, `display-union-mixed`), `docs/glossary/dsl-primitives.md` (`rule`), `docs/glossary/dsl-transform.md` (`resolveAliasPlaceholder` promotion, `hoistedUnlessLeaf`), `docs/glossary/tools.md` (`astStructuralDiff` grammar-type comparison)
- Modify: `docs/superpowers/specs/2026-09-21-alias-identity-design.md` (status: implemented, with the date; §A already describes the merged Task 1)
- `docs/KNOWN_ISSUES.md` carries no `generic_type` tolerance note at ad445142f; nothing to remove there.

- [ ] **Step 1: Write the glossary entries**

One `###` section per new or changed declaration, by qualified name, stating the live constraint (why a surviving nested sequence under an alias is a diagnostic; why a display name never comes from a strip; why a literal mint is not hoisted). No issue or PR numbers.

- [ ] **Step 2: Open the PR**

Base `feat/bindings-vocabulary`, or `master` if #283 has merged by then. Body: the before/after validation table for the three grammars, the list of deleted names (`publicKindName`, `LEAF_ALIAS_TOLERANCE_BY_GRAMMAR`, `leafAliasKey`, `collectAliasedHiddenKinds` if Task 2 retired it), and the four retired overrides; the parser divergences from Task 1 are already on record in PR #330. Closes #314, #289, #290, #291, #214.

```bash
git add -- docs/glossary/compiler.md docs/glossary/compiler-model.md docs/glossary/compiler-diagnostics.md docs/glossary/dsl-primitives.md docs/glossary/dsl-transform.md docs/glossary/tools.md docs/superpowers/specs/2026-09-21-alias-identity-design.md docs/KNOWN_ISSUES.md
git commit -m "docs(glossary,specs): alias identity entries; spec marked implemented"
```
