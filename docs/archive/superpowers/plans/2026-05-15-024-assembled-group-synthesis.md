# AssembledGroup synthesis via `groups:` overrides — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `groups:` block to per-grammar `overrides.ts` that lifts nested sub-rules into hidden synthesized kinds materialized by the existing classifier as `AssembledGroup` instances. Closes bug #3 (rust `_visibility_modifier_pub` rendering `pub()` instead of `pub`).

**Architecture:** New `applyGroupOverrides` link sub-stage runs BEFORE polymorph aliasing, rewrites the parent rule body to replace the targeted sub-rule with a `SymbolRule` ref to a synthesized hidden kind, and registers the lifted body under that name. Synthesized kind name uses polymorph-ancestor context: each path segment that also appears in `polymorphs:` for the same kind contributes its variant name. Downstream materialization reuses the existing hidden-symbol → AssembledGroup classifier — no new AssembledNode subclass, no new DSL function, no walker changes.

**Tech Stack:** TypeScript (codegen package), pnpm + tsx for runtime verification (per cleanup-rules §B1 and §H3 — `pnpm -r run build` and the vitest globalSetup that depends on it are blocked). Jinja templates (downstream consumers — verified by inspection of regenerated output).

**Spec:** `docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md`. Read it before starting. The "Open questions" section is empty — design decisions are settled. If you discover a case the spec doesn't cover, STOP and surface to the human before diverging.

**Verification philosophy:** This plan deliberately does NOT use TDD. Reasons: (a) the existing test suite has 56 failing tests; new unit tests add noise without paying their way; (b) §H3 blocks `pnpm test`, so vitest test files can't be run through the proper runner anyway; (c) the synthesis logic is pure-rule-tree transforms that are easier to sanity-check via tsx-eval than via vitest setup; (d) the load-bearing validation is the T2 integration measurement (rust counts move because visibility_modifier renders correctly). Each chunk lands an end-to-end tsx-eval sanity check; T2 is the gate for merge-readiness.

**Cleanup-rules to honor at every step:**
- §A1: don't hand-edit any file in `packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `factory-map.json5`, `overrides.suggested.ts`, or `rust/crates/sittir-*/src/**`. Fix the generator instead.
- §A5: every codegen change requires `npx tsx packages/codegen/src/cli.ts --grammar <name> --all --output packages/<name>/src` to refresh the manifest before validators will load the grammar.
- §B3: changes touching `compiler/node-map.ts`, `compiler/link.ts`, or the wrap/factory-map emitters require regen-all-three-grammars before measuring.
- §D1/§D3: trust cov over RT; pass-count moves must correlate with AST-match moves (else masking).
- §E2: native read stays raw — no schema-shaping in napi/read-side helpers.
- §F1 / §H3: don't try to fix `pnpm -r run build`; it's a known blocker tracked separately. Use `pnpm exec tsx ...` for direct script invocation.

---

## File structure

**New files:**
- `packages/codegen/src/compiler/group-synthesis.ts` — pure module implementing `applyGroupOverrides(rules, groupsConfig, polymorphsConfig)`. Owns path resolution, lift mechanics, naming derivation, error validation. ~200-300 lines.

**Modified files:**
- `packages/codegen/src/dsl/wire/wire.ts` — add `groups?: GroupsConfig<Base>` field to `WireConfig`, propagate to `WireContext`, export `GroupsConfig` type.
- `packages/codegen/src/compiler/rule.ts` — extend `SymbolRule.source` discriminant to include `'group-lift'`.
- `packages/codegen/src/compiler/link.ts` — invoke `applyGroupOverrides` BEFORE the existing polymorph-composition call. Plumb groups config from context.
- `packages/codegen/src/emitters/suggested.ts` — emit a `suggestedGroups:` block with detected nested-seq candidates.
- `packages/rust/overrides.ts` — opt in: `groups: { visibility_modifier: { '1/1': 'parens' } }` (T2 integration test trigger).
- `docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md` — document `groups:` alongside `polymorphs:` and `transforms:` mechanism description.

**Boundary discipline:** all synthesis logic stays in `group-synthesis.ts`. `link.ts` calls into it but doesn't know the lift mechanics. Drive verification with synthetic rule trees through tsx-eval scripts (kept in `/tmp/` or alongside as ad-hoc), not vitest test files.

---

## Chunk 1: Type plumbing + `groups:` config surface

This chunk lands the type definitions and `groups:` field on `WireConfig` without any runtime behavior change. After this chunk, an override file CAN write `groups: { kind: { path: 'name' } }` but it has no effect yet.

### Task 1.1: Add `GroupsConfig` type to wire.ts

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts`

- [ ] **Step 1: Inspect existing PolymorphsConfig and WireContext shapes**

```bash
rg -n "PolymorphsConfig\|WireContext\|WireConfig" packages/codegen/src/dsl/wire/wire.ts | head -20
```

Read the relevant section. Note where `polymorphs?:` field is declared on `WireConfig` and where it's threaded into `WireContext` in the `wire()` function body.

- [ ] **Step 2: Add GroupsConfig type, WireConfig.groups field, and WireContext.groups field**

In `packages/codegen/src/dsl/wire/wire.ts`, after `PolymorphsConfig`:

```ts
/**
 * Per-kind group-lift map. Each entry's key is the parent kind whose
 * rule body contains the sub-rule to lift; the inner map is
 * `path → discriminator`, where the path is the same slash-separated
 * positional path used by `polymorphs:` and `transforms:` and the
 * discriminator is a non-empty identifier that becomes the leaf
 * segment of the synthesized hidden kind name.
 *
 * The synthesized kind name follows polymorph-ancestor context: each
 * path segment that ALSO appears in `polymorphs:` for the same kind
 * contributes its variant name to the synthesized kind. Non-polymorph
 * segments don't contribute. See:
 *   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
 */
export type GroupsConfig<Base extends GrammarBase = GrammarBase> = Partial<
	Record<BaseKind<Base>, Record<string, string>>
>;
```

Add `readonly groups?: GroupsConfig<Base>;` to `WireConfig`.
Add `groups?: GroupsConfig;` to `WireContext`.
In the `wire()` function body where the context is built, add `groups: config.groups` alongside the existing context fields.

- [ ] **Step 3: Sanity check — codegen still runs**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3
```

Expected: completes without TypeScript errors. The new optional field on `WireConfig` doesn't affect any existing override file.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/dsl/wire/wire.ts
git commit -m "feat(codegen): add GroupsConfig type to WireConfig (no-op surface)"
```

### Task 1.2: Extend SymbolRule.source with `'group-lift'` discriminant

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts`

- [ ] **Step 1: Find current SymbolRule.source union**

```bash
rg -n "interface SymbolRule\|source\?: '" packages/codegen/src/compiler/rule.ts | head -5
```

Note the current union literal values.

- [ ] **Step 2: Add 'group-lift' to the union**

Add `'group-lift'` to the literal union of `SymbolRule.source`.

- [ ] **Step 3: Sanity check — codegen and existing test suites tolerate the wider union**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3
pnpm exec tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3
pnpm exec tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -3
```

Expected: all three complete without new errors. Existing source-checking code only matches specific known values, so widening the union is safe.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/compiler/rule.ts
git commit -m "feat(codegen): add 'group-lift' SymbolRule.source discriminant"
```

---

## Chunk 2: Path resolution + naming derivation (pure module)

Create `group-synthesis.ts` with pure functions: path resolution, naming derivation, overlap validation. One tsx-eval sanity check at the end of the chunk verifies all of it.

### Task 2.1: Create group-synthesis.ts skeleton with resolveGroupPath + deriveSynthesizedName + validateGroupsConfig

**Files:**
- Create: `packages/codegen/src/compiler/group-synthesis.ts`

- [ ] **Step 1: Create the module with all three helpers**

Create `packages/codegen/src/compiler/group-synthesis.ts`:

```ts
/**
 * Group-lift synthesis — implements the `groups:` override block per
 * docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md.
 *
 * Pure module — no I/O, no side effects on inputs.
 */

import type { Rule } from './rule.ts';

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Walk a path string ('1/1/0/1/3') into a rule tree, returning the
 * sub-rule at that path. Path segments index into:
 *   - seq.members[i]
 *   - choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/token/
 *     alias/variant/clause/group)
 *
 * Throws if any segment fails to address. Mirrors path semantics used
 * by `polymorphs:` / `transforms:` in `overrides.ts`.
 */
export function resolveGroupPath(rule: Rule, path: string): Rule {
	const segments = path.split('/').filter((s) => s.length > 0);
	let cur: Rule = rule;
	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i]!;
		const idx = parseInt(seg, 10);
		if (Number.isNaN(idx)) {
			throw new Error(`group path '${path}' has non-numeric segment '${seg}' at position ${i}`);
		}
		cur = stepInto(cur, idx, path);
	}
	return cur;
}

function stepInto(rule: Rule, idx: number, fullPath: string): Rule {
	switch (rule.type) {
		case 'seq':
		case 'choice': {
			const m = rule.members[idx];
			if (!m) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} out of range in ${rule.type} of ${rule.members.length} members`
				);
			}
			return m;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			if (idx !== 0) {
				throw new Error(
					`group path '${fullPath}' does not resolve: index ${idx} invalid for wrapper '${rule.type}' (only 0 is content)`
				);
			}
			return (rule as { content: Rule }).content;
		default:
			throw new Error(
				`group path '${fullPath}' does not resolve: cannot descend into rule of type '${rule.type}'`
			);
	}
}

export interface DeriveSynthesizedNameArgs {
	parentKind: string;
	path: string;
	discriminator: string;
	polymorphs: Record<string, Record<string, string> | undefined>;
}

/**
 * Compute the synthesized hidden kind name for a group lift.
 *
 * Rule: `_<parent>` + for each path-prefix that ALSO appears as a key
 * in polymorphs[parent], append `_<variantName>` + `_<discriminator>`.
 *
 * Polymorph prefixes are matched by string prefix of the slash-joined
 * path. polymorphs['1'] matches lift paths '1', '1/2', '1/2/3' etc.
 * polymorphs['1/2'] matches '1/2', '1/2/3' etc.
 */
export function deriveSynthesizedName(args: DeriveSynthesizedNameArgs): string {
	const { parentKind, path, discriminator, polymorphs } = args;
	const polymorphsForKind = polymorphs[parentKind] ?? {};
	const segments = path.split('/').filter((s) => s.length > 0);

	const contributions: string[] = [];
	for (let i = 1; i <= segments.length; i++) {
		const prefix = segments.slice(0, i).join('/');
		if (prefix in polymorphsForKind) {
			contributions.push(polymorphsForKind[prefix]!);
		}
	}

	return '_' + [parentKind, ...contributions, discriminator].join('_');
}

export interface ValidateGroupsArgs {
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	rules: Record<string, Rule>;
	warn?: (msg: string) => void;
}

/**
 * Validate all groups config at config-load time. Throws on E1-E5,
 * warns on E6. See spec §"Error handling" for the full taxonomy.
 */
export function validateGroupsConfig(args: ValidateGroupsArgs): void {
	const { groups, polymorphs, rules, warn } = args;
	const emitWarn = warn ?? ((msg: string) => console.warn(`[groups] ${msg}`));

	for (const [kind, lifts] of Object.entries(groups)) {
		if (!lifts) continue;
		const root = rules[kind];
		if (!root) {
			throw new Error(`groups['${kind}']: kind not in rule map`);
		}
		const polysForKind = polymorphs[kind] ?? {};
		const liftPaths = Object.keys(lifts);

		for (const path of liftPaths) {
			const discriminator = lifts[path]!;

			if (discriminator.length === 0) {
				throw new Error(`groups['${kind}']['${path}']: discriminator must be a non-empty identifier`);
			}
			if (!IDENTIFIER_RE.test(discriminator)) {
				throw new Error(
					`groups['${kind}']['${path}']: discriminator '${discriminator}' is not a valid identifier`
				);
			}

			let target: Rule;
			try {
				target = resolveGroupPath(root, path);
			} catch (e) {
				throw new Error(`groups['${kind}']['${path}']: ${(e as Error).message}`);
			}

			for (const polyPath of Object.keys(polysForKind)) {
				if (polyPath === path) {
					throw new Error(
						`groups['${kind}']['${path}'] and polymorphs['${kind}']['${polyPath}'] target the same position; pick one`
					);
				}
				if (isAncestorPath(path, polyPath)) {
					const synName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
					throw new Error(
						`groups['${kind}']['${path}'] would lift content containing polymorphs['${kind}']['${polyPath}']; ` +
						`rewrite the inner polymorph relative to the lifted kind (${synName}) or remove the overlapping entry`
					);
				}
			}

			for (const otherPath of liftPaths) {
				if (otherPath === path) continue;
				if (isAncestorPath(path, otherPath)) {
					throw new Error(
						`groups['${kind}']['${path}'] contains another group lift at '${otherPath}'; nested group lifts are not supported`
					);
				}
			}

			const synthName = deriveSynthesizedName({ parentKind: kind, path, discriminator, polymorphs });
			if (synthName in rules) {
				throw new Error(
					`groups['${kind}']['${path}'] would synthesize ${synthName}, but a rule with that name already exists; pick a different discriminator`
				);
			}

			if (!hasStructuralMember(target)) {
				emitWarn(
					`groups['${kind}']['${path}']: lifted body has no structural members (purely literal/punctuation content)`
				);
			}
		}
	}
}

function isAncestorPath(ancestor: string, descendant: string): boolean {
	if (ancestor === descendant) return false;
	const a = ancestor.split('/');
	const d = descendant.split('/');
	if (a.length >= d.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== d[i]) return false;
	}
	return true;
}

function hasStructuralMember(rule: Rule): boolean {
	switch (rule.type) {
		case 'field':
		case 'symbol':
		case 'supertype':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(hasStructuralMember);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			return hasStructuralMember((rule as { content: Rule }).content);
		default:
			return false;
	}
}
```

- [ ] **Step 2: Sanity-check all three helpers via tsx-eval**

Create `/tmp/verify-groups-helpers.ts`:

```ts
import { resolveGroupPath, deriveSynthesizedName, validateGroupsConfig } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/group-synthesis.ts';
import type { Rule } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/rule.ts';

function check(name: string, cond: unknown, msg = ''): void {
	if (!cond) { console.error('FAIL:', name, msg); process.exit(1); }
	console.log('ok:', name);
}

// resolveGroupPath
const vmBody: Rule = {
	type: 'choice', members: [
		{ type: 'string', value: 'crate' },
		{ type: 'seq', members: [
			{ type: 'string', value: 'pub' },
			{ type: 'optional', content: { type: 'seq', members: [
				{ type: 'string', value: '(' },
				{ type: 'symbol', name: '_path' },
				{ type: 'string', value: ')' }
			] } }
		] }
	]
};
check('resolve 1/1 → optional', resolveGroupPath(vmBody, '1/1').type === 'optional');
check('resolve 1/1/0 → seq', resolveGroupPath(vmBody, '1/1/0').type === 'seq');
try { resolveGroupPath(vmBody, '99'); check('resolve 99 should throw', false); }
catch (e: any) { check('resolve 99 throws', /does not resolve/.test(e.message)); }

// deriveSynthesizedName
check('name basic', deriveSynthesizedName({
	parentKind: 'r', path: '0', discriminator: 'inner', polymorphs: {}
}) === '_r_inner');
check('name with polymorph ancestor', deriveSynthesizedName({
	parentKind: 'visibility_modifier', path: '1/1', discriminator: 'parens',
	polymorphs: { visibility_modifier: { '1': 'pub', '0': 'crate' } }
}) === '_visibility_modifier_pub_parens');
check('name with two-level polymorph chain', deriveSynthesizedName({
	parentKind: 'outer', path: '1/2/3', discriminator: 'leaf',
	polymorphs: { outer: { '1': 'a', '1/2': 'b' } }
}) === '_outer_a_b_leaf');

// validateGroupsConfig — happy path
const rules: Record<string, Rule> = { vm: vmBody };
validateGroupsConfig({
	groups: { vm: { '1/1': 'parens' } },
	polymorphs: { vm: { '1': 'pub' } },
	rules
});
check('happy-path validate', true);

// E1 — overlap (groups ancestor of polymorphs)
try {
	validateGroupsConfig({
		groups: { vm: { '1': 'x' } },
		polymorphs: { vm: { '1/1': 'inner' } },
		rules
	});
	check('E1 should throw', false);
} catch (e: any) {
	check('E1 throws', /would lift content containing/.test(e.message));
}

// E1 exact match
try {
	validateGroupsConfig({
		groups: { vm: { '1': 'x' } },
		polymorphs: { vm: { '1': 'pub' } },
		rules
	});
	check('E1 exact-match should throw', false);
} catch (e: any) {
	check('E1 exact-match throws', /same position/.test(e.message));
}

// E2 unresolvable
try {
	validateGroupsConfig({
		groups: { vm: { '99': 'x' } },
		polymorphs: {},
		rules
	});
	check('E2 should throw', false);
} catch (e: any) {
	check('E2 throws', /does not resolve/.test(e.message));
}

// E5 invalid discriminator
try {
	validateGroupsConfig({
		groups: { vm: { '1': 'has-dash' } },
		polymorphs: {},
		rules
	});
	check('E5 should throw', false);
} catch (e: any) {
	check('E5 throws', /identifier/.test(e.message));
}

// E6 empty-body warning
const warnings: string[] = [];
validateGroupsConfig({
	groups: { vm: { '1/1/0' /* the inner seq, but with stripped symbol */: 'empty' } },
	polymorphs: {},
	rules: { vm: { type: 'seq', members: [
		{ type: 'string', value: 'a' },
		{ type: 'optional', content: { type: 'seq', members: [
			{ type: 'string', value: 'b' },
			{ type: 'string', value: 'c' }
		] } }
	] } },
	warn: (m) => warnings.push(m)
});
check('E6 warns on empty body', warnings.length > 0);

console.log('\nAll helper checks passed.');
```

Run it:

```bash
pnpm exec tsx /tmp/verify-groups-helpers.ts
```

Expected: all checks print `ok:` and "All helper checks passed."

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/compiler/group-synthesis.ts
git commit -m "feat(codegen): group-synthesis helpers — path/name/validate"
```

---

## Chunk 3: applyGroupOverrides — the rule rewrite

Implement the actual rule-tree mutation. After this chunk, `applyGroupOverrides({rules, groups, polymorphs})` produces a new rules map with synthesized kinds.

### Task 3.1: Implement applyGroupOverrides

**Files:**
- Modify: `packages/codegen/src/compiler/group-synthesis.ts`

- [ ] **Step 1: Append applyGroupOverrides to group-synthesis.ts**

Append:

```ts
export interface ApplyGroupOverridesArgs {
	rules: Record<string, Rule>;
	groups: Record<string, Record<string, string> | undefined>;
	polymorphs: Record<string, Record<string, string> | undefined>;
	warn?: (msg: string) => void;
}

export interface ApplyGroupOverridesResult {
	rules: Record<string, Rule>;
	synthesizedKinds: readonly string[];
}

/**
 * Apply all `groups:` lifts. Pure transform — input rules are not
 * mutated; a new rules map is returned with lifted bodies registered
 * under their synthesized kind names and parent bodies rewritten to
 * reference them.
 *
 * Wrapper handling: when the lift target is wrapped (`optional` /
 * `repeat` / `repeat1`), only the wrapper's content is moved into the
 * synthesized kind. The wrapper stays at the parent's lift position
 * with the synthesized symbol ref inside. This preserves cardinality
 * semantics at the parent.
 */
export function applyGroupOverrides(args: ApplyGroupOverridesArgs): ApplyGroupOverridesResult {
	validateGroupsConfig(args);

	const newRules: Record<string, Rule> = { ...args.rules };
	const synthesizedKinds: string[] = [];

	for (const [kind, lifts] of Object.entries(args.groups)) {
		if (!lifts || Object.keys(lifts).length === 0) continue;
		const sortedPaths = Object.keys(lifts).sort((a, b) => b.length - a.length); // deep first
		let parentBody = clone(newRules[kind]!);

		for (const path of sortedPaths) {
			const discriminator = lifts[path]!;
			const synName = deriveSynthesizedName({
				parentKind: kind, path, discriminator, polymorphs: args.polymorphs
			});
			const target = resolveGroupPath(parentBody, path);
			const { liftedBody, replacement } = liftRule(target, synName);

			parentBody = replaceAtPath(parentBody, path, replacement);
			newRules[synName] = liftedBody;
			synthesizedKinds.push(synName);
		}

		newRules[kind] = parentBody;
	}

	return { rules: newRules, synthesizedKinds };
}

function liftRule(target: Rule, synName: string): { liftedBody: Rule; replacement: Rule } {
	const synSym = { type: 'symbol' as const, name: synName, source: 'group-lift' as const };

	switch (target.type) {
		case 'optional':
			return { liftedBody: target.content, replacement: { type: 'optional', content: synSym } as Rule };
		case 'repeat':
			return {
				liftedBody: target.content,
				replacement: { type: 'repeat', content: synSym, separator: target.separator, trailing: target.trailing, leading: target.leading } as Rule
			};
		case 'repeat1':
			return {
				liftedBody: target.content,
				replacement: { type: 'repeat1', content: synSym, separator: target.separator, trailing: target.trailing, leading: target.leading } as Rule
			};
		default:
			return { liftedBody: target, replacement: synSym as Rule };
	}
}

function replaceAtPath(rule: Rule, path: string, replacement: Rule): Rule {
	const segments = path.split('/').filter((s) => s.length > 0);
	return replaceAtPathRec(rule, segments, 0, replacement);
}

function replaceAtPathRec(rule: Rule, segments: readonly string[], depth: number, replacement: Rule): Rule {
	if (depth === segments.length) return replacement;
	const idx = parseInt(segments[depth]!, 10);
	switch (rule.type) {
		case 'seq':
		case 'choice': {
			const members = rule.members.slice();
			members[idx] = replaceAtPathRec(members[idx]!, segments, depth + 1, replacement);
			return { ...rule, members };
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			return { ...rule, content: replaceAtPathRec((rule as { content: Rule }).content, segments, depth + 1, replacement) } as Rule;
		default:
			throw new Error(`replaceAtPath: cannot descend into '${rule.type}' at segment ${depth}`);
	}
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
```

- [ ] **Step 2: Sanity-check with the full visibility_modifier scenario via tsx-eval**

Create `/tmp/verify-groups-apply.ts`:

```ts
import { applyGroupOverrides } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/group-synthesis.ts';
import type { Rule } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/rule.ts';

function check(name: string, cond: unknown): void {
	if (!cond) { console.error('FAIL:', name); process.exit(1); }
	console.log('ok:', name);
}

const rules: Record<string, Rule> = {
	visibility_modifier: { type: 'choice', members: [
		{ type: 'symbol', name: '$.crate' },
		{ type: 'seq', members: [
			{ type: 'field', name: 'pub', content: { type: 'string', value: 'pub' } },
			{ type: 'optional', content: { type: 'seq', members: [
				{ type: 'string', value: '(' },
				{ type: 'choice', members: [
					{ type: 'symbol', name: '$.self' },
					{ type: 'symbol', name: '$.super' }
				] },
				{ type: 'string', value: ')' }
			] } }
		] }
	] }
};

const result = applyGroupOverrides({
	rules,
	groups: { visibility_modifier: { '1/1': 'parens' } },
	polymorphs: { visibility_modifier: { '1': 'pub', '0': 'crate' } }
});

check('synthesized kind exists', result.rules['_visibility_modifier_pub_parens'] !== undefined);
check('synthesized body is seq', result.rules['_visibility_modifier_pub_parens']!.type === 'seq');

const arm1 = (result.rules.visibility_modifier as any).members[1];
const optional = arm1.members[1];
check('parent retains optional wrapper', optional.type === 'optional');
check('optional now contains symbol ref', optional.content.type === 'symbol');
check('symbol ref points to synthesized kind', optional.content.name === '_visibility_modifier_pub_parens');
check('symbol ref has group-lift source', optional.content.source === 'group-lift');

check('input not mutated',
	(rules.visibility_modifier as any).members[1].members[1].content.type === 'seq');

console.log('\napplyGroupOverrides scenario check passed.');
```

Run:

```bash
pnpm exec tsx /tmp/verify-groups-apply.ts
```

Expected: all checks pass.

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/compiler/group-synthesis.ts
git commit -m "feat(codegen): applyGroupOverrides — rule-tree lift transform"
```

---

## Chunk 4: Wire applyGroupOverrides into link

This chunk integrates the synthesis into the pipeline. After this chunk, link runs the synthesis pass before polymorph composition, and downstream classifiers materialize synthesized kinds as AssembledGroups via the existing hidden-symbol path.

### Task 4.1: Locate the integration point in link.ts

**Files:** None — investigation only.

- [ ] **Step 1: Find where link reads polymorphs context and where polymorph composition happens**

```bash
rg -n "composeOrSynthesizePolymorphParents\|context\.polymorphs\|wireContext\.polymorphs" packages/codegen/src/compiler/link.ts | head -15
```

Document the call site in your scratch notes:
- Which function/section runs polymorph composition.
- How `context.polymorphs` is read.
- What variable name holds the rules being assembled at that point.

- [ ] **Step 2: Find the link entry point that receives the WireContext**

```bash
rg -n "export function.*link\|function buildNodeMap\|WireContext" packages/codegen/src/compiler/link.ts | head -10
```

Note the entry function signature and confirm `context.groups` will be accessible there.

### Task 4.2: Call applyGroupOverrides before polymorph composition

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts`

- [ ] **Step 1: Add import + invocation**

In `packages/codegen/src/compiler/link.ts`:

Add near the top with other imports:

```ts
import { applyGroupOverrides } from './group-synthesis.ts';
```

Immediately BEFORE the polymorph composition call (`composeOrSynthesizePolymorphParents` or equivalent), insert:

```ts
// Group lift pass — run BEFORE polymorph alias so lifts happen
// against the original rule body. See:
//   docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
const groupsConfig = context.groups ?? {};
if (Object.keys(groupsConfig).length > 0) {
	const lifted = applyGroupOverrides({
		rules: outRules,
		groups: groupsConfig,
		polymorphs: context.polymorphs ?? {}
	});
	// Replace contents in-place; downstream code in this function holds
	// the same `outRules` reference. Object.assign copies the synthesized
	// keys and overwrites any kinds whose bodies were rewritten.
	for (const key of Object.keys(outRules)) {
		if (!(key in lifted.rules)) delete outRules[key];
	}
	Object.assign(outRules, lifted.rules);
}
```

Adjust variable names (`outRules`, `context`, `groupsConfig`) to match the actual link.ts code.

- [ ] **Step 2: Regen rust to verify link runs without errors**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -5
```

Expected: codegen completes. Without any `groups:` opt-in in `packages/rust/overrides.ts`, the synthesis pass is a no-op; counts should be unchanged.

- [ ] **Step 3: Quick counts sanity check**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "Pass=" | head -5
```

Expected: counts match Chunk 1/2/3 baseline (no behavior change yet — the `groups:` config is empty for rust).

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/src/compiler/link.ts
git commit -m "feat(codegen): wire applyGroupOverrides into link pipeline (no-op without config)"
```

### Task 4.3: Verify a synthetic groups config produces an AssembledGroup

**Files:** None — verification only.

- [ ] **Step 1: Smoke test with a temporary rust overrides addition**

Temporarily add to `packages/rust/overrides.ts` (just for this verification — will revert):

```ts
groups: {
	visibility_modifier: { '1/1': 'parens' }
},
```

Regen:

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -10
```

Expected: completes. New file `packages/rust/templates/_visibility_modifier_pub_parens.jinja` appears. The `_visibility_modifier_pub.jinja` template should change shape.

- [ ] **Step 2: Inspect the new and changed templates**

```bash
cat packages/rust/templates/_visibility_modifier_pub_parens.jinja
cat packages/rust/templates/_visibility_modifier_pub.jinja
```

Expected:
- `_visibility_modifier_pub_parens.jinja` contains approximately `({{ children }})` — the lifted seq's literal-flanked content.
- `_visibility_modifier_pub.jinja` NO LONGER contains literal `()`. Instead it should be approximately `{{ pub }}{% if parens | isPresent %}{{ parens }}{% endif %}` (exact form depends on walker; the load-bearing property is that parens are not unconditional).

If the templates don't change as expected, STOP. The downstream classifier didn't pick up the synthesized kind correctly. Investigate before continuing — this is a spec assumption that needs verification.

- [ ] **Step 3: Revert the temporary overrides addition**

Revert the temporary `groups:` block (don't commit it yet — Chunk 6 lands it properly with full T2 measurement).

```bash
git checkout packages/rust/overrides.ts packages/rust/src packages/rust/.sittir packages/rust/templates
```

- [ ] **Step 4: Re-regen to restore canonical state**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3
```

(No commit — this is just verification that the pipeline works.)

---

## Chunk 5: suggested.ts emitter — `suggestedGroups:` block

### Task 5.1: Add detectGroupCandidates and emitSuggestedGroupsBlock to suggested.ts

**Files:**
- Modify: `packages/codegen/src/emitters/suggested.ts`

- [ ] **Step 1: Read existing suggested.ts to find where the file is composed**

```bash
rg -n "suggestedTransforms\|export const suggested\|writeFileSync\|fileLines" packages/codegen/src/emitters/suggested.ts | head -20
```

Locate:
- Where the file's full text is assembled (likely a function that returns a string with all `export const` blocks).
- Where each existing `export const` block is composed (suggestedTransforms, suggestedRules, etc.).

- [ ] **Step 2: Add detectGroupCandidates and emitSuggestedGroupsBlock**

Append to `packages/codegen/src/emitters/suggested.ts`:

```ts
export interface GroupCandidate {
	kind: string;
	path: string;
	discriminatorGuess: string;
}

/**
 * Walk rule bodies looking for nested seqs that could benefit from
 * group synthesis. Candidates:
 *   - Live inside a wrapper (not top-level rule body).
 *   - Have ≥1 structural member (field / symbol / supertype).
 *   - Are not already a group-lifted symbol ref.
 */
export function detectGroupCandidates(rules: Record<string, Rule>): GroupCandidate[] {
	const out: GroupCandidate[] = [];
	for (const [kind, body] of Object.entries(rules)) {
		walkBody(body, [], { kind, isTopLevel: true }, out);
	}
	return out;
}

function walkBody(
	rule: Rule,
	path: readonly number[],
	ctx: { kind: string; isTopLevel: boolean },
	out: GroupCandidate[]
): void {
	if (rule.type === 'symbol' && (rule as { source?: string }).source === 'group-lift') return;

	if (rule.type === 'seq' && !ctx.isTopLevel && hasGroupableStructure(rule)) {
		out.push({
			kind: ctx.kind,
			path: path.join('/'),
			discriminatorGuess: guessDiscriminator(rule, path)
		});
	}

	const childCtx = { ...ctx, isTopLevel: false };
	switch (rule.type) {
		case 'seq':
		case 'choice':
			for (let i = 0; i < rule.members.length; i++) {
				walkBody(rule.members[i]!, [...path, i], childCtx, out);
			}
			break;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			walkBody((rule as { content: Rule }).content, [...path, 0], childCtx, out);
			break;
	}
}

function hasGroupableStructure(rule: Rule): boolean {
	switch (rule.type) {
		case 'field':
		case 'symbol':
		case 'supertype':
			return true;
		case 'seq':
		case 'choice':
			return rule.members.some(hasGroupableStructure);
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'token':
		case 'alias':
		case 'variant':
		case 'clause':
		case 'group':
			return hasGroupableStructure((rule as { content: Rule }).content);
		default:
			return false;
	}
}

function guessDiscriminator(rule: Rule, path: readonly number[]): string {
	const peel = (r: Rule): string | null => {
		switch (r.type) {
			case 'symbol':
			case 'supertype':
				return r.name.replace(/^_+/, '').replace(/^\$\./, '');
			case 'field':
				return r.name;
			case 'seq':
			case 'choice':
				for (const m of r.members) {
					const n = peel(m);
					if (n) return n;
				}
				return null;
			case 'optional':
			case 'repeat':
			case 'repeat1':
			case 'token':
			case 'alias':
			case 'variant':
			case 'clause':
			case 'group':
				return peel((r as { content: Rule }).content);
			default:
				return null;
		}
	};
	const guess = peel(rule);
	if (guess && /^[A-Za-z_][A-Za-z0-9_]*$/.test(guess)) return guess;
	return 'g' + path.join('_');
}

/**
 * Format the `suggestedGroups` block. All entries are held — author
 * copies them into overrides.ts `groups:` block to activate.
 */
export function emitSuggestedGroupsBlock(candidates: readonly GroupCandidate[]): string {
	const lines: string[] = [];
	lines.push('// ---------------------------------------------------------------');
	lines.push('// suggestedGroups — drop entries into your overrides.ts');
	lines.push('// `groups:` block. Each entry lifts a nested sub-rule into');
	lines.push('// a hidden synthesized kind materialized as AssembledGroup.');
	lines.push('// All entries are held — none are auto-applied.');
	lines.push('// ---------------------------------------------------------------');
	lines.push('export const suggestedGroups = {');
	if (candidates.length === 0) {
		lines.push('};');
		lines.push('');
		return lines.join('\n');
	}
	const byKind: Record<string, GroupCandidate[]> = {};
	for (const c of candidates) {
		(byKind[c.kind] ??= []).push(c);
	}
	for (const [kind, list] of Object.entries(byKind)) {
		lines.push(`  // [held] ${list.length} candidate(s)`);
		lines.push(`  ${kind}: {`);
		for (const c of list) {
			lines.push(`    '${c.path}': '${c.discriminatorGuess}',`);
		}
		lines.push('  },');
		lines.push('');
	}
	lines.push('};');
	lines.push('');
	return lines.join('\n');
}
```

- [ ] **Step 3: Wire emitSuggestedGroupsBlock into the file composer**

Find the function in `suggested.ts` that assembles the full file text. Add (in the natural spot, after `suggestedTransforms` block emission):

```ts
const groupCandidates = detectGroupCandidates(rules);
fileLines.push(emitSuggestedGroupsBlock(groupCandidates));
```

Adjust `rules` and `fileLines` variable names to match the actual code.

- [ ] **Step 4: Regen all three grammars and verify the block appears**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -3
pnpm exec tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3
pnpm exec tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -3

rg -n "suggestedGroups" packages/rust/overrides.suggested.ts packages/typescript/overrides.suggested.ts packages/python/overrides.suggested.ts | head -10
```

Expected: all three regen successfully; all three suggested.ts files contain a `suggestedGroups` block. Rust's block should include `visibility_modifier` with path `'1/1'`.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/suggested.ts packages/rust/overrides.suggested.ts packages/typescript/overrides.suggested.ts packages/python/overrides.suggested.ts
git commit -m "feat(codegen): emit suggestedGroups block into overrides.suggested.ts"
```

---

## Chunk 6: T2 integration — visibility_modifier round-trip

The load-bearing measurement. After this chunk, rust pass counts should rise.

### Task 6.1: Capture baseline counts

**Files:** None — measurement only.

- [ ] **Step 1: Record baseline for all three grammars**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "Pass=|Total=" > /tmp/groups-baseline-rust.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript 2>&1 | rg "Pass=|Total=" > /tmp/groups-baseline-ts.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python 2>&1 | rg "Pass=|Total=" > /tmp/groups-baseline-py.txt
```

Expected baseline (per session start):
- rust: rrp 86/136 ast=47
- ts: rrp 41/112 ast=35
- python: rrp 73/115 ast=60

If actual baselines diverge significantly, STOP and investigate before proceeding.

### Task 6.2: Add the groups opt-in for visibility_modifier

**Files:**
- Modify: `packages/rust/overrides.ts`

- [ ] **Step 1: Add the entry**

In `packages/rust/overrides.ts`, near the `polymorphs:` block:

```ts
groups: {
	// visibility_modifier — lift the inner optional(seq('(', choice, ')'))
	// into a synthesized hidden kind (_visibility_modifier_pub_parens) so
	// the polymorph variant's render template naturally gates the parens
	// on inner content presence. Closes bug #3 (`pub()` → `pub`).
	// See: docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
	visibility_modifier: {
		'1/1': 'parens'
	}
},
```

- [ ] **Step 2: Regen rust**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -5
```

Expected: codegen completes. Manifest refreshed.

- [ ] **Step 3: Verify the emitted templates change as expected**

```bash
cat packages/rust/templates/_visibility_modifier_pub.jinja
ls packages/rust/templates/_visibility_modifier_pub_parens.jinja && cat packages/rust/templates/_visibility_modifier_pub_parens.jinja
```

Expected:
- `_visibility_modifier_pub.jinja` no longer has literal `()` around `{{ children }}`. Approximately `{{ pub }}{% if parens | isPresent %}{{ parens }}{% endif %}` or equivalent gated form.
- `_visibility_modifier_pub_parens.jinja` exists, approximately `({{ children }})`.

If templates don't match expectations, STOP. The synthesis ran but downstream emission didn't pick it up — investigate.

### Task 6.3: Measure rust deltas (T2)

**Files:** None — measurement only.

- [ ] **Step 1: Measure rust post-change counts**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | rg "Pass=|Total=" > /tmp/groups-post-rust.txt
diff /tmp/groups-baseline-rust.txt /tmp/groups-post-rust.txt
```

Expected diff:
- `read-render-parsePass`: ↑ by ≥ 5
- `read-render-parseAstMatchPass`: ↑ by similar amount (per §D3 correlation)
- `factory-render-parsePass`: ↑ (the synthesized `_visibility_modifier_pub_parens` adds usable factory cases)
- `cov`: ≥ baseline (no regression)
- `from`: ≥ baseline (no regression)

**Acceptance criteria for T2:**
- rust rrp pass count ≥ 91 (baseline 86 + 5)
- AST-match rises within ±2 of pass-count rise (correlation per §D3)
- cov unchanged or ↑
- from unchanged or ↑

If pass count rises but ast-match doesn't, suspect §D3 masking and investigate before declaring success.

- [ ] **Step 2: Capture the new first-failing entries for documentation**

```bash
pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust 2>&1 | tail -40 > /tmp/groups-post-rust-full.txt
```

Note which first-failing entries are NEW (different from baseline) — these are the next bugs to investigate after #16 lands.

### Task 6.4: Regen and verify ts/python no regression

**Files:** None — regen + measurement.

- [ ] **Step 1: Regen ts/python and measure**

```bash
pnpm exec tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3
pnpm exec tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -3
pnpm exec tsx packages/validator/src/cli.ts counts --backend native typescript 2>&1 | rg "Pass=" > /tmp/groups-post-ts.txt
pnpm exec tsx packages/validator/src/cli.ts counts --backend native python 2>&1 | rg "Pass=" > /tmp/groups-post-py.txt
diff /tmp/groups-baseline-ts.txt /tmp/groups-post-ts.txt
diff /tmp/groups-baseline-py.txt /tmp/groups-post-py.txt
```

Expected: ts/python pass counts unchanged (no `groups:` opt-in for those grammars). AST-match jitter ±2 is acceptable noise.

### Task 6.5: Commit the integration change

**Files:** Multiple, including regen artifacts.

- [ ] **Step 1: Commit rust opt-in + all regen artifacts**

```bash
git add packages/rust/overrides.ts \
        packages/rust/src \
        packages/rust/templates \
        packages/rust/.sittir \
        packages/rust/overrides.suggested.ts \
        packages/typescript/src packages/typescript/.sittir packages/typescript/overrides.suggested.ts \
        packages/python/src packages/python/.sittir packages/python/overrides.suggested.ts \
        rust/crates/sittir-rust/src \
        rust/crates/sittir-typescript/src \
        rust/crates/sittir-python/src \
        packages/validator/validation-history.jsonl
git commit -m "$(cat <<'EOF'
feat(rust): opt in to groups synthesis for visibility_modifier

Lifts the inner optional(seq('(', choice, ')')) into
_visibility_modifier_pub_parens. The polymorph variant's template
naturally gates parens on inner content presence, closing bug #3
(pub() → pub).

Rust read-render-parse: +<N> pass / +<N> ast (correlated per §D3).
ts/python: unchanged (no groups: opt-in for those grammars yet,
but they receive the suggestedGroups block via regen).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Fill in the actual delta numbers from Task 6.3 before committing.

---

## Chunk 7: Documentation

### Task 7.1: Document `groups:` in cleanup-rules

**Files:**
- Modify: `docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md`

- [ ] **Step 1: Add a section or paragraph**

Either:
- Add a new top-level section §J for "Override mechanisms" listing `polymorphs:`, `transforms:`, `groups:` with brief descriptions and the spec link, OR
- Update §B with a one-line mention of `groups:` alongside the existing override docs.

Reference: `docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md`

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/conventions/2026-05-15-024-cleanup-rules.md
git commit -m "docs: document groups: override block in cleanup-rules"
```

---

## Final verification checklist

Before declaring the plan complete:

- [ ] tsx-eval sanity scripts (`/tmp/verify-groups-helpers.ts`, `/tmp/verify-groups-apply.ts`) all pass
- [ ] `pnpm exec tsx packages/codegen/src/cli.ts --grammar <each>` completes for all three grammars
- [ ] rust read-render-parse pass count ↑ ≥ 5 with correlated AST-match rise (§D3 satisfied)
- [ ] ts/python counts unchanged
- [ ] `_visibility_modifier_pub.jinja` does NOT contain literal `()` parens
- [ ] `_visibility_modifier_pub_parens.jinja` exists with `({{ children }})` or equivalent
- [ ] `packages/{rust,typescript,python}/overrides.suggested.ts` all contain `suggestedGroups` blocks
- [ ] No regressions in cov / from for any grammar

## Out of scope (don't add)

Per the spec:
- The `pathOf()` rule-id-to-path utility — file separately later.
- Auto-apply of group suggestions.
- Nested group lifts (groups inside groups on the same kind).
- Walker generalization (the prior 07fde12f attempt).
- Fixing `pnpm -r run build` (§H3 known blocker).
- Migrating to vitest test files — tsx-eval sanity checks are sufficient until §H3 unblocks.
