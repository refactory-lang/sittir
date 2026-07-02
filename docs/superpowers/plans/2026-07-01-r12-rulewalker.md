# R12 PR-6 — RuleWalker\<R\> Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One traversal engine (`RuleWalker<R>`) with a single canonical child-edge relation, bound on `BaseCtx`, replacing exemplar hand-rolled walks — plus a test-layout standardization lead-in.

**Architecture:** `RuleWalker<R extends AnyRule>` class in `packages/codegen/src/dsl/rule-walker.ts` (mirrors `RuleBuilder`'s dsl-side layering). `childrenOf` is the DRY core; `map`/`fold`/`find` are thin primitives over it; a deref wing resolves SYMBOL refs through a bound rules map with per-invocation seen-sets. `BaseCtx<R>` constructs a bound instance. Walker owns recursion, never dispatch — call sites keep exhaustive `switch (rule.type)`.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, existing `AnyRule`/`Rule<Phase>` IR from PR #111.

**Spec:** `docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md`

## Global Constraints

- Branch: `r12-rulewalker` off `r12-evaluate` (needs `AnyRule` from commit `ba6a8f75`; rebase onto master once PR #111 merges).
- Byte-neutral gate on every commit that touches production code: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` must hold **rust 117 / ts 75 / py 102** (the `read-render-parseAstMatchPass` numbers).
- `propose-14` ratchet must stay OK (runs in pre-commit).
- ALWAYS commit with explicit pathspec: `git commit -F <msgfile> -- <paths>` (or `-m`), never a bare `git commit`.
- After any `validate:native` run, restore regen noise before committing: `git checkout -- rust/crates/sittir-python/index.d.ts rust/crates/sittir-typescript/index.d.ts rust/crates/*/test-fixtures.json packages/python/.sittir/grammar.js` and sed-revert those files' hash lines in the 3 `.sittir/generated.manifest.json` if churned.
- The word "tsgo" is fine in commands but a Bash hook blocks the literal "tsc"; type-check via `cd packages/codegen && rm -f tsconfig.tsbuildinfo && npx tsgo --noEmit -p tsconfig.json`. Known baseline: ~404 errors (deferred debt, do not fix unrelated ones; do not ADD errors).
- Vitest from the package: `cd packages/codegen && npx vitest run <paths>`.
- Do NOT run `validate:native` while on `master`.

---

### Task 1: Test-layout lead-in — moves only, zero logic

**Files:**
- Move: per-module unit tests out of `packages/codegen/src/__tests__/` into their module's `__tests__/` (classification rule below)
- Move: the 8 co-located `*.test.ts` files into their module's `__tests__/`
- Rename: `src/__tests__/rule-walker.test.ts` → `src/dsl/__tests__/find-repeat-flag.test.ts` (it tests `findRepeatFlag`; frees the name for Task 2)
- Modify: `.claude/codegen-conventions.md` (append convention line)

**Interfaces:** none (pure file moves).

- [ ] **Step 1: Classify the grab-bag deterministically**

For each `packages/codegen/src/__tests__/*.test.ts`, find its FIRST relative import of production code (skip `vitest`, `./helpers/*`, `../types/rule-types.ts`):
- imports only from `../compiler/...` (or `../compiler/<sub>/...`) → move to `packages/codegen/src/compiler/__tests__/`
- imports only from `../dsl/...` → `packages/codegen/src/dsl/__tests__/`
- imports only from `../emitters/...` → `packages/codegen/src/emitters/__tests__/`
- imports from 2+ of those subsystems, or from `../run-codegen.ts` / `../index.ts` / real grammar packages → **integration: stays in `src/__tests__/`**

Emit the mapping as a shell list before moving. Expected movers include (verify against the rule, don't trust this list blindly): `assemble`, `evaluate`, `link`, `normalize`, `taxonomy`, `generate`, `generated-metadata`, `post-evaluate-invariant`, `simplify-canonical`, `optional-repeat1-multiplicity` → compiler; `rule-walker` (→ `find-repeat-flag`) → dsl. Expected stayers: `real-grammar`, `emitter-framework`, `factory-surface`, `roundtrip`, `overrides-integration`, `native-*`, `polymorph-*-e2e`.

- [ ] **Step 2: Move the co-located 8**

`packages/codegen/src/emitters/template-hash.test.ts` and `render-module.test.ts` → `src/emitters/__tests__/`; `src/compiler/emit-gate.test.ts` and `diagnostics.test.ts` → `src/compiler/__tests__/`; `src/compiler/diagnostics/{slot-grouping,slot-count,derive-shapes,parsekind-collisions}.test.ts` → `src/compiler/diagnostics/__tests__/` (create dir).

- [ ] **Step 3: Execute moves via lsproxy (fallback: git mv + import fix)**

Primary: `lsproxy typescript workspace` file-move if available (check `lsproxy --help typescript workspace`); it updates importers. Fallback per file: `git mv <old> <new>`, then fix the moved file's own relative imports (each move one directory deeper: `../compiler/X` → `../X` for compiler/__tests__ targets, `./helpers/` → `../../__tests__/helpers/`). Nothing imports test files, so only the moved file's imports change.

- [ ] **Step 4: Verify**

Run: `cd packages/codegen && npx vitest run 2>&1 | tail -5`
Expected: same pass/fail totals as before the moves (capture the before totals first). Known pre-existing failures (enrich-fidelity ×2, group-lift ×1) unchanged.

- [ ] **Step 5: Convention line + commit**

Append to `.claude/codegen-conventions.md`:
```md
- Tests: unit tests live module-adjacent (`<module>/__tests__/*.test.ts`); `src/__tests__/` is reserved for cross-module integration tests. No co-located `*.test.ts` next to source.
```
Commit: `git commit -m "test(codegen): standardize test layout — module-adjacent __tests__/ for unit tests" -- <all moved paths> .claude/codegen-conventions.md`

---

### Task 2: RuleWalker core — childrenOf

**Files:**
- Create: `packages/codegen/src/dsl/rule-walker.ts`
- Test: `packages/codegen/src/dsl/__tests__/rule-walker.test.ts`

**Interfaces:**
- Consumes: `AnyRule`, `RuleBase` from `../types/rule.ts`; `DiagnosticSink` type from `../types/diagnostics.ts`; rule-type consts from `../types/rule-types.ts`.
- Produces: `export class RuleWalker<R extends AnyRule = AnyRule>` with `constructor(rules?: Readonly<Record<string, R>>, diagnostics?: DiagnosticSink)` and `childrenOf(rule: R): readonly R[]`.

- [ ] **Step 1: Write failing tests**

```ts
// packages/codegen/src/dsl/__tests__/rule-walker.test.ts
import { describe, it, expect } from 'vitest';
import { RuleWalker } from '../rule-walker.ts';
import { CHOICE, FIELD, OPTIONAL, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../../types/rule.ts';

const str = (value: string): AnyRule => ({ type: STRING, value });
const sym = (name: string): AnyRule => ({ type: SYMBOL, name });

describe('RuleWalker.childrenOf', () => {
	const w = new RuleWalker();
	it('members for seq/choice', () => {
		const a = str('a'), b = str('b');
		expect(w.childrenOf({ type: SEQ, members: [a, b] } as AnyRule)).toEqual([a, b]);
		expect(w.childrenOf({ type: CHOICE, members: [a, b] } as AnyRule)).toEqual([a, b]);
	});
	it('content for wrappers', () => {
		const inner = sym('x');
		expect(w.childrenOf({ type: OPTIONAL, content: inner } as AnyRule)).toEqual([inner]);
		expect(w.childrenOf({ type: FIELD, name: 'f', content: inner } as AnyRule)).toEqual([inner]);
	});
	it('empty for leaves (string/pattern/symbol/supertype/indent)', () => {
		expect(w.childrenOf(str('a'))).toEqual([]);
		expect(w.childrenOf(sym('x'))).toEqual([]);
		expect(w.childrenOf({ type: 'supertype', name: 's', subtypes: ['a'] } as AnyRule)).toEqual([]);
	});
	it('separator string form contributes no edges', () => {
		const r = { type: REPEAT, content: sym('x'), separator: ',' } as AnyRule;
		expect(w.childrenOf(r)).toEqual([sym('x')]);
	});
	it('separator array + object forms contribute their rules (stamped leaf)', () => {
		const sep = str(',');
		const arrLeaf = { type: SYMBOL, name: 'x', separator: [sep] } as AnyRule;
		expect(w.childrenOf(arrLeaf)).toEqual([sep]);
		const objLeaf = { type: SYMBOL, name: 'x', separator: { rules: [sep], trailing: true } } as AnyRule;
		expect(w.childrenOf(objLeaf)).toEqual([sep]);
	});
});
```

- [ ] **Step 2: Run to verify failure** — `cd packages/codegen && npx vitest run src/dsl/__tests__/rule-walker.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// packages/codegen/src/dsl/rule-walker.ts
/**
 * dsl/rule-walker.ts — RuleWalker<R>: the one traversal engine (R12 PR-6).
 *
 * One canonical child-edge relation (`childrenOf`) + thin primitives over it.
 * The walker owns RECURSION, never DISPATCH: call sites keep exhaustive
 * `switch (rule.type)` arms (feedback_rule_type_discrimination).
 * Layering mirrors RuleBuilder: dsl-side class; compiler's BaseCtx binds an
 * instance over its rules map (+ diagnostics).
 * Spec: docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md
 */
import type { AnyRule, RuleBase } from '../types/rule.ts';
import type { DiagnosticSink } from '../types/diagnostics.ts';
import { SYMBOL } from '../types/rule-types.ts'; // @rule-type-consts

type StampedSeparator = RuleBase<'optimize'>['separator'];

export class RuleWalker<R extends AnyRule = AnyRule> {
	readonly #rules?: Readonly<Record<string, R>>;
	/** Sink for future diagnostic-emitting walks (slot-grouping family). Public
	 *  readonly (not #private) — nothing reads it yet; a private field would
	 *  trip the unused-member lint. */
	readonly diagnostics?: DiagnosticSink;

	constructor(rules?: Readonly<Record<string, R>>, diagnostics?: DiagnosticSink) {
		this.#rules = rules;
		this.diagnostics = diagnostics;
	}

	/**
	 * THE canonical child-edge relation — single source of truth for "what
	 * are this rule's children": `members` (seq/choice), `content` (wrappers/
	 * variant/group/token/alias), and stamped separator rules (array/object
	 * form; string form carries no nested rules). Leaves return [].
	 * Walks needing a narrower set early-return on those types in their own
	 * lambda; this relation never grows per-walk options.
	 */
	childrenOf(rule: R): readonly R[] {
		const out: R[] = [];
		const bag = rule as { members?: readonly R[]; content?: R; separator?: StampedSeparator };
		if (Array.isArray(bag.members)) out.push(...bag.members);
		else if (bag.content && typeof bag.content === 'object') out.push(bag.content);
		const sep = bag.separator;
		if (Array.isArray(sep)) out.push(...(sep as readonly R[]));
		else if (typeof sep === 'object' && sep !== null && 'rules' in sep) out.push(...(sep.rules as readonly R[]));
		return out;
	}
}
```

- [ ] **Step 4: Run to verify pass** — same command → PASS (all 5).

- [ ] **Step 5: Commit** — `git commit -m "feat(codegen): RuleWalker core — canonical childrenOf edge relation (R12 PR-6)" -- packages/codegen/src/dsl/rule-walker.ts packages/codegen/src/dsl/__tests__/rule-walker.test.ts`

---

### Task 3: map / fold / find primitives

**Files:**
- Modify: `packages/codegen/src/dsl/rule-walker.ts`
- Test: `packages/codegen/src/dsl/__tests__/rule-walker.test.ts` (append)

**Interfaces:**
- Produces: `map(rule: R, visit: (r: R) => R): R` (bottom-up, identity-preserving); `fold<A>(rule: R, init: A, f: (acc: A, r: R) => A): A` (pre-order, visits root); `find(rule: R, pred: (r: R) => boolean): R | undefined` (pre-order, short-circuit, tests root).

- [ ] **Step 1: Write failing tests** (append to the describe file)

```ts
describe('RuleWalker.map', () => {
	const w = new RuleWalker();
	it('returns the SAME reference when visit changes nothing (fixpoint identity)', () => {
		const tree = { type: SEQ, members: [str('a'), { type: OPTIONAL, content: sym('x') }] } as AnyRule;
		expect(w.map(tree, (r) => r)).toBe(tree);
	});
	it('rebuilds only the spine above a changed node', () => {
		const keep = str('keep');
		const tree = { type: SEQ, members: [keep, sym('old')] } as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && r.name === 'old' ? sym('new') : r)) as { members: AnyRule[] };
		expect(out).not.toBe(tree);
		expect(out.members[0]).toBe(keep);
		expect((out.members[1] as { name: string }).name).toBe('new');
	});
});

describe('RuleWalker.fold / find', () => {
	const w = new RuleWalker();
	const tree = { type: SEQ, members: [str('a'), { type: CHOICE, members: [sym('x'), str('b')] }] } as AnyRule;
	it('fold visits root-first, pre-order', () => {
		const types = w.fold(tree, [] as string[], (acc, r) => (acc.push(r.type), acc));
		expect(types).toEqual([SEQ, STRING, CHOICE, SYMBOL, STRING]);
	});
	it('find short-circuits at the first match', () => {
		let visits = 0;
		const hit = w.find(tree, (r) => (visits++, r.type === STRING));
		expect((hit as { value: string }).value).toBe('a');
		expect(visits).toBe(2); // root seq, then str('a')
	});
	it('find returns undefined on no match', () => {
		expect(w.find(tree, (r) => r.type === 'indent')).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run to verify failure** → FAIL (`map is not a function`).

- [ ] **Step 3: Implement** (append methods inside the class)

```ts
	/**
	 * Bottom-up rebuild. Applies `visit` to each child's mapped result, then
	 * rebuilds this node ONLY if a child changed. Returns the SAME reference
	 * when nothing changed — load-bearing for fixpoint loops that compare
	 * `r === before` (enrich). Rebuild covers members/content edges; stamped
	 * separator rules are visited but never rebuilt (they are leaf literals
	 * in practice; rebuilding stamped attrs is transform-pass territory).
	 */
	map(rule: R, visit: (r: R) => R): R {
		const bag = rule as { members?: readonly R[]; content?: R };
		if (Array.isArray(bag.members)) {
			let changed = false;
			const next = bag.members.map((m) => {
				const out = visit(this.map(m, visit));
				if (out !== m) changed = true;
				return out;
			});
			return changed ? ({ ...(rule as object), members: next } as R) : rule;
		}
		if (bag.content && typeof bag.content === 'object') {
			const out = visit(this.map(bag.content, visit));
			return out === bag.content ? rule : ({ ...(rule as object), content: out } as R);
		}
		return rule;
	}

	/** Pre-order accumulate: visits `rule` itself, then descends childrenOf. */
	fold<A>(rule: R, init: A, f: (acc: A, r: R) => A): A {
		let acc = f(init, rule);
		for (const child of this.childrenOf(rule)) acc = this.fold(child, acc, f);
		return acc;
	}

	/** Pre-order search: tests `rule` itself, short-circuits on first match. */
	find(rule: R, pred: (r: R) => boolean): R | undefined {
		if (pred(rule)) return rule;
		for (const child of this.childrenOf(rule)) {
			const hit = this.find(child, pred);
			if (hit !== undefined) return hit;
		}
		return undefined;
	}
```

- [ ] **Step 4: Run to verify pass** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(codegen): RuleWalker map/fold/find primitives" -- packages/codegen/src/dsl/rule-walker.ts packages/codegen/src/dsl/__tests__/rule-walker.test.ts`

---

### Task 4: deref wing

**Files:**
- Modify: `packages/codegen/src/dsl/rule-walker.ts`
- Test: `packages/codegen/src/dsl/__tests__/rule-walker.test.ts` (append)

**Interfaces:**
- Produces: `deref(ref: R): R | undefined` (one-step SYMBOL resolve; `undefined` for non-symbols/unknown names; **throws** if the walker was constructed without `rules`); `foldDeep<A>(rule, init, f): A` and `findDeep(rule, pred): R | undefined` (like fold/find but additionally descend THROUGH symbol refs into `rules[name]`, with an internal per-invocation seen-set on symbol names — cycle-safe).

- [ ] **Step 1: Write failing tests**

```ts
describe('RuleWalker deref wing', () => {
	const rules: Record<string, AnyRule> = {
		a: { type: SEQ, members: [sym('b'), str('lit')] } as AnyRule,
		b: { type: CHOICE, members: [sym('a'), str('deep')] } as AnyRule, // cycle a -> b -> a
	};
	const w = new RuleWalker(rules);
	it('deref resolves one step; undefined for unknown/non-symbol', () => {
		expect(w.deref(sym('a'))).toBe(rules.a);
		expect(w.deref(sym('nope'))).toBeUndefined();
		expect(w.deref(str('x'))).toBeUndefined();
	});
	it('deref throws when constructed without rules', () => {
		expect(() => new RuleWalker().deref(sym('a'))).toThrow(/rules/);
	});
	it('foldDeep follows refs and terminates on cycles', () => {
		const values = w.foldDeep(rules.a!, [] as string[], (acc, r) =>
			(r.type === STRING ? (acc.push(r.value), acc) : acc));
		expect(values.sort()).toEqual(['deep', 'lit']);
	});
	it('findDeep finds through refs, cycle-safe', () => {
		expect((w.findDeep(rules.a!, (r) => r.type === STRING && r.value === 'deep') as { value: string }).value).toBe('deep');
		expect(w.findDeep(rules.a!, (r) => r.type === 'indent')).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement** (append inside the class)

```ts
	/** One-step SYMBOL resolve through the bound rules map. */
	deref(ref: R): R | undefined {
		if (this.#rules === undefined) {
			throw new Error('RuleWalker.deref: walker was constructed without a rules map');
		}
		if (ref.type !== SYMBOL) return undefined;
		return this.#rules[(ref as { name: string }).name];
	}

	/** fold that additionally descends THROUGH symbol refs (cycle-safe). */
	foldDeep<A>(rule: R, init: A, f: (acc: A, r: R) => A): A {
		const seen = new Set<string>();
		const go = (r: R, acc: A): A => {
			acc = f(acc, r);
			if (r.type === SYMBOL) {
				const name = (r as { name: string }).name;
				if (seen.has(name)) return acc;
				seen.add(name);
				const target = this.deref(r);
				return target === undefined ? acc : go(target, acc);
			}
			for (const child of this.childrenOf(r)) acc = go(child, acc);
			return acc;
		};
		return go(rule, init);
	}

	/** find that additionally descends THROUGH symbol refs (cycle-safe). */
	findDeep(rule: R, pred: (r: R) => boolean): R | undefined {
		const seen = new Set<string>();
		const go = (r: R): R | undefined => {
			if (pred(r)) return r;
			if (r.type === SYMBOL) {
				const name = (r as { name: string }).name;
				if (seen.has(name)) return undefined;
				seen.add(name);
				const target = this.deref(r);
				return target === undefined ? undefined : go(target);
			}
			for (const child of this.childrenOf(r)) {
				const hit = go(child);
				if (hit !== undefined) return hit;
			}
			return undefined;
		};
		return go(rule);
	}
```

- [ ] **Step 4: Run to verify pass** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(codegen): RuleWalker deref wing — cycle-safe ref-following walks" -- packages/codegen/src/dsl/rule-walker.ts packages/codegen/src/dsl/__tests__/rule-walker.test.ts`

---

### Task 5: BaseCtx.walker binding

**Files:**
- Modify: `packages/codegen/src/compiler/ctx.ts`
- Test: `packages/codegen/src/compiler/__tests__/ctx-walker.test.ts` (create)

**Interfaces:**
- Consumes: `RuleWalker` from `../dsl/rule-walker.ts`.
- Produces: `BaseCtx<R>.walker: RuleWalker<R>` — readonly field, constructed in the BaseCtx ctor as `new RuleWalker(init.rules, init.diagnostics)`. No `BaseCtxInit` change (derived, not injected).

- [ ] **Step 1: Failing test**

```ts
// packages/codegen/src/compiler/__tests__/ctx-walker.test.ts
import { describe, it, expect } from 'vitest';
import { NormalizeCtx } from '../normalize.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';

describe('BaseCtx.walker', () => {
	it('is bound to ctx.rules — deref resolves through them', () => {
		const rules: Record<string, Rule<'link'>> = {
			a: { type: SEQ, members: [{ type: SYMBOL, name: 'b' }] } as Rule<'link'>,
			b: { type: STRING, value: 'x' } as Rule<'link'>,
		};
		const ctx = new NormalizeCtx({ rules, diagnostics: new DiagnosticSink(), inlineKinds: new Set() });
		expect(ctx.walker.deref({ type: SYMBOL, name: 'b' } as Rule<'link'>)).toBe(rules.b);
		expect(ctx.walker.find(rules.a!, (r) => r.type === STRING)).toBeUndefined(); // find is shallow
		expect(ctx.walker.findDeep(rules.a!, (r) => r.type === STRING)).toBe(rules.b);
	});
});
```

(If `NormalizeCtx`'s init requires different fields, read `packages/codegen/src/compiler/normalize.ts:35` and adjust the literal — the assertion targets are the walker behaviors, not the ctx fields.)

- [ ] **Step 2: Run to verify failure** → FAIL (`walker` undefined).

- [ ] **Step 3: Implement** — in `packages/codegen/src/compiler/ctx.ts`:

```ts
import { RuleWalker } from '../dsl/rule-walker.ts';
```
(value import — the class is constructed here; `compiler → dsl` is the allowed direction, same as RuleBuilder's type import.)

Inside `BaseCtx<R>`, add the field + ctor line:
```ts
	/** Traversal engine bound to this phase's rules map + diagnostics (R12 PR-6).
	 *  Derived in the ctor — not a BaseCtxInit field; nothing to configure. */
	readonly walker: RuleWalker<R>;
```
```ts
		this.walker = new RuleWalker(init.rules, init.diagnostics);
```

- [ ] **Step 4: Run to verify pass** → PASS. Also run `cd packages/codegen && npx vitest run src/compiler/__tests__ src/dsl/__tests__ 2>&1 | tail -3` — no new failures.
- [ ] **Step 5: Commit** — `git commit -m "feat(codegen): bind RuleWalker on BaseCtx (ctx.walker)" -- packages/codegen/src/compiler/ctx.ts packages/codegen/src/compiler/__tests__/ctx-walker.test.ts`

---

### Task 6: fold/find exemplar migrations

**Files:**
- Modify: `packages/codegen/src/types/rule.ts` (walkFieldNames → fold) — NOTE: rule.ts is `types` layer and must NOT import from `dsl/`; see Step 1.
- Modify: `packages/codegen/src/dsl/rule-transforms.ts` (`findRepeatFlag` → find; deprecate `recurseChildren`)
- Modify: `packages/codegen/src/compiler/evaluate.ts` (`deriveComplexAliasTargetHidden` → fold)
- Tests: existing suites are the behavioral locks (`src/dsl/__tests__/find-repeat-flag.test.ts` after Task 1).

**Interfaces:**
- Consumes: `RuleWalker` from Task 2-4.
- Produces: unchanged public signatures — `collectFieldNames(rule: AnyRule): Set<string>`, `findRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading'): boolean`, `deriveComplexAliasTargetHidden(rules: Record<string, AnyRule>): ReadonlySet<string>`.

- [ ] **Step 1: Layering check for rule.ts**

`types/rule.ts` cannot import `dsl/rule-walker.ts` (layering: `types ← util ← dsl`). So `collectFieldNames`/`walkFieldNames` do NOT migrate in place — instead MOVE them to `dsl/rule-walker.ts` as a walker-based export, keep a deprecated re-export in `types/rule.ts`? NO — simpler and honest: leave `walkFieldNames` in rule.ts as-is (types-layer, self-contained) and drop it from the exemplar list. Document in the commit message: "walkFieldNames stays — types-layer cannot depend on dsl". (The fold exemplar is deriveComplexAliasTargetHidden.)

- [ ] **Step 2: Migrate findRepeatFlag** (rule-transforms.ts — replace the whole function body; keep the doc comment)

```ts
const flagWalker = new RuleWalker();

export function findRepeatFlag(rule: AnyRule, flag: 'trailing' | 'leading'): boolean {
	return (
		flagWalker.find(rule, (r) => {
			const sep = (r as { separator?: RuleBase<'optimize'>['separator'] }).separator;
			if (typeof sep === 'object' && !Array.isArray(sep) && sep !== null) {
				if ((sep as { trailing?: boolean; leading?: boolean })[flag] === true) return true;
			}
			return (r.type === REPEAT || r.type === REPEAT1) && (r as { trailing?: boolean; leading?: boolean })[flag] === true;
		}) !== undefined
	);
}
```
Add `import { RuleWalker } from './rule-walker.ts';` (dsl-internal, no cycle: rule-walker imports only from types/).

- [ ] **Step 3: Migrate deriveComplexAliasTargetHidden** (evaluate.ts — replace the hand-rolled `walk` including its separator handling)

```ts
export function deriveComplexAliasTargetHidden(rules: Record<string, AnyRule>): ReadonlySet<string> {
	const walker = new RuleWalker<AnyRule>();
	const candidates = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, candidates, (acc, r) => {
			// Pre-link form: alias(symbol(_X), $visible)
			if (r.type === ALIAS && r.named && r.content.type === 'symbol' && r.content.name.startsWith('_')) {
				acc.add(r.content.name);
			}
			// Post-link form: symbol(visible, aliasedFrom='_X')
			if (r.type === SYMBOL && (r as { aliasedFrom?: string }).aliasedFrom?.startsWith('_')) {
				acc.add((r as { aliasedFrom?: string }).aliasedFrom!);
			}
			return acc;
		});
	}
	return candidates;
}
```
Add `import { RuleWalker } from '../dsl/rule-walker.ts';` (compiler → dsl, allowed). The separator-rule edges the old walk was patched to cover come free from `childrenOf`.

- [ ] **Step 4: Deprecate recurseChildren** (rule-transforms.ts — JSDoc only, body unchanged)

Add to its doc comment:
```
 * @deprecated Superseded by `RuleWalker.map` (dsl/rule-walker.ts) — same
 * identity-preserving semantics plus the canonical childrenOf edge set.
 * Existing callers migrate opportunistically; new walks use ctx.walker.map.
```

- [ ] **Step 5: Verify behavior locks**

Run: `cd packages/codegen && npx vitest run src/dsl/__tests__/find-repeat-flag.test.ts src/dsl/__tests__/rule-walker.test.ts 2>&1 | tail -3` → PASS.
Run the full suite: `npx vitest run 2>&1 | tail -4` → totals unchanged vs Task 1 baseline.

- [ ] **Step 6: Byte-neutral gate + commit**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native 2>&1 | rg AstMatchPass` → rust 117 / ts 75 / py 102. Restore regen noise (Global Constraints). Commit:
`git commit -m "refactor(codegen): migrate findRepeatFlag + deriveComplexAliasTargetHidden to RuleWalker; deprecate recurseChildren" -- packages/codegen/src/dsl/rule-transforms.ts packages/codegen/src/compiler/evaluate.ts <plus source_hash-only manifests if churned>`

---

### Task 7: Spec reconciliation + PR

**Files:**
- Modify: `docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md` (migration-scope section)

- [ ] **Step 1: Reconcile the spec's exemplar list with reality** (feedback_spec_doc_dry_audit)

In the spec's "PR-6 migration scope" section, replace the exemplar bullet list with what actually shipped:
```md
- `findRepeatFlag` (rule-transforms) → `walker.find` (own predicate keeps the flag/separator dispatch)
- `deriveComplexAliasTargetHidden` (evaluate) → `walker.fold` (separator edges now come from childrenOf)
- `recurseChildren` (rule-transforms) → deprecated pointer to `walker.map`; callers migrate opportunistically
- `walkFieldNames` (types/rule.ts) — NOT migrated: types-layer cannot depend on dsl; stays self-contained
- `resolveHiddenRuleContent` (assemble) — deferred to the follow-up sweep: its per-type flatMap
  shape needs a mapDeep-like primitive; evaluate that against real need then
```

- [ ] **Step 2: Final full gate**

`cd packages/codegen && npx vitest run 2>&1 | tail -4` (totals = Task 1 baseline); `pnpm exec tsx packages/cli/src/cli.ts tool propose-14 | tail -2` → ratchet OK; type-error count `rm -f tsconfig.tsbuildinfo && npx tsgo --noEmit -p tsconfig.json | rg -c "error TS"` → ≤ the ~404 baseline.

- [ ] **Step 3: Commit + PR**

`git commit -m "docs(specs): reconcile RuleWalker exemplar list with shipped migrations" -- docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md`
Push and open PR: `git push -u origin r12-rulewalker && GITHUB_TOKEN= gh pr create --title "feat(codegen): RuleWalker<R> — one traversal engine on BaseCtx (R12 PR-6)" --base <master if #111 merged, else r12-evaluate> --body-file <summary per repo convention>`. Do NOT merge — merges happen only on the user's explicit word.
