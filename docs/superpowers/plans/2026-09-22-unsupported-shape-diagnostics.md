# Unsupported-shape diagnostics and hand-written rule causes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every `rules:` entry in the three grammar files declares its cause, a replacement of an upstream rule is justified only when the upstream shape provokes a blocking diagnostic, the four shape codes block instead of falling back, patch sites are labelled authoring or resolving, and hand-written rule counts become ratchet ceilings.

**Architecture:** Three DSL wrappers (`reauthored`, `vocabulary`, `renderOnly`) tag a rule function with its cause; wire collects the tags and the placeholder applications into the wire context, evaluate drains them onto `RawGrammar`, and one new diagnostics module compares them against a second, upstream-only compile of the same grammar (the enriched base with no wire config). The collector's existing blocking-override and `expectDiagnostics` floor mechanisms carry the new codes and the flipped ones, so the gate stays green through the migration and only tightens afterwards.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, the sittir codegen compiler (`evaluate` → `link` → `normalize` → `assemble`), the `sittir tool` commander tree.

**Spec:** `docs/superpowers/specs/2026-09-22-unsupported-shape-diagnostics-design.md`

## Global Constraints

- DRY: one declaration per hand-written rule, one upstream compile per grammar, one provocation table; no second derivation of "why this rule exists".
- Generated outputs are never hand-edited. Every task that touches the grammar files or the compiler regenerates all three grammars and shows **byte-identical** generated output (`git status --short packages/*/src packages/*/.sittir rust/crates` empty, manifests aside).
- Comments live in `docs/glossary/`, never in `packages/codegen/src/`.
- Ratchets only tighten: hand-written rule ceilings start at typescript 17, rust 26, python 22 and only go down.
- Census drift since this plan was written (re-count at Task 4, never raise): the alias-identity branch moved rust `_let_chain` to `patches:` and deleted the `_non_delim_token` override, and added `_primitive_type: ($, original) => prec(-1, original)` on an enrich mint (cause `'ambiguity'`; the upstream compile sees the mint because enrich runs on it too), so rust's count is 25. Terminality anywhere in these diagnostics is `dsl/rule-patterns.ts::parserSymbolClassOf`, the predicate the alias-identity branch anchored against parser.c; never re-derive it.
- A blocking diagnostic is `canProceed: false`; the accepted floor for a code is the grammar's own `expectDiagnostics:` block, keyed by code then owner kind, and it only shrinks.
- Gate for every task: `pnpm run type-check` green; `pnpm exec vitest run packages/codegen` green (run vitest as its own shell call); `env -u SITTIR_NATIVE_DEBUG pnpm run validate:native` rows unchanged from the last recorded run (`pnpm exec tsx packages/cli/src/cli.ts validate history 6`).
- Workflow: work in a worktree (`git worktree add /tmp/<wt> -b <branch> origin/<base>` with `node_modules` symlinked in, or the pre-commit hook fails); pathspec commits only; never `--no-verify`.
- Dependencies on the alias-identity plan (`docs/superpowers/plans/2026-09-22-alias-identity.md`): the `rule(name, body)` placeholder (its Task 3) and the retirement of four hand rules (its Task 7). Task 6 here tests the `rule` placeholder form against a synthetic placeholder object and goes live when Task 3 lands; the migration of new helper rules to `rule()` patches is **not** in this plan and is listed under Out of scope.

## Review Focus

1. A `rules:` entry whose declared cause is `'ambiguity'` but whose name matches no upstream rule (a new rule wrongly declared as a replacement): expected `rule-cause-mismatch`, not silence. Pinned in Task 3.
2. A grammar whose upstream compile throws (not merely reports): expected a single `upstream-compile-failed` diagnostic and no `rule-reauthored-without-cause` judgements, never a crash of the main compile. Pinned in Task 2.
3. A `renderOnly` rule naming an external that the grammar's `externals` list spells with a different visibility (`_template_chars` vs `template_chars`): expected the check to compare against the externals list as evaluated, so the current three typescript externals pass. Pinned in Task 3.
4. A flipped shape code whose owner kind is in the floor for a *different* code: expected still blocking (floors are per code). Pinned in Task 5.
5. The hand-rule ratchet when a grammar file declares the same rule name twice (an object literal with a duplicate key keeps the last): expected the count to reflect the evaluated entries, so the ceiling cannot be gamed by shadowing. Pinned in Task 7.

## File map

| file | responsibility |
| --- | --- |
| `packages/codegen/src/dsl/primitives/rule-cause.ts` (new) | `reauthored`, `vocabulary`, `renderOnly` wrappers; `RuleCause`, `RuleCauseDeclaration`; `ruleCauseOf(fn)` |
| `packages/codegen/src/dsl/index.ts` | exports the three wrappers |
| `packages/codegen/src/dsl/wire/wire.ts` | `WireContext.ruleCauses`, `WireContext.patchSites`; collected in `wire()` and `resolvePatch` |
| `packages/codegen/src/dsl/transform/transform.ts` | `resolvePatch` records each placeholder application (`wireRecordPatchSite`) |
| `packages/codegen/src/compiler/evaluate.ts` | `drainRuleCausesMetadata`, `drainPatchSitesMetadata`; `RawGrammar.ruleCauses`, `RawGrammar.patchSites` |
| `packages/codegen/src/compiler/types.ts` | the two new `RawGrammar` fields and their types |
| `packages/codegen/src/compiler/upstream.ts` (new) | `compileUpstream(grammar)`: the enriched base with no wire config, through `collectGrammarDiagnosticsForGrammar` |
| `packages/codegen/src/compiler/resolve-grammar.ts` | `resolveUpstreamGrammarJsPath(grammar)` |
| `packages/codegen/src/compiler/diagnostics/rule-causes.ts` (new) | `diagnoseRuleCauses`, `PROVOKING_CODES`, the five rule-cause codes |
| `packages/codegen/src/compiler/diagnostics/patch-sites.ts` (new) | `labelPatchSites`, `patch-without-cause` |
| `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` | blocking set gains the three collect-slots codes; `multi-slot-nested-seq` floor exception; messages name the resolving form |
| `packages/codegen/src/compiler/diagnostics/slot-grouping.ts` | `multi-slot-nested-seq` produces `canProceed: false` |
| `packages/codegen/src/compiler/collect-slots.ts` | the three assemble-warning messages name their resolving form |
| `packages/codegen/src/compiler/compile.ts` | `compileGrammar` runs the upstream compile and folds rule-cause and patch-site diagnostics in |
| `packages/tools/src/discover/override-census.ts` (new), `packages/cli/src/commands/tool/override-census.ts` (new) | the census tool |
| `packages/cli/src/commands/tool/grammar-diagnostics.ts` | `--upstream` flag |
| `packages/codegen/src/__tests__/hand-rule-ratchet.test.ts` (new) | the ceilings |
| `packages/{typescript,rust,python}/grammar.sittir.ts` | every `rules:` entry wrapped; `expectDiagnostics:` floors |
| `docs/glossary/dsl-primitives.md`, `docs/glossary/dsl-wire.md`, `docs/glossary/compiler.md`, `docs/glossary/compiler-diagnostics.md`, `docs/glossary/tools.md` | entries for every new declaration |

---

### Task 1: Rule-cause declarations reach `RawGrammar`

**Files:**
- Create: `packages/codegen/src/dsl/primitives/rule-cause.ts`
- Modify: `packages/codegen/src/dsl/index.ts` (add three exports)
- Modify: `packages/codegen/src/dsl/wire/wire.ts:34-55` (`WireContext`), `:303-323` (`context` literal)
- Modify: `packages/codegen/src/compiler/evaluate.ts:366-404` (drain + `grammarResult`), `:582-591` (beside `drainExpectDiagnosticsMetadata`)
- Modify: `packages/codegen/src/compiler/types.ts:84-110` (`RawGrammar`)
- Modify: `packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts:120-170` (`ALLOWED`)
- Test: `packages/codegen/src/dsl/__tests__/rule-cause.test.ts` (new), `packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts` (new)

**Interfaces:**
- Consumes: `RuleFn = ($: unknown, previous?: unknown) => unknown` as `wire.ts` types `cfg.rules` values; `WireContext`; `getWireContext(opts)` in evaluate.
- Produces:
  ```ts
  export type RuleCause = 'lexical-interior' | 'alias-shape' | 'ambiguity';
  export type RuleCauseDeclaration =
    | { readonly kind: 'reauthored'; readonly cause: RuleCause }
    | { readonly kind: 'vocabulary' }
    | { readonly kind: 'renderOnly' };
  export function reauthored<F extends Function>(cause: RuleCause, body: F): F;
  export function vocabulary<F extends Function>(body: F): F;
  export function renderOnly<F extends Function>(body: F): F;
  export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined;
  ```
  `WireContext.ruleCauses: ReadonlyMap<string, RuleCauseDeclaration>` (only declared entries), `WireContext.undeclaredRules: ReadonlySet<string>` (bare bodies). `RawGrammar.ruleCauses?: Readonly<Record<string, RuleCauseDeclaration>>`, `RawGrammar.undeclaredRules?: readonly string[]`.

- [ ] **Step 1: Write the failing primitive test**

`packages/codegen/src/dsl/__tests__/rule-cause.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { reauthored, vocabulary, renderOnly, ruleCauseOf } from '../primitives/rule-cause.ts';

describe('rule-cause declarations', () => {
	it('reauthored tags the function with its cause and returns the same function', () => {
		const body = ($: unknown) => $;
		const tagged = reauthored('ambiguity', body);
		expect(tagged).toBe(body);
		expect(ruleCauseOf(tagged)).toEqual({ kind: 'reauthored', cause: 'ambiguity' });
	});

	it('vocabulary and renderOnly tag without a cause', () => {
		expect(ruleCauseOf(vocabulary(() => 1))).toEqual({ kind: 'vocabulary' });
		expect(ruleCauseOf(renderOnly(() => 1))).toEqual({ kind: 'renderOnly' });
	});

	it('an untagged function has no declaration', () => {
		expect(ruleCauseOf(() => 1)).toBeUndefined();
		expect(ruleCauseOf(undefined)).toBeUndefined();
	});

	it('the tag is not enumerable, so spreading the rules map keeps functions plain', () => {
		const tagged = reauthored('lexical-interior', () => 1);
		expect(Object.keys(tagged)).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/rule-cause.test.ts`
Expected: FAIL, module `../primitives/rule-cause.ts` not found.

- [ ] **Step 3: Write the primitive**

`packages/codegen/src/dsl/primitives/rule-cause.ts`:

```ts
export type RuleCause = 'lexical-interior' | 'alias-shape' | 'ambiguity';

export type RuleCauseDeclaration =
	| { readonly kind: 'reauthored'; readonly cause: RuleCause }
	| { readonly kind: 'vocabulary' }
	| { readonly kind: 'renderOnly' };

const RULE_CAUSE = Symbol.for('sittir.ruleCause');

function tag<F>(body: F, declaration: RuleCauseDeclaration): F {
	Object.defineProperty(body, RULE_CAUSE, { value: declaration, enumerable: false, writable: false });
	return body;
}

export function reauthored<F extends (...args: never[]) => unknown>(cause: RuleCause, body: F): F {
	return tag(body, { kind: 'reauthored', cause });
}

export function vocabulary<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'vocabulary' });
}

export function renderOnly<F extends (...args: never[]) => unknown>(body: F): F {
	return tag(body, { kind: 'renderOnly' });
}

export function ruleCauseOf(fn: unknown): RuleCauseDeclaration | undefined {
	if (typeof fn !== 'function') return undefined;
	return (fn as unknown as Record<symbol, RuleCauseDeclaration | undefined>)[RULE_CAUSE];
}
```

Add to `packages/codegen/src/dsl/index.ts` after the `field` export:

```ts
export { reauthored, vocabulary, renderOnly } from './primitives/rule-cause.ts';
export type { RuleCause, RuleCauseDeclaration } from './primitives/rule-cause.ts';
```

- [ ] **Step 4: Run the primitive test**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/rule-cause.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing evaluate test**

`packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts`. Model it on how `packages/codegen/src/dsl/__tests__/wire.test.ts` builds a `wire({...}, base)` config and how `packages/codegen/src/compiler/__tests__/evaluate.test.ts` evaluates one; read both first (the helper names below are the ones those files use, copy their import lines verbatim):

```ts
import { describe, expect, it } from 'vitest';
import { wire } from '../../dsl/wire/wire.ts';
import { reauthored, vocabulary, renderOnly } from '../../dsl/primitives/rule-cause.ts';
import { evaluateWiredGrammar } from './_helpers/evaluate-wired.ts';

describe('evaluate carries rule-cause declarations', () => {
	it('drains declared causes and lists bare bodies as undeclared', async () => {
		const base = {
			name: 'synth',
			rules: {
				a: ($: any) => $.b,
				b: (_$: any) => 'x',
				c: (_$: any) => 'y'
			},
			externals: ['_ext']
		};
		const raw = await evaluateWiredGrammar(
			wire(
				{
					rules: {
						a: reauthored('ambiguity', ($: any, _prev: unknown) => $.b),
						_ws: vocabulary((_$: any) => 'w'),
						_ext: renderOnly((_$: any) => 'e'),
						c: (_$: any) => 'z'
					}
				},
				base as never
			),
			base as never
		);
		expect(raw.ruleCauses).toEqual({
			a: { kind: 'reauthored', cause: 'ambiguity' },
			_ws: { kind: 'vocabulary' },
			_ext: { kind: 'renderOnly' }
		});
		expect(raw.undeclaredRules).toEqual(['c']);
	});
});
```

`_helpers/evaluate-wired.ts` is a 10-line helper that wraps whatever `evaluate.test.ts` already does to evaluate an in-memory `grammar(base, wired)`; if that file evaluates through a temp module path, do the same here. Create it in this step.

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts`
Expected: FAIL, `raw.ruleCauses` is `undefined`.

- [ ] **Step 7: Collect in wire, drain in evaluate**

`wire.ts`, in `WireContext` after `authoredRuleNames`:

```ts
	readonly ruleCauses: ReadonlyMap<string, RuleCauseDeclaration>;
	readonly undeclaredRules: ReadonlySet<string>;
```

In `wire()`, before the `context` literal:

```ts
	const ruleCauses = new Map<string, RuleCauseDeclaration>();
	const undeclaredRules = new Set<string>();
	for (const [name, fn] of Object.entries(cfg.rules ?? {})) {
		const declaration = ruleCauseOf(fn);
		if (declaration === undefined) undeclaredRules.add(name);
		else ruleCauses.set(name, declaration);
	}
```

and in the literal: `ruleCauses, undeclaredRules,`. Import `ruleCauseOf` and the type from `../primitives/rule-cause.ts`.

`evaluate.ts`, beside `drainExpectDiagnosticsMetadata`:

```ts
function drainRuleCausesMetadata(opts: GrammarOptions): {
	ruleCauses: Record<string, RuleCauseDeclaration> | undefined;
	undeclaredRules: readonly string[] | undefined;
} {
	const wireCtx = getWireContext(opts);
	if (!wireCtx) return { ruleCauses: undefined, undeclaredRules: undefined };
	const ruleCauses = Object.fromEntries(wireCtx.ruleCauses);
	const undeclaredRules = [...wireCtx.undeclaredRules].sort();
	return {
		ruleCauses: Object.keys(ruleCauses).length > 0 ? ruleCauses : undefined,
		undeclaredRules: undeclaredRules.length > 0 ? undeclaredRules : undefined
	};
}
```

In the drain block: `const { ruleCauses, undeclaredRules } = drainRuleCausesMetadata(opts);` and add `ruleCauses, undeclaredRules,` to `grammarResult`. In `types.ts` `RawGrammar`:

```ts
	readonly ruleCauses?: Readonly<Record<string, RuleCauseDeclaration>>;
	readonly undeclaredRules?: readonly string[];
```

Add `'ruleCauses'` and `'undeclaredRules'` to the `ALLOWED` set in `post-evaluate-invariant.test.ts`.

- [ ] **Step 8: Run both tests and the codegen suite**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`
Expected: PASS.
Run: `pnpm run type-check`
Expected: green.

- [ ] **Step 9: Glossary and commit**

Add entries to `docs/glossary/dsl-primitives.md` (`rule-cause.ts::reauthored`, `::vocabulary`, `::renderOnly`, `::ruleCauseOf`: what each declares, that the tag is a non-enumerable symbol so the function stays a plain `RuleFn`), `docs/glossary/dsl-wire.md` (`WireContext.ruleCauses`, `WireContext.undeclaredRules`), `docs/glossary/compiler.md` (`evaluate.ts::drainRuleCausesMetadata`, `types.ts::RawGrammar.ruleCauses`, `::undeclaredRules`).

```bash
git add -- packages/codegen/src/dsl/primitives/rule-cause.ts packages/codegen/src/dsl/__tests__/rule-cause.test.ts packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts packages/codegen/src/compiler/__tests__/_helpers/evaluate-wired.ts
git commit -m "feat(dsl): rule-cause declarations (reauthored / vocabulary / renderOnly) reach RawGrammar" -- packages/codegen/src/dsl/primitives/rule-cause.ts packages/codegen/src/dsl/index.ts packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/compiler/evaluate.ts packages/codegen/src/compiler/types.ts packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts packages/codegen/src/dsl/__tests__/rule-cause.test.ts packages/codegen/src/compiler/__tests__/evaluate-rule-causes.test.ts packages/codegen/src/compiler/__tests__/_helpers/evaluate-wired.ts docs/glossary/dsl-primitives.md docs/glossary/dsl-wire.md docs/glossary/compiler.md
```

---

### Task 2: The upstream compile

**Files:**
- Create: `packages/codegen/src/compiler/upstream.ts`
- Modify: `packages/codegen/src/compiler/resolve-grammar.ts` (add `resolveUpstreamGrammarJsPath`)
- Modify: `packages/codegen/src/compiler/evaluate.ts` (export the options-level entry if `evaluate` is monolithic; see Step 3)
- Modify: `packages/cli/src/commands/tool/grammar-diagnostics.ts` (`--upstream`)
- Test: `packages/codegen/src/compiler/__tests__/upstream.test.ts` (new), `packages/cli/tests/commands/tool/grammar-diagnostics.test.ts`

**Interfaces:**
- Consumes: `enrich(base)` from `dsl/enrich.ts`; `collectGrammarDiagnosticsForGrammar`; `resolveGrammarJsPath`.
- Produces:
  ```ts
  export interface UpstreamCompilation {
    readonly grammar: string;
    readonly ruleNames: ReadonlySet<string>;      // upstream rule names, before enrich
    readonly externalNames: ReadonlySet<string>;  // upstream externals, as spelled in the grammar
    readonly diagnostics: readonly GrammarDiagnostic[];
    readonly failure?: string;                    // message when the compile threw
  }
  export async function compileUpstream(grammar: string): Promise<UpstreamCompilation>;
  export function resolveUpstreamGrammarJsPath(grammar: string): string;
  ```

- [ ] **Step 1: Write the failing test**

`packages/codegen/src/compiler/__tests__/upstream.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compileUpstream, resolveUpstreamGrammarJsPath } from '../upstream.ts';

describe('upstream compile', () => {
	it('resolves each grammar to the tree-sitter package grammar.js', () => {
		expect(resolveUpstreamGrammarJsPath('rust')).toMatch(/tree-sitter-rust[\\/].*grammar\.js$/);
		expect(resolveUpstreamGrammarJsPath('typescript')).toMatch(/tree-sitter-typescript[\\/]typescript[\\/]grammar\.js$/);
		expect(resolveUpstreamGrammarJsPath('python')).toMatch(/tree-sitter-python[\\/].*grammar\.js$/);
	});

	it('compiles the enriched python base with no wire config and reports rule names', async () => {
		const upstream = await compileUpstream('python');
		expect(upstream.failure).toBeUndefined();
		expect(upstream.ruleNames.has('primary_expression')).toBe(true);
		expect(upstream.ruleNames.has('_whitespace')).toBe(false);
		expect(upstream.externalNames.has('_indent')).toBe(true);
		expect(Array.isArray(upstream.diagnostics)).toBe(true);
	}, 60_000);

	it('turns a throwing compile into a failure record instead of throwing', async () => {
		const upstream = await compileUpstream('no-such-grammar');
		expect(upstream.failure).toMatch(/no-such-grammar/);
		expect(upstream.diagnostics).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/upstream.test.ts`
Expected: FAIL, `../upstream.ts` not found.

- [ ] **Step 3: Find the options-level evaluate entry**

Run: `sed -n '280,360p' packages/codegen/src/compiler/evaluate.ts`
Locate the function that receives the already-loaded `GrammarOptions` (the object `grammar(...)` returns) and runs the pass that ends in `grammarResult`. If `evaluate(entryPath)` loads the module and then calls such a function, export it as `evaluateGrammarOptions(opts: GrammarOptions, name?: string): RawGrammar` (a rename of an existing internal is fine; no behaviour change). If `evaluate` is monolithic, split it at the point where the module's default export is in hand: `evaluate(entryPath)` becomes `evaluateGrammarOptions(await loadGrammarModule(entryPath))`. The `packages/codegen` suite is the byte-identity gate for the split.

- [ ] **Step 4: Write the resolver and the upstream compile**

`resolve-grammar.ts`:

```ts
const UPSTREAM_GRAMMAR_JS: Readonly<Record<string, string>> = {
	rust: 'tree-sitter-rust/grammar.js',
	typescript: 'tree-sitter-typescript/typescript/grammar.js',
	python: 'tree-sitter-python/grammar.js'
};

export function resolveUpstreamGrammarJsPath(grammar: string): string {
	const spec = UPSTREAM_GRAMMAR_JS[grammar];
	if (spec === undefined) throw new Error(`resolveUpstreamGrammarJsPath: no upstream grammar registered for '${grammar}'`);
	return createRequire(resolveOverridesPath(grammar)).resolve(spec);
}
```

(`createRequire` from `node:module`; resolving relative to the grammar package's own `grammar.sittir.ts` picks the same pnpm instance that file imports.)

`upstream.ts`:

```ts
import { pathToFileURL } from 'node:url';
import { enrich } from '../dsl/enrich.ts';
import { evaluateGrammarOptions } from './evaluate.ts';
import { resolveUpstreamGrammarJsPath } from './resolve-grammar.ts';
import { collectGrammarDiagnosticsForGrammar } from './diagnostics/grammar-diagnostics.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';

export interface UpstreamCompilation {
	readonly grammar: string;
	readonly ruleNames: ReadonlySet<string>;
	readonly externalNames: ReadonlySet<string>;
	readonly diagnostics: readonly GrammarDiagnostic[];
	readonly failure?: string;
}

export async function compileUpstream(grammar: string): Promise<UpstreamCompilation> {
	try {
		const path = resolveUpstreamGrammarJsPath(grammar);
		const base = (await import(pathToFileURL(path).href)).default;
		const rules = (base.grammar?.rules ?? base.rules ?? {}) as Record<string, unknown>;
		const externals = ((base.grammar?.externals ?? base.externals ?? []) as { name?: string }[])
			.map((e) => (typeof e === 'string' ? e : e.name))
			.filter((n): n is string => typeof n === 'string');
		const raw = evaluateGrammarOptions(enrich(base), grammar);
		const { diagnostics } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		return { grammar, ruleNames: new Set(Object.keys(rules)), externalNames: new Set(externals), diagnostics };
	} catch (error) {
		return {
			grammar,
			ruleNames: new Set(),
			externalNames: new Set(),
			diagnostics: [],
			failure: `${grammar}: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}
```

If the base module's shape differs from `base.grammar.rules` / `base.rules` (check with `node -e "import('<path>').then(m => console.log(Object.keys(m.default)))"`), read the rule and external names the way `wire.ts::knownRuleNames` and `baseExternalNames` do and reuse those helpers instead of the inline access.

- [ ] **Step 5: Run the test**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/upstream.test.ts`
Expected: PASS. If the python upstream compile records `failure`, that is a finding: paste the message into the PR, and fix the throw at its source (a throw in link/normalize/assemble on a shape the overrides usually remove is exactly a missing diagnostic); do not catch it away.

- [ ] **Step 6: Record what the three upstream compiles report**

Run, for each grammar:
`pnpm exec tsx -e "import('./packages/codegen/src/compiler/upstream.ts').then(m => m.compileUpstream('rust')).then(u => console.log(JSON.stringify({failure: u.failure, codes: [...new Set(u.diagnostics.map(d => d.code + ' ' + (d.canProceed === false ? 'BLOCK' : 'ok')))]}, null, 1)))"`
Paste the three outputs into the PR description. This is the raw material for Task 3's provocation table and Task 4's floors.

- [ ] **Step 7: `--upstream` on the tool**

In `packages/cli/src/commands/tool/grammar-diagnostics.ts` add `.option('--upstream', 'diagnose the enriched upstream base with no wire config')`; when set, the action calls `compileUpstream(grammar)` and prints its diagnostics through the same formatter the command already uses (`formatCompilerDiagnostics` or the JSON path, whichever the flag set selects), plus `failure` on stderr with exit code 2 when present. Add one test to `packages/cli/tests/commands/tool/grammar-diagnostics.test.ts` mirroring the existing one: parse `['grammar-diagnostics', '--grammar', 'rust', '--upstream']` and assert the mocked runner received `upstream: true`.

- [ ] **Step 8: Gate and commit**

Run: `pnpm run type-check`; then `pnpm exec vitest run packages/codegen packages/cli`
Expected: green.

Glossary: `docs/glossary/compiler.md` (`upstream.ts::compileUpstream`, `resolve-grammar.ts::resolveUpstreamGrammarJsPath`, `evaluate.ts::evaluateGrammarOptions` if new), `docs/glossary/tools.md` (`grammar-diagnostics --upstream`).

```bash
git add -- packages/codegen/src/compiler/upstream.ts packages/codegen/src/compiler/__tests__/upstream.test.ts
git commit -m "feat(compiler): compile the enriched upstream base with no wire config" -- packages/codegen/src/compiler/upstream.ts packages/codegen/src/compiler/resolve-grammar.ts packages/codegen/src/compiler/evaluate.ts packages/codegen/src/compiler/__tests__/upstream.test.ts packages/cli/src/commands/tool/grammar-diagnostics.ts packages/cli/tests/commands/tool/grammar-diagnostics.test.ts docs/glossary/compiler.md docs/glossary/tools.md
```

---

### Task 3: `diagnoseRuleCauses`

**Files:**
- Create: `packages/codegen/src/compiler/diagnostics/rule-causes.ts`
- Modify: `packages/codegen/src/compiler/compile.ts:34-65` (`compileGrammar`)
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts` (new)

**Interfaces:**
- Consumes: `RawGrammar.ruleCauses`, `RawGrammar.undeclaredRules`, `RawGrammar.externals`; `UpstreamCompilation` (Task 2).
- Produces:
  ```ts
  export const PROVOKING_CODES: Readonly<Record<RuleCause, readonly string[]>>;
  export function diagnoseRuleCauses(input: {
    grammar: string;
    ruleCauses: Readonly<Record<string, RuleCauseDeclaration>> | undefined;
    undeclaredRules: readonly string[] | undefined;
    externals: readonly string[];
    upstream: UpstreamCompilation;
  }): GrammarDiagnostic[];
  ```
  Codes: `rule-cause-missing` (a bare body that replaces an upstream rule or re-authors an external; blocking), `rule-undeclared-helper` (a bare body that is a new rule; warning, `canProceed: true`, until the alias plan's `rule()` migration flips it), `rule-reauthored-without-cause` (blocking), `rule-cause-mismatch` (blocking), `render-only-not-external` (blocking), `vocabulary-replaces-upstream` (blocking), `upstream-compile-failed` (warning, once, no judgements made).

- [ ] **Step 1: Write the failing test**

`packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { diagnoseRuleCauses } from '../rule-causes.ts';
import type { UpstreamCompilation } from '../../upstream.ts';
import type { GrammarDiagnostic } from '../../../types/diagnostics.ts';

function upstream(partial: Partial<UpstreamCompilation>): UpstreamCompilation {
	return { grammar: 'synth', ruleNames: new Set(), externalNames: new Set(), diagnostics: [], ...partial };
}
function blocking(code: string, ownerKind: string): GrammarDiagnostic {
	return { scope: 'grammar', grammar: 'synth', code, severity: 'error', ownerKind, message: '', canProceed: false };
}
const codesOf = (ds: readonly GrammarDiagnostic[]) => ds.map((d) => `${d.code}:${d.ownerKind}`).sort();

describe('diagnoseRuleCauses', () => {
	it('a reauthored rule provoked by a blocking upstream diagnostic of its cause class is silent', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { a: { kind: 'reauthored', cause: 'alias-shape' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ ruleNames: new Set(['a']), diagnostics: [blocking('unclassifiable-shape', 'a')] })
		});
		expect(ds).toEqual([]);
	});

	it('a reauthored rule with no blocking upstream diagnostic is rule-reauthored-without-cause', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ ruleNames: new Set(['a']) })
		});
		expect(codesOf(ds)).toEqual(['rule-reauthored-without-cause:a']);
		expect(ds[0]!.canProceed).toBe(false);
	});

	it('a provoked rule whose declared cause does not match the provoking code is rule-cause-mismatch', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { a: { kind: 'reauthored', cause: 'lexical-interior' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ ruleNames: new Set(['a']), diagnostics: [blocking('unclassifiable-shape', 'a')] })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:a']);
	});

	it('a reauthored declaration on a name upstream does not have is rule-cause-mismatch', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { brand_new: { kind: 'reauthored', cause: 'ambiguity' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ ruleNames: new Set(['a']) })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-mismatch:brand_new']);
	});

	it('renderOnly must name an external, compared against the evaluated externals list', () => {
		const ok = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { _template_chars: { kind: 'renderOnly' } },
			undeclaredRules: undefined,
			externals: ['_template_chars'],
			upstream: upstream({})
		});
		expect(ok).toEqual([]);
		const bad = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { string: { kind: 'renderOnly' } },
			undeclaredRules: undefined,
			externals: ['_template_chars'],
			upstream: upstream({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(bad)).toEqual(['render-only-not-external:string']);
	});

	it('vocabulary must not shadow an upstream rule', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { string: { kind: 'vocabulary' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(ds)).toEqual(['vocabulary-replaces-upstream:string']);
	});

	it('bare bodies: replacing or external → rule-cause-missing (blocking); new → rule-undeclared-helper (warning)', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: undefined,
			undeclaredRules: ['string', '_ext', 'helper'],
			externals: ['_ext'],
			upstream: upstream({ ruleNames: new Set(['string']) })
		});
		expect(codesOf(ds)).toEqual(['rule-cause-missing:_ext', 'rule-cause-missing:string', 'rule-undeclared-helper:helper']);
		expect(ds.find((d) => d.ownerKind === 'helper')!.canProceed).toBe(true);
		expect(ds.find((d) => d.ownerKind === 'string')!.canProceed).toBe(false);
	});

	it('an upstream failure yields one warning and no judgements', () => {
		const ds = diagnoseRuleCauses({
			grammar: 'synth',
			ruleCauses: { a: { kind: 'reauthored', cause: 'ambiguity' } },
			undeclaredRules: undefined,
			externals: [],
			upstream: upstream({ failure: 'synth: boom' })
		});
		expect(codesOf(ds)).toEqual(['upstream-compile-failed:undefined']);
		expect(ds[0]!.canProceed).toBe(true);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the module**

`packages/codegen/src/compiler/diagnostics/rule-causes.ts`:

```ts
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RuleCause, RuleCauseDeclaration } from '../../dsl/primitives/rule-cause.ts';
import type { UpstreamCompilation } from '../upstream.ts';

export const PROVOKING_CODES: Readonly<Record<RuleCause, readonly string[]>> = {
	'lexical-interior': ['token-interior-opaque', 'kindid-unstamped-anon-literal'],
	'alias-shape': ['alias-distributed', 'display-union-mixed', 'unclassifiable-shape', 'union-slot-routed', 'union-slot-mixed-row', 'multi-slot-nested-seq', 'parsekind-noninjective'],
	ambiguity: ['parser-generation-failed', 'corpus-divergence']
};

function diagnostic(
	grammar: string,
	code: string,
	ownerKind: string | undefined,
	message: string,
	canProceed: boolean,
	details?: Record<string, unknown>
): GrammarDiagnostic {
	return { scope: 'grammar', grammar, code, severity: canProceed ? 'warning' : 'error', ownerKind, message, canProceed, details };
}

export function diagnoseRuleCauses(input: {
	grammar: string;
	ruleCauses: Readonly<Record<string, RuleCauseDeclaration>> | undefined;
	undeclaredRules: readonly string[] | undefined;
	externals: readonly string[];
	upstream: UpstreamCompilation;
}): GrammarDiagnostic[] {
	const { grammar, upstream } = input;
	const out: GrammarDiagnostic[] = [];
	if (upstream.failure !== undefined) {
		out.push(diagnostic(grammar, 'upstream-compile-failed', undefined, `the upstream compile did not complete, so no hand-written rule was judged: ${upstream.failure}`, true));
		return out;
	}
	const externals = new Set(input.externals);
	const blockingByOwner = new Map<string, string[]>();
	for (const d of upstream.diagnostics) {
		if (d.canProceed !== false || d.ownerKind === undefined) continue;
		blockingByOwner.set(d.ownerKind, [...(blockingByOwner.get(d.ownerKind) ?? []), d.code]);
	}

	for (const name of input.undeclaredRules ?? []) {
		if (upstream.ruleNames.has(name) || externals.has(name)) {
			out.push(diagnostic(grammar, 'rule-cause-missing', name, `rules: '${name}' ${externals.has(name) ? 're-authors an external' : 'replaces an upstream rule'} with a bare body; wrap it in reauthored(cause, body) or renderOnly(body)`, false));
		} else {
			out.push(diagnostic(grammar, 'rule-undeclared-helper', name, `rules: '${name}' is a new helper with a bare body; mint it at its use site with rule('${name}', body) in patches:`, true));
		}
	}

	for (const [name, declaration] of Object.entries(input.ruleCauses ?? {})) {
		switch (declaration.kind) {
			case 'vocabulary':
				if (upstream.ruleNames.has(name)) out.push(diagnostic(grammar, 'vocabulary-replaces-upstream', name, `rules: '${name}' is declared vocabulary but replaces an upstream rule of the same name`, false));
				break;
			case 'renderOnly':
				if (!externals.has(name)) out.push(diagnostic(grammar, 'render-only-not-external', name, `rules: '${name}' is declared renderOnly but is not an external of this grammar`, false));
				break;
			case 'reauthored': {
				if (!upstream.ruleNames.has(name)) {
					out.push(diagnostic(grammar, 'rule-cause-mismatch', name, `rules: '${name}' is declared reauthored('${declaration.cause}') but upstream has no rule of that name`, false));
					break;
				}
				const provoking = blockingByOwner.get(name) ?? [];
				if (provoking.length === 0) {
					out.push(diagnostic(grammar, 'rule-reauthored-without-cause', name, `rules: '${name}' replaces the upstream rule, but the upstream shape compiles with no blocking diagnostic; the replacement is unjustified (declared cause '${declaration.cause}')`, false, { cause: declaration.cause }));
					break;
				}
				const accepted = PROVOKING_CODES[declaration.cause];
				const matched = provoking.filter((code) => accepted.includes(code));
				if (matched.length === 0) {
					out.push(diagnostic(grammar, 'rule-cause-mismatch', name, `rules: '${name}' is declared reauthored('${declaration.cause}') but the upstream shape is provoked by [${provoking.join(', ')}], none of which belongs to that cause`, false, { cause: declaration.cause, provoking }));
				}
				break;
			}
		}
	}
	return out;
}
```

`PROVOKING_CODES` starts with the codes that exist or are specified today; Task 4 replaces any placeholder name (`token-interior-opaque`, `parser-generation-failed`, `corpus-divergence`) with the real code the upstream compile reported in Task 2 Step 6, or deletes it. `'lexical-interior'` and `'alias-shape'` must keep at least one code each (a module-load check throws otherwise, so the table cannot silently go dark); `'ambiguity'` may end up empty, because a parser-generation or corpus provocation is invisible to the compile, and an `'ambiguity'` rule is then expected to land on the grammar's `rule-reauthored-without-cause` floor with its glossary line saying so.

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Fold into `compileGrammar`**

In `compile.ts::compileGrammar`, after `collectGrammarDiagnosticsForGrammar`:

```ts
	const ruleCauseDiagnostics =
		raw.ruleCauses === undefined && raw.undeclaredRules === undefined
			? []
			: diagnoseRuleCauses({
					grammar: cfg.grammar,
					ruleCauses: raw.ruleCauses,
					undeclaredRules: raw.undeclaredRules,
					externals: raw.externals,
					upstream: await compileUpstream(cfg.grammar)
				});
```

and spread it into `grammarDiagnostics`. A grammar with no `rules:` block (the synthetic test grammars) never pays for the upstream compile.

- [ ] **Step 6: Observe the three grammars**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics --grammar typescript 2>&1 | grep -E "rule-cause|rule-reauthored|rule-undeclared|render-only|vocabulary-replaces|upstream-compile"` and the same for rust and python.
Expected at this point: every `rules:` entry is a bare body, so `rule-cause-missing` fires for the 29 replacements and 10 externals (blocking) and `rule-undeclared-helper` for the 26 new rules. Regen would now be red; that is the intended state between Task 3 and Task 4, and the two tasks land in one PR. Do not add an `allowDiagnostics` bypass.

- [ ] **Step 7: Commit**

Glossary: `docs/glossary/compiler-diagnostics.md` (`rule-causes.ts::diagnoseRuleCauses`, `::PROVOKING_CODES`, each code's meaning and resolving action), `docs/glossary/compiler.md` (`compile.ts::compileGrammar` gains the upstream step).

```bash
git add -- packages/codegen/src/compiler/diagnostics/rule-causes.ts packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts
git commit -m "feat(diagnostics): hand-written rules are judged against the upstream compile" -- packages/codegen/src/compiler/diagnostics/rule-causes.ts packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts packages/codegen/src/compiler/compile.ts docs/glossary/compiler-diagnostics.md docs/glossary/compiler.md
```

---

### Task 4: Migrate the three grammar files

**Files:**
- Modify: `packages/typescript/grammar.sittir.ts:12` (import), `:722-` (`rules:`), `expectDiagnostics:` block
- Modify: `packages/rust/grammar.sittir.ts` (`rules:` from line 511; `expectDiagnostics:`)
- Modify: `packages/python/grammar.sittir.ts` (`rules:` from line 344; `expectDiagnostics:`)
- Modify: `packages/codegen/src/compiler/diagnostics/rule-causes.ts` (`PROVOKING_CODES` final contents)
- Modify: `docs/typescript-grammar-sittir-glossary.md`, `docs/rust-grammar-sittir-glossary.md`, `docs/python-grammar-sittir-glossary.md`
- Test: the generated output (byte identity) and `tool grammar-diagnostics` per grammar

**Interfaces:**
- Consumes: `reauthored`, `vocabulary`, `renderOnly` from `../codegen/src/dsl/index.ts`; Task 2 Step 6's per-grammar upstream codes.
- Produces: the declared `rules:` blocks; per-grammar `expectDiagnostics` floors for `rule-reauthored-without-cause` where the census finds a replacement the compiler cannot yet provoke.

- [ ] **Step 1: Wrap every entry**

For each grammar file, extend the import to include `reauthored, vocabulary, renderOnly`, then wrap each `rules:` entry per this table (from the census in the spec; verify each name against `tool grammar-diagnostics --upstream`'s rule list):

typescript (15): `_whitespace` → `vocabulary`; `html_comment`, `jsx_text`, `_template_chars` → `renderOnly`; `string`, `template_string`, `template_literal_type`, `template_type`, `template_substitution` → `reauthored('lexical-interior', …)`; `_reserved_identifier` → `reauthored('alias-shape', …)` (`extends_clause` is retired into two `alias()` patches); `arrow_function`, `object_type` → `reauthored('ambiguity', …)` (`class_body` is retired into an `alias('empty_member')` patch); `ambient_declaration_global`, `ambient_declaration_module`, `object_type_content` → left bare (new helpers; `rule-undeclared-helper`, warning).

rust (26): `_whitespace` → `vocabulary`; `float_literal`, `string_content`, `raw_string_literal_content`, `_outer_block_doc_comment_marker`, `_inner_block_doc_comment_marker`, `_line_doc_content`, `_block_comment_content` → `renderOnly`; `string_literal`, `_inner_line_doc_comment_marker` → `reauthored('lexical-interior', …)`; `tuple_type`, `tuple_expression`, `_non_special_token`, `_non_delim_token`, `_let_chain` → `reauthored('alias-shape', …)`; `reference_expression`, `impl_item` → `reauthored('ambiguity', …)`; the ten new helpers (`_tuple_type_elements`, `_tuple_expression_elements`, `_token_tree_punctuation`, `_token_keywords`, `where_predicates`, `_wildcard_pattern`, `_range_expression_bare`, `_string_literal_open`, `_impl_item_unsafe_marker`) left bare.

python (22): `_whitespace` → `vocabulary`; `string_content`, `format_specifier` → `reauthored('lexical-interior', …)`; `case_pattern`, `list_comprehension`, `dictionary_comprehension`, `set_comprehension`, `generator_expression`, `print_statement`, `_simple_pattern` → `reauthored('alias-shape', …)`; `primary_expression` → `reauthored('ambiguity', …)`; the twelve new helpers left bare.

Causes established by the alias-shape retirement (each rule was tried as enrich plus a patch; the trial moved the output as stated). Use these texts in the `reauthored(…)` declarations:
- typescript `arrow_function`: a patch cannot replace a site with a different symbol reference (`_call_signature` → `call_signature`).
- python `string_content`: retiring it lets enrich infer an `elements` field the upstream shape lacks (a parser move).
- python `_simple_pattern`, `_wildcard_pattern`, `case_list_pattern`, `case_tuple_pattern`: retiring renames the case_* storage to upstream `_list_pattern`/`_tuple_pattern`; the storage names then collide with the visible `list_pattern`/`tuple_pattern`.
- rust `tuple_type` + `_tuple_type_elements`, rust `tuple_expression` + `_tuple_expression_elements`: the alias wraps a span of the upstream seq; a patch addresses one position.
- rust `_non_special_token` + `_token_tree_punctuation` + `_token_keywords`, python `print_statement` family: a restructure that changes the parser, not an alias placement.

Where a cause in this table is wrong for a rule, the grammar glossary entry for that rule (`docs/<grammar>-grammar-sittir-glossary.md`) is the authority; pick the cause it describes and note the correction in the PR.

- [ ] **Step 2: Run the diagnostics per grammar and settle the provocation table**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool grammar-diagnostics --grammar <g> 2>&1 | grep -E "^.*(rule-|render-only|vocabulary-|upstream-)" ` for each grammar.

For every `rule-cause-mismatch`, compare the provoking codes it lists with the declared cause: if the code genuinely belongs to that cause class, add it to `PROVOKING_CODES[cause]`; if the declaration is wrong, fix the declaration. Delete any placeholder code name from `PROVOKING_CODES` that no upstream compile ever reports. For every `rule-reauthored-without-cause`, the compiler accepts the upstream shape and the replacement has no provocation the compiler can see; list it in that grammar's `expectDiagnostics: { 'rule-reauthored-without-cause': [...] }` as the accepted floor, and add one line per entry to the grammar glossary saying what the compiler would have to diagnose for the floor entry to be deleted. Expected outcome: zero blocking rule-cause diagnostics remain outside the floor; the floor lists are the PR's headline numbers.

- [ ] **Step 3: Byte identity**

Run, for each grammar: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`
Then: `git status --short packages/*/src packages/*/.sittir rust/crates`
Expected: nothing but `generated.manifest.json` lines. Wrapping a body in an identity tagger changes no rule.

- [ ] **Step 4: Gate and commit**

Run: `pnpm run type-check`; `pnpm exec vitest run packages/codegen`; `env -u SITTIR_NATIVE_DEBUG pnpm run validate:native`; `pnpm exec tsx packages/cli/src/cli.ts validate history 6`
Expected: rows equal the previous run for all three grammars.

```bash
git commit -m "feat(grammars): every hand-written rule declares its cause; accepted floors recorded" -- packages/typescript/grammar.sittir.ts packages/rust/grammar.sittir.ts packages/python/grammar.sittir.ts packages/codegen/src/compiler/diagnostics/rule-causes.ts docs/typescript-grammar-sittir-glossary.md docs/rust-grammar-sittir-glossary.md docs/python-grammar-sittir-glossary.md
git add -u -- packages/typescript/.sittir packages/rust/.sittir packages/python/.sittir
git commit -m "chore(generated): manifests after rule-cause migration" -- packages/typescript/.sittir packages/rust/.sittir packages/python/.sittir
```

---

### Task 5: The four shape codes block and name their resolving form

**Files:**
- Modify: `packages/codegen/src/compiler/collect-slots.ts:416-430` (`recordUnclassifiableShape`), `:463-500` (the `union-slot-mixed-row` and `union-slot-routed` messages)
- Modify: `packages/codegen/src/compiler/diagnostics/slot-grouping.ts:83-106` (`checkSeq`)
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:94-96` (`isBlockingAssembleWarningCode`), `:159-168` (`slotGroupingMapped`)
- Modify: `packages/{typescript,rust,python}/grammar.sittir.ts` (`expectDiagnostics:` floors)
- Test: `packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`, `packages/codegen/src/compiler/diagnostics/__tests__/slot-grouping.test.ts`

**Interfaces:**
- Consumes: `AssembleWarning` records, `SlotGroupingDiagnostic`, `isExpectedDiagnostic`.
- Produces: the same codes with `canProceed: false` unless floor-listed; messages ending in `Resolve with <form>` where form is `rule(...)`, `field(...)` or `variant(...)` per the spec's table.

- [ ] **Step 1: Write the failing collector tests**

Append to the `describe` in `grammar-diagnostics.test.ts` that already covers `content-collision` floors (around line 402), reusing its `collectGrammarDiagnostics` call shape:

```ts
	it('unclassifiable-shape blocks unless the owner kind is floor-listed for that code', () => {
		const warning = { code: 'unclassifiable-shape', ownerKind: 'k', message: 'm', details: {} };
		const blocked = collectGrammarDiagnostics({ grammar: 'synth', parseKindCollisions: [], assembleWarnings: [warning] });
		expect(blocked.diagnostics[0]).toEqual(expect.objectContaining({ code: 'unclassifiable-shape', canProceed: false }));
		const floored = collectGrammarDiagnostics({
			grammar: 'synth', parseKindCollisions: [], assembleWarnings: [warning],
			expectDiagnostics: { 'unclassifiable-shape': ['k'] }
		});
		expect(floored.diagnostics[0]).toEqual(expect.objectContaining({ canProceed: true }));
		const wrongCode = collectGrammarDiagnostics({
			grammar: 'synth', parseKindCollisions: [], assembleWarnings: [warning],
			expectDiagnostics: { 'union-slot-routed': ['k'] }
		});
		expect(wrongCode.diagnostics[0]).toEqual(expect.objectContaining({ canProceed: false }));
	});

	it('union-slot-routed and union-slot-mixed-row block the same way', () => {
		for (const code of ['union-slot-routed', 'union-slot-mixed-row']) {
			const r = collectGrammarDiagnostics({ grammar: 'synth', parseKindCollisions: [], assembleWarnings: [{ code, ownerKind: 'k', message: 'm' }] });
			expect(r.diagnostics[0]).toEqual(expect.objectContaining({ code, canProceed: false }));
		}
	});

	it('multi-slot-nested-seq blocks from the producer and is floored in the collector', () => {
		const records = diagnoseSlotGrouping({ k: { type: 'REPEAT', content: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }] } } } as never);
		expect(records[0]).toEqual(expect.objectContaining({ code: 'multi-slot-nested-seq', canProceed: false }));
		const floored = collectGrammarDiagnostics({
			grammar: 'synth', parseKindCollisions: [], slotGroupingDiagnostics: records,
			expectDiagnostics: { 'multi-slot-nested-seq': ['k'] }
		});
		expect(floored.diagnostics[0]).toEqual(expect.objectContaining({ canProceed: true }));
	});
```

Use the exact rule-literal shape `slot-grouping.test.ts` already builds for a multi-slot repeat (copy it) if the inline literal above does not satisfy `diagnoseSlotGrouping`'s input type.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`
Expected: the three new tests FAIL on `canProceed`.

- [ ] **Step 3: Flip the codes**

`grammar-diagnostics.ts`:

```ts
function isBlockingAssembleWarningCode(code: string): boolean {
	return (
		code === 'storagename-collision' ||
		code === 'nonterminal-separator-unstamped' ||
		code === 'unclassifiable-shape' ||
		code === 'union-slot-routed' ||
		code === 'union-slot-mixed-row'
	);
}
```

In `slotGroupingMapped`, extend the floor branch to both codes:

```ts
		if (
			(diagnostic.code === 'content-collision' || diagnostic.code === 'multi-slot-nested-seq') &&
			isExpectedDiagnostic(input.expectDiagnostics, diagnostic.code, diagnostic.ownerKind)
		) {
			return { ...mapped, canProceed: true };
		}
```

`slot-grouping.ts::checkSeq`: the `multi-slot-nested-seq` record gets `canProceed: false` and `severity: 'error'` (read the record literal at line 95 and change those two fields; the glossary entry for `SlotGroupingShape` says the other codes always push `true`, update it).

Messages: in `collect-slots.ts` append to the `unclassifiable-shape` message `. Resolve with rule('<name>', body) naming the structured arm`, to `union-slot-routed` `. Resolve with field('<name>') on the unnamed arm`, to `union-slot-mixed-row` `. Resolve with variant('<name>') splitting the row` (replacing the "Keeping status quo. END-STATE…" sentence); in `checkSeq` append `. Resolve with rule('<name>', body) hoisting the seq`. Delete the words "resolved by structural recursion" from `recordUnclassifiableShape`: the recursion still runs for floor-listed instances, but the message no longer presents it as a resolution.

- [ ] **Step 4: Floors**

Add to each grammar's `expectDiagnostics:` block (the current instances, from `packages/tools/validation-report.json`; re-derive with `tool grammar-diagnostics` before writing):

```ts
// typescript
'unclassifiable-shape': ['binary_expression', 'public_field_definition'],
'union-slot-mixed-row': ['binary_expression'],
'union-slot-routed': ['enum_body_elements', 'export_statement_default_declaration', 'export_statement_default_declaration_default_kw'],
'multi-slot-nested-seq': ['_type_identifier'],
// rust
'unclassifiable-shape': ['_let_chain'],
// python
'union-slot-routed': ['import_from_statement'],
```

- [ ] **Step 5: Tests, byte identity, gate**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts packages/codegen/src/compiler/diagnostics/__tests__/slot-grouping.test.ts`
Expected: PASS (existing tests asserting `canProceed: true` on `multi-slot-nested-seq` are updated to `false`; independently confirm each one pinned the fallback behaviour by reading it, per the stale-test rule).
Regenerate all three grammars; `git status --short packages/*/src` shows only manifests. `pnpm run type-check`; `pnpm exec vitest run packages/codegen`; validate rows unchanged.

- [ ] **Step 6: Commit**

Glossary: `docs/glossary/compiler-diagnostics.md` (`isBlockingAssembleWarningCode` now lists five codes; `slotGroupingMapped` floors two; `checkSeq` blocks), `docs/glossary/compiler.md` (`recordUnclassifiableShape`, the two union messages).

```bash
git commit -m "feat(diagnostics): unsupported shapes block and name their resolving patch form; floors recorded" -- packages/codegen/src/compiler/collect-slots.ts packages/codegen/src/compiler/diagnostics/slot-grouping.ts packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts packages/codegen/src/compiler/diagnostics/__tests__/slot-grouping.test.ts packages/typescript/grammar.sittir.ts packages/rust/grammar.sittir.ts packages/python/grammar.sittir.ts docs/glossary/compiler-diagnostics.md docs/glossary/compiler.md
git add -u -- packages/typescript/.sittir packages/rust/.sittir packages/python/.sittir
git commit -m "chore(generated): manifests after shape-code flip" -- packages/typescript/.sittir packages/rust/.sittir packages/python/.sittir
```

---

### Task 6: Patch sites are recorded, labelled, and censused

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`WireContext.patchSites`; a `wireRecordPatchSite` accessor beside `wireGetCurrentRuleKind`)
- Modify: `packages/codegen/src/dsl/transform/transform.ts:594-647` (`resolvePatch` records the form)
- Modify: `packages/codegen/src/compiler/evaluate.ts` (`drainPatchSitesMetadata`), `types.ts` (`RawGrammar.patchSites`), `post-evaluate-invariant.test.ts` (`ALLOWED`)
- Create: `packages/codegen/src/compiler/diagnostics/patch-sites.ts`
- Modify: `packages/codegen/src/compiler/compile.ts` (fold `patch-without-cause` in)
- Create: `packages/tools/src/discover/override-census.ts`, `packages/cli/src/commands/tool/override-census.ts`; modify `packages/tools/src/index.ts`, `packages/cli/src/commands/tool/index.ts`, `packages/cli/tests/commands/tool/index.test.ts` (`EXPECTED` list), `packages/tools/package.json` exports and root `tsconfig.json` paths (mirror the `list-kinds` entries)
- Test: `packages/codegen/src/dsl/__tests__/patch-sites.test.ts` (new), `packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts` (new), `packages/cli/tests/commands/tool/override-census.test.ts` (new)

**Interfaces:**
- Consumes: `wireGetCurrentRuleKind()`; the placeholder guards `isFieldPlaceholder`, `isVariantPlaceholder`, `isAliasPlaceholder`, `isGroupPlaceholder`, `isSplicePlaceholder`, `isRegexPlaceholder`, `isArmDefault`; the `rule` placeholder as `{ __sittirPlaceholder: 'rule', name, body }` (alias plan Task 3; tested here with a literal object).
- Produces:
  ```ts
  export type PatchForm = 'field' | 'variant' | 'alias' | 'group' | 'splice' | 'regex' | 'default' | 'rule' | 'literal';
  export interface PatchSite { readonly ownerKind: string; readonly path: string; readonly form: PatchForm; readonly name?: string }
  // RawGrammar.patchSites?: readonly PatchSite[]
  export type PatchSiteLabel = 'authoring' | 'resolving';
  export interface LabelledPatchSite extends PatchSite { readonly label: PatchSiteLabel; readonly claims?: string }
  export function labelPatchSites(sites: readonly PatchSite[], upstream: UpstreamCompilation): LabelledPatchSite[];
  export function diagnosePatchSites(grammar: string, labelled: readonly LabelledPatchSite[]): GrammarDiagnostic[]; // patch-without-cause
  ```

- [ ] **Step 1: Write the failing wire test**

`packages/codegen/src/dsl/__tests__/patch-sites.test.ts` (build the wired grammar the way `transform-path.test.ts` does; copy its base and `wire` invocation):

```ts
import { describe, expect, it } from 'vitest';
import { wire } from '../wire/wire.ts';
import { field, variant } from '../index.ts';
import { evaluateWiredGrammar } from '../../compiler/__tests__/_helpers/evaluate-wired.ts';

describe('patch sites are recorded', () => {
	it('records owner kind, path and form for every placeholder application', async () => {
		const base = {
			name: 'synth',
			rules: {
				host: ($: any) => ({ type: 'SEQ', members: [$.a, { type: 'CHOICE', members: [$.b, $.c] }] }),
				a: () => 'a', b: () => 'b', c: () => 'c'
			}
		};
		const raw = await evaluateWiredGrammar(
			wire({ patches: { host: { 0: field('first'), '1/0': variant('bee') } } }, base as never),
			base as never
		);
		expect(raw.patchSites).toEqual([
			{ ownerKind: 'host', path: '0', form: 'field', name: 'first' },
			{ ownerKind: 'host', path: '1/0', form: 'variant', name: 'bee' }
		]);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/patch-sites.test.ts`
Expected: FAIL, `raw.patchSites` undefined.

- [ ] **Step 3: Record in `resolvePatch`, drain in evaluate**

`wire.ts`: `WireContext.patchSites: PatchSite[]` (mutable array, initialised `[]` in the literal); export `wireRecordPatchSite(site: PatchSite): void` next to `wireGetCurrentRuleKind` using the same active-context lookup. `transform.ts::resolvePatch` gains, before its first `if`, a call `recordPatchSite(patch)` that maps the placeholder guards to `PatchForm` (`isFieldPlaceholder` → `'field'` with `patch.name`; `isVariantPlaceholder` → `'variant'` with `patch.name`; `isAliasPlaceholder` → `'alias'` with its name; `isGroupPlaceholder` → `'group'`; `isSplicePlaceholder` → `'splice'`; `isRegexPlaceholder` → `'regex'`; `isArmDefault` → `'default'`; `(patch as {__sittirPlaceholder?: string}).__sittirPlaceholder === 'rule'` → `'rule'` with `patch.name`; anything else → `'literal'`). The path is the patch key `resolvePatch`'s caller is applying; thread it as a fourth parameter `path: string` from the one call site that iterates the patch map (read `transform.ts` around the `resolvePatch(` call to find it). `ownerKind` is `wireGetCurrentRuleKind()`.

`evaluate.ts`: `drainPatchSitesMetadata(opts)` returns `[...wireCtx.patchSites]` or `undefined` when empty; `grammarResult` carries `patchSites`; `RawGrammar.patchSites?: readonly PatchSite[]`; `ALLOWED` gains `'patchSites'`.

- [ ] **Step 4: Run the wire test**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/patch-sites.test.ts packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing labelling test**

`packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { labelPatchSites, diagnosePatchSites } from '../patch-sites.ts';
import type { UpstreamCompilation } from '../../upstream.ts';

const up = (codes: [string, string][]): UpstreamCompilation => ({
	grammar: 'synth', ruleNames: new Set(), externalNames: new Set(),
	diagnostics: codes.map(([code, ownerKind]) => ({ scope: 'grammar', grammar: 'synth', code, severity: 'error', ownerKind, message: '', canProceed: false }))
});

describe('patch sites', () => {
	it('a site on an owner the upstream compile flags is resolving and claims the code', () => {
		const labelled = labelPatchSites([{ ownerKind: 'host', path: '1', form: 'field', name: 'x' }], up([['union-slot-routed', 'host']]));
		expect(labelled[0]).toEqual(expect.objectContaining({ label: 'resolving', claims: 'union-slot-routed' }));
	});

	it('a site on an owner with no upstream diagnostic is authoring', () => {
		const labelled = labelPatchSites([{ ownerKind: 'host', path: '1', form: 'field', name: 'x' }], up([]));
		expect(labelled[0]).toEqual(expect.objectContaining({ label: 'authoring' }));
		expect(diagnosePatchSites('synth', labelled)).toEqual([]);
	});

	it('a rule() site with no claim is patch-without-cause', () => {
		const labelled = labelPatchSites([{ ownerKind: 'host', path: '1', form: 'rule', name: '_helper' }], up([]));
		const ds = diagnosePatchSites('synth', labelled);
		expect(ds).toEqual([expect.objectContaining({ code: 'patch-without-cause', ownerKind: 'host', canProceed: false })]);
	});

	it('a rule() site with a claim is silent', () => {
		const labelled = labelPatchSites([{ ownerKind: 'host', path: '1', form: 'rule', name: '_helper' }], up([['unclassifiable-shape', 'host']]));
		expect(diagnosePatchSites('synth', labelled)).toEqual([]);
	});
});
```

- [ ] **Step 6: Run to verify it fails, then write the module**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts`
Expected: FAIL, module not found.

`packages/codegen/src/compiler/diagnostics/patch-sites.ts`:

```ts
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { UpstreamCompilation } from '../upstream.ts';
import type { PatchSite } from '../../dsl/wire/wire.ts';

export type PatchSiteLabel = 'authoring' | 'resolving';
export interface LabelledPatchSite extends PatchSite {
	readonly label: PatchSiteLabel;
	readonly claims?: string;
}

const NEVER_AUTHORING: ReadonlySet<PatchSite['form']> = new Set(['rule']);

export function labelPatchSites(sites: readonly PatchSite[], upstream: UpstreamCompilation): LabelledPatchSite[] {
	const blockingByOwner = new Map<string, string>();
	for (const d of upstream.diagnostics) {
		if (d.canProceed === false && d.ownerKind !== undefined && !blockingByOwner.has(d.ownerKind)) blockingByOwner.set(d.ownerKind, d.code);
	}
	return sites.map((site) => {
		const claims = blockingByOwner.get(site.ownerKind);
		return claims === undefined ? { ...site, label: 'authoring' } : { ...site, label: 'resolving', claims };
	});
}

export function diagnosePatchSites(grammar: string, labelled: readonly LabelledPatchSite[]): GrammarDiagnostic[] {
	return labelled
		.filter((site) => site.label === 'authoring' && NEVER_AUTHORING.has(site.form))
		.map((site) => ({
			scope: 'grammar' as const,
			grammar,
			code: 'patch-without-cause',
			severity: 'error' as const,
			ownerKind: site.ownerKind,
			message: `patches: ${site.form}('${site.name ?? ''}') at '${site.ownerKind}' path '${site.path}' resolves nothing: the upstream shape at this owner compiles with no blocking diagnostic`,
			canProceed: false,
			details: { path: site.path, form: site.form, name: site.name }
		}));
}
```

Fold into `compileGrammar` beside the rule-cause step (reuse the one `compileUpstream` result; hoist it to a local so it is awaited once).

- [ ] **Step 7: Run the labelling test**

Run: `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: The census tool**

`packages/tools/src/discover/override-census.ts`, following `list-kinds.ts`'s options-object `run` shape:

```ts
export interface OverrideCensusOptions { grammar: string; json: boolean }

export async function run(opts: OverrideCensusOptions): Promise<number> {
	const { compileGrammar } = await import('../codegen-surface.ts');       // whichever surface exposes compileGrammar; list-kinds.ts's buildNodeMap shows the import
	const { compileUpstream } = await import('../codegen-surface.ts');
	const { labelPatchSites } = await import('../codegen-surface.ts');
	const compilation = await compileGrammar({ grammar: opts.grammar });
	const upstream = await compileUpstream(opts.grammar);
	const rules = Object.entries(compilation.raw.ruleCauses ?? {}).map(([name, d]) => ({ name, ...d }));
	const undeclared = compilation.raw.undeclaredRules ?? [];
	const sites = labelPatchSites(compilation.raw.patchSites ?? [], upstream);
	const report = {
		grammar: opts.grammar,
		handWrittenRules: { declared: rules, undeclared, count: rules.length + undeclared.length },
		patchSites: { authoring: sites.filter((s) => s.label === 'authoring'), resolving: sites.filter((s) => s.label === 'resolving') }
	};
	if (opts.json) { process.stdout.write(`${JSON.stringify(report, null, 2)}\n`); return 0; }
	process.stdout.write(`${opts.grammar}: ${report.handWrittenRules.count} hand-written rules (${rules.length} declared, ${undeclared.length} undeclared)\n`);
	for (const r of rules) process.stdout.write(`  ${r.kind.padEnd(11)} ${'cause' in r ? r.cause.padEnd(17) : ''.padEnd(17)} ${r.name}\n`);
	for (const n of undeclared) process.stdout.write(`  undeclared              ${n}\n`);
	process.stdout.write(`patch sites: ${report.patchSites.resolving.length} resolving, ${report.patchSites.authoring.length} authoring\n`);
	for (const s of report.patchSites.resolving) process.stdout.write(`  ${s.ownerKind} @ ${s.path}: ${s.form}(${s.name ?? ''}) claims ${s.claims}\n`);
	return 0;
}
```

Expose `compileUpstream` and `labelPatchSites` through `packages/tools/src/codegen-surface.ts` the way it exposes the other codegen entry points (read that file; add two lines). Add the CLI module `packages/cli/src/commands/tool/override-census.ts` by copying `list-kinds.ts` verbatim and changing the name, description, options (`--grammar` via the existing helper, `--json` boolean) and the imported `run`; register it in `packages/cli/src/commands/tool/index.ts`; add `'override-census'` to the `EXPECTED` list in `packages/cli/tests/commands/tool/index.test.ts`; add the package export and tsconfig path the way the `list-kinds` entries exist; add `packages/cli/tests/commands/tool/override-census.test.ts` by copying `list-kinds.test.ts` and changing names and flags.

- [ ] **Step 9: Run the census for the three grammars and paste it into the PR**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool override-census --grammar <g>` for each grammar.
Expected: the hand-written counts equal 17/26/22; `patch-without-cause` cannot fire yet (no `rule` placeholder exists), so no compile goes red; the resolving list is the compiler's work list per the spec.

- [ ] **Step 10: Gate and commit**

Run: `pnpm run type-check`; `pnpm exec vitest run packages/codegen packages/cli`; regenerate; byte identity; validate rows unchanged. Also regenerate `docs/cli-command-glossary.md` the way the repo does for a new `tool` subcommand (read `DEVELOPMENT.md` for the command).

Glossary: `docs/glossary/dsl-wire.md` (`PatchSite`, `WireContext.patchSites`, `wireRecordPatchSite`), `docs/glossary/dsl-transform.md` (`resolvePatch` recording), `docs/glossary/compiler-diagnostics.md` (`patch-sites.ts::labelPatchSites`, `::diagnosePatchSites`, `patch-without-cause`), `docs/glossary/tools.md` (`override-census`).

```bash
git add -- packages/codegen/src/compiler/diagnostics/patch-sites.ts packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts packages/codegen/src/dsl/__tests__/patch-sites.test.ts packages/tools/src/discover/override-census.ts packages/cli/src/commands/tool/override-census.ts packages/cli/tests/commands/tool/override-census.test.ts
git commit -m "feat(diagnostics,tools): patch sites are recorded and labelled; override-census tool; patch-without-cause" -- packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/dsl/transform/transform.ts packages/codegen/src/compiler/evaluate.ts packages/codegen/src/compiler/types.ts packages/codegen/src/compiler/compile.ts packages/codegen/src/compiler/__tests__/post-evaluate-invariant.test.ts packages/codegen/src/compiler/diagnostics/patch-sites.ts packages/codegen/src/compiler/diagnostics/__tests__/patch-sites.test.ts packages/codegen/src/dsl/__tests__/patch-sites.test.ts packages/tools/src/discover/override-census.ts packages/tools/src/codegen-surface.ts packages/tools/src/index.ts packages/tools/package.json tsconfig.json packages/cli/src/commands/tool/override-census.ts packages/cli/src/commands/tool/index.ts packages/cli/tests/commands/tool/index.test.ts packages/cli/tests/commands/tool/override-census.test.ts docs/cli-command-glossary.md docs/glossary/dsl-wire.md docs/glossary/dsl-transform.md docs/glossary/compiler-diagnostics.md docs/glossary/tools.md
```

---

### Task 7: The hand-rule ratchet, spec status, PR

**Files:**
- Create: `packages/codegen/src/__tests__/hand-rule-ratchet.test.ts`
- Modify: `docs/superpowers/specs/2026-09-22-unsupported-shape-diagnostics-design.md` (status line; §4 wording, see Step 3)
- Test: the new test

**Interfaces:**
- Consumes: `compileGrammar` (or the raw evaluate of each grammar's `grammar.sittir.ts`), `RawGrammar.ruleCauses`, `RawGrammar.undeclaredRules`.

- [ ] **Step 1: Write the ratchet test**

`packages/codegen/src/__tests__/hand-rule-ratchet.test.ts`, modelled on `phantom-kind-ratchet.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

const CEILINGS: Record<string, number> = { typescript: 17, rust: 26, python: 22 };

describe('hand-written rule ratchet', () => {
	for (const [grammar, ceiling] of Object.entries(CEILINGS)) {
		it(`${grammar}: rules: entries stay at or below ${ceiling}`, async () => {
			const raw = await evaluate(resolveOverridesPath(grammar));
			const declared = Object.keys(raw.ruleCauses ?? {});
			const undeclared = raw.undeclaredRules ?? [];
			const names = [...declared, ...undeclared].sort();
			expect(new Set(names).size, 'a rule name appears in both declared and undeclared').toBe(names.length);
			expect(names.length, `${grammar} hand-written rules (${names.length} > ${ceiling}):\n${names.join('\n')}`).toBeLessThanOrEqual(ceiling);
		});
	}
});
```

The count comes from the evaluated wire context, so a duplicate object key in the grammar file (last one wins) counts once, as it is evaluated.

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run packages/codegen/src/__tests__/hand-rule-ratchet.test.ts`
Expected: PASS at exactly the ceilings. If a grammar is below its ceiling, lower the ceiling to the observed count in the same commit; ceilings are never above the observed value.

- [ ] **Step 3: Spec status and wording**

Set the spec's status line to `implemented, 2026-…; ceilings typescript N / rust N / python N; floors recorded in each grammar's expectDiagnostics`. In §1.1, record that a bare body on a *new* helper rule is `rule-undeclared-helper` (warning) until the `rule()` placeholder exists, and that `rule-cause-missing` (blocking) covers replacements and externals; the spec's original single-error wording predates that staging. In §4, change "no fallback path remains in `collect-slots`" to "the structural-recursion fallback runs only for floor-listed instances; an unlisted instance blocks before assemble completes", which is what Task 5 built. Add the observed provocation table (`PROVOKING_CODES` final contents) to §1.2.

- [ ] **Step 4: Full gate and PR**

Run: `pnpm run type-check`; `pnpm exec vitest run packages/codegen packages/cli packages/tools`; regenerate all three; byte identity; `env -u SITTIR_NATIVE_DEBUG pnpm run validate:native`; `pnpm exec tsx packages/cli/src/cli.ts validate history 6`.
Expected: all green, validation rows equal the pre-plan rows.

```bash
git add -- packages/codegen/src/__tests__/hand-rule-ratchet.test.ts
git commit -m "test(codegen): hand-written rule ratchet at 17/26/22; spec status" -- packages/codegen/src/__tests__/hand-rule-ratchet.test.ts docs/superpowers/specs/2026-09-22-unsupported-shape-diagnostics-design.md
git push -u origin <branch>
gh pr create --base <base> --title "feat(diagnostics): unsupported shapes block; hand-written rules declare their cause" --body-file <the PR body: the three census outputs, the three upstream-compile code lists, the floors, the ceilings>
```

---

## Out of scope (tracked elsewhere)

- Migrating the 26 new helper rules to `rule(name, body)` patches, and flipping `rule-undeclared-helper` to blocking: after the alias-identity plan's Task 3 lands the placeholder and Task 7 retires the first four. When that happens, `NEVER_AUTHORING` already carries `'rule'` and `diagnoseRuleCauses` only needs the warning turned into `canProceed: false`.
- `alias-distributed` and `display-union-mixed`: the alias-identity plan's Task 5.
- Fixing any shape the census surfaces.
