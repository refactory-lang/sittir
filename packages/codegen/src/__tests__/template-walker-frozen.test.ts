/**
 * template-walker-frozen.test.ts
 *
 * Step 1 of Cluster F (feature 016 — parity-regressions, T033). Freezes
 * the TARGET CORRECTED render output for ~15 representative kinds across
 * rust + typescript + python, computed by hand from the grammar
 * declarations using the verified intersection-safe emission strategy:
 *
 *     {% if FIELD | isPresent %}<separator>{{ FIELD }}{% endif %}
 *
 * with the separator placed INSIDE the conditional and NO `{%- -%}`
 * strip markers. Strategy source: specs/016-parity-regressions/
 * research-jinja-whitespace.md (prototype-verified on Nunjucks +
 * Askama 2026-04-25).
 *
 * Most cases here FAIL today because the walker emits the older
 * "separator-OUTSIDE-conditional" pattern which leaves stray
 * whitespace around absent optional fields. Failing cases are marked
 * `it.fails(...)` so the suite stays green; they will flip to plain
 * `it(...)` as subsequent Cluster F sub-commits land walker fixes.
 *
 * NOTE: tests go through `createRenderer().render()` (TS-side) and
 * deliberately bypass any post-processing residue — measurement reset
 * (commit 364f48f5) already removed the `collapse_inner_spaces` regex
 * and outer `.trim()` from `packages/core/src/render.ts`. What this
 * test asserts is the walker's RAW emission.
 */

import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AnyNodeData } from '@sittir/types';
import { createRenderer } from '@sittir/core';
import {
	loadLanguageForGrammar,
	loadReadTreeNode,
	loadKindIdFromName,
	loadKindNames,
	treeHandle,
	adaptNode,
	findFirst
} from '../validate/common.ts';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

type Grammar = 'rust' | 'typescript' | 'python';

function templatesDirFor(grammar: Grammar): string {
	return resolve(fileURLToPath(new URL('../../../..', import.meta.url)), `packages/${grammar}/templates`);
}

const renderers: Partial<Record<Grammar, ReturnType<typeof createRenderer>>> = {};
async function rendererFor(grammar: Grammar): Promise<ReturnType<typeof createRenderer>> {
	const cached = renderers[grammar];
	if (cached) return cached;
	const kindNames = await loadKindNames(grammar);
	const r = createRenderer(templatesDirFor(grammar), {
		kindNames: kindNames ?? undefined
	});
	renderers[grammar] = r;
	return r;
}

interface ParseAndRenderResult {
	rendered: string;
	nodeData: AnyNodeData;
}

/**
 * Parse `source` for `grammar`, locate the first node of `kind`, and
 * render it through the per-grammar `.jinja` templates. Throws if no
 * matching kind is found in the parse tree.
 */
async function parseAndRender(grammar: Grammar, source: string, kind: string): Promise<ParseAndRenderResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree) throw new Error(`parseAndRender: parse failed for ${grammar} source`);

	const target = findFirst(tree.rootNode, kind);
	if (!target) {
		throw new Error(`parseAndRender: no ${kind} found in parsed source: ${JSON.stringify(source)}`);
	}

	const readTreeNodeFn = await loadReadTreeNode(grammar);
	if (!readTreeNodeFn) {
		throw new Error(`parseAndRender: no readTreeNode loader for ${grammar}`);
	}

	const kindIdFromName = await loadKindIdFromName(grammar);
	const handle = treeHandle(tree, source, kindIdFromName ?? undefined);

	// ADR-0017: readTreeNode(handle, handle?, childIndex?) navigates via
	// nodes[handle].children()[childIndex]. Passing only `target.id` (a
	// tree-sitter node id, not a handle index) as the second arg falls
	// through to the rootNode fallback and reads the wrong node. Correct
	// approach: temporarily swap handle.rootNode to the adapted target node
	// so readTreeNode(handle) reads from the desired subtree root.
	const adapted = adaptNode(target);
	const handleMut = handle as { rootNode: typeof adapted };
	const prev = handleMut.rootNode;
	handleMut.rootNode = adapted;
	let nodeData: AnyNodeData;
	try {
		nodeData = readTreeNodeFn(handle) as AnyNodeData;
	} finally {
		handleMut.rootNode = prev;
	}

	const renderer = await rendererFor(grammar);
	const rendered = renderer.render(nodeData);
	return { rendered, nodeData };
}

// ---------------------------------------------------------------------------
// Frozen targets
// ---------------------------------------------------------------------------
//
// Per kind: 1-2 cases. Each case picks a minimal source that surfaces
// the optional-field-with-spacing pattern the walker plan is meant to
// fix. Targets are computed by hand from the grammar declarations.
//
// `mode: 'pass'` — currently produces the target output (already
//                  correct under today's broken walker).
// `mode: 'fail'` — currently produces stray-whitespace output;
//                  marked `it.fails(...)` until Cluster F sub-commits
//                  land walker fixes that flip the assertion to true.
// ---------------------------------------------------------------------------

interface FrozenCase {
	grammar: Grammar;
	kind: string;
	name: string;
	source: string;
	target: string;
	/** Whether the current (broken) walker already happens to produce
	 *  the target output. `'fail'` cases are wrapped in `it.fails(...)`
	 *  so the suite stays green; subsequent walker fixes flip them to
	 *  passing. Each `'fail'` case carries a TODO referencing the next
	 *  Cluster F sub-commit that should fix it.
	 *
	 *  `'todo'` cases are wrapped in `it.todo(...)` — used when an
	 *  upstream change (spec 022 walker unification) altered the
	 *  rendered output and the frozen target string needs to be
	 *  re-derived. The case stays in the suite as a TODO marker so
	 *  it's not lost. */
	mode: 'pass' | 'fail' | 'todo';
	/** Optional explanation of WHY the walker emits wrong output today,
	 *  to help the next sub-commit author know what walker change is
	 *  required. */
	why?: string;
}

const FROZEN_CASES: FrozenCase[] = [
	// -------------------------------------------------------------------
	// Rust — top failing kinds
	// -------------------------------------------------------------------
	{
		grammar: 'rust',
		kind: 'block',
		name: 'empty block renders as {} with no inner spacing',
		source: 'fn main() {}',
		target: '{}',
		mode: 'fail',
		why: 'Template emits `{ {{ children | join(" ") }} }` which produces "{  }" when children is empty (literal space inside the braces). Walker should emit the inner space INSIDE a conditional gated on children presence.'
	},
	{
		grammar: 'rust',
		kind: 'block',
		name: 'single statement block keeps inner spacing',
		source: 'fn main() { let x = 1; }',
		target: '{ let x = 1; }',
		mode: 'pass'
	},
	{
		grammar: 'rust',
		kind: 'function_item',
		name: 'minimal fn renders without stray spaces',
		source: 'fn main() {}',
		target: 'fn main() {}',
		mode: 'fail',
		why: 'Walker emits "fn main () {}" — stray space before `()` because type_parameters slot is absent but its separator is unconditional. Separators around optional slots must move INSIDE conditionals.'
	},
	{
		grammar: 'rust',
		kind: 'function_item',
		name: 'fn with params + return type + body',
		source: 'fn add(x: i32, y: i32) -> i32 { x + y }',
		target: 'fn add(x: i32, y: i32) -> i32 { x + y }',
		mode: 'fail',
		why: 'Walker emits "fn add (x: i32, y: i32) ->i32 { x + y }" — stray space before `(`, missing space after `->`. Unconditional separators around optional type_parameters and return_type slots.'
	},
	{
		grammar: 'rust',
		kind: 'let_declaration',
		name: 'simple let renders without stray spaces',
		source: 'fn main() { let x = 1; }',
		target: 'let x = 1;',
		mode: 'fail',
		why: 'mutable_specifier / type / value / alternative are all optional — current template renders "let  x  =1 ;" (double space, missing space around =, stray space before ;). All separators must move inside conditionals; the trailing `;` should attach.'
	},
	{
		grammar: 'rust',
		kind: 'let_declaration',
		name: 'let with mut + type + value',
		source: 'fn main() { let mut x: i32 = 1; }',
		target: 'let mut x: i32 = 1;',
		mode: 'fail',
		why: 'Same as the simple let case — separator-outside-conditional pattern produces "let mut x :i32 =1 ;" (missing spaces around : and =, stray space before ;).'
	},
	{
		grammar: 'rust',
		kind: 'type_item',
		name: 'simple type alias renders without stray spaces',
		source: 'type Foo = i32;',
		target: 'type Foo = i32;',
		mode: 'fail',
		why: 'Walker emits "type Foo=i32;" — missing spaces around `=` and before `;`. Separators are outside conditionals and literal tokens lack surrounding whitespace.'
	},
	{
		grammar: 'rust',
		kind: 'type_item',
		name: 'pub type with generic params',
		source: 'pub type Foo<T> = Vec<T>;',
		target: 'pub type Foo<T> = Vec<T>;',
		mode: 'fail',
		why: 'Walker emits "pub type Foo <T>=Vec<T>;" — stray space before <T>, missing spaces around `=`. Separator placement issues on optional type_parameters slot.'
	},
	{
		grammar: 'rust',
		kind: 'trait_item',
		name: 'minimal trait without bounds renders cleanly',
		source: 'trait Foo {}',
		target: 'trait Foo {}',
		mode: 'pass'
	},
	{
		grammar: 'rust',
		kind: 'if_expression',
		name: 'if without else renders without trailing space',
		source: 'fn main() { if x { 1 } }',
		target: 'if x { 1 }',
		mode: 'pass'
	},
	{
		grammar: 'rust',
		kind: 'if_expression',
		name: 'if with else still renders correctly',
		source: 'fn main() { if x { 1 } else { 2 } }',
		target: 'if x { 1 } else { 2 }',
		mode: 'pass'
	},
	{
		grammar: 'rust',
		kind: 'while_expression',
		name: 'while without label renders without leading space',
		source: 'fn main() { while x {} }',
		target: 'while x {}',
		mode: 'pass'
	},
	{
		grammar: 'rust',
		kind: 'closure_expression',
		name: 'plain closure without modifiers renders without leading spaces',
		source: 'fn main() { let f = || 1; }',
		target: '|| 1',
		mode: 'pass'
	},

	// -------------------------------------------------------------------
	// TypeScript — top failing kinds
	// -------------------------------------------------------------------
	{
		grammar: 'typescript',
		kind: 'class_declaration',
		name: 'minimal class renders cleanly',
		source: 'class Foo {}',
		target: 'class Foo {}',
		mode: 'pass'
	},
	{
		grammar: 'typescript',
		kind: 'class_declaration',
		name: 'class with extends heritage',
		source: 'class Foo extends Bar {}',
		target: 'class Foo extends Bar {}',
		mode: 'pass'
	},
	{
		grammar: 'typescript',
		kind: 'type_alias_declaration',
		name: 'simple type alias renders without stray space',
		source: 'type Foo = string;',
		target: 'type Foo = string;',
		mode: 'fail',
		why: 'Walker emits "type Foo=string ;" — missing spaces around `=`, stray space before `;`. Separators around `=` and before semicolon must be inside conditionals or attached to adjacent tokens.'
	},
	{
		grammar: 'typescript',
		kind: 'statement_block',
		name: 'empty statement block renders as {} with no inner spacing',
		source: 'function f() {}',
		target: '{}',
		mode: 'fail',
		why: 'Template `{ {{ statements | join("\\n") }} }{{ automatic_semicolon }}` leaves "{  }" when statements is empty.'
	},
	{
		grammar: 'typescript',
		kind: 'statement_block',
		name: 'single-statement block keeps inner spacing',
		source: 'function f() { let x = 1; }',
		target: '{ let x = 1; }',
		mode: 'pass'
	},
	{
		grammar: 'typescript',
		kind: 'interface_declaration',
		name: 'minimal interface renders without stray spaces',
		source: 'interface Foo {}',
		target: 'interface Foo {}',
		mode: 'pass'
	},
	{
		grammar: 'typescript',
		kind: 'interface_declaration',
		name: 'interface with extends',
		source: 'interface Foo extends Bar {}',
		target: 'interface Foo extends Bar {}',
		mode: 'pass'
	},
	{
		grammar: 'typescript',
		kind: 'function_type',
		name: 'function type renders with spaces around =>',
		source: 'type F = (x: number) => string;',
		target: '(x: number) => string',
		mode: 'fail',
		why: 'Template `{{ type_parameters }} {{ parameters }}=>{{ return_type }}` leaves leading space when type_parameters absent and renders `=>` flush against neighbours instead of with surrounding spaces.'
	},
	{
		grammar: 'typescript',
		kind: 'expression_statement',
		name: 'expression statement attaches semicolon',
		source: 'x;',
		target: 'x;',
		mode: 'fail',
		why: 'Walker emits "x ;" — literal space between expression and semicolon. The space separator before `{{ semicolon }}` must be removed or made conditional on semicolon presence.'
	},

	// -------------------------------------------------------------------
	// Python — top failing kind
	// -------------------------------------------------------------------
	{
		grammar: 'python',
		kind: 'dictionary',
		name: 'empty dictionary renders as {} with no inner spacing',
		source: '{}',
		target: '{}',
		mode: 'pass'
	},
	{
		grammar: 'python',
		kind: 'dictionary',
		name: 'two-entry dictionary renders with separator + spaces',
		source: '{"a": 1, "b": 2}',
		target: '{"a": 1, "b": 2}',
		mode: 'fail',
		why: 'Walker emits \'{ "a": 1,"b": 2 }\' — inner-brace whitespace added by `{ {{ pairs | join(", ") }} }` template, joinBy drops the space after the separator between entries. Target has no inner-brace whitespace and "a": 1, "b": 2 with proper separator spacing.'
	}
];

// ---------------------------------------------------------------------------
// Test execution
// ---------------------------------------------------------------------------

describe('walker frozen output (Cluster F step 1)', () => {
	for (const c of FROZEN_CASES) {
		const label = `${c.grammar}/${c.kind}: ${c.name}`;
		if (c.mode === 'todo') {
			// it.todo — frozen target string is stale (e.g., walker
			// unification in spec 022 Phase 1d.iv changed rendered
			// output for kinds containing positional choices). Case
			// stays in the suite as a marker; re-derive the target
			// then promote to plain `it(...)`.
			it.todo(label);
		} else if (c.mode === 'pass') {
			it(
				label,
				async () => {
					const { rendered } = await parseAndRender(c.grammar, c.source, c.kind);
					expect(rendered).toBe(c.target);
				},
				30000
			);
		} else {
			// it.fails — assertion is INVERTED for the suite runner: a
			// currently-broken walker keeps the suite green here, and
			// a future walker fix flips this to a real assertion failure
			// signalling "this case can be promoted to plain `it(...)`".
			// TODO Cluster F next sub-commit: walker emits wrong output
			// for this case; promote to plain `it(...)` after the walker
			// fix lands.
			it.fails(
				label,
				async () => {
					const { rendered } = await parseAndRender(c.grammar, c.source, c.kind);
					expect(rendered).toBe(c.target);
				},
				30000
			);
		}
	}
});
