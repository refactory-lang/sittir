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
	loadKindNameFromId,
	treeHandle,
	findFirst
} from '../validate/common.ts';

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

type Grammar = 'rust' | 'typescript' | 'python';

function templatesDirFor(grammar: Grammar): string {
	return resolve(
		fileURLToPath(new URL('../../../..', import.meta.url)),
		`packages/${grammar}/templates`
	);
}

const renderers: Partial<
	Record<Grammar, ReturnType<typeof createRenderer>>
> = {};
async function rendererFor(
	grammar: Grammar
): Promise<ReturnType<typeof createRenderer>> {
	const cached = renderers[grammar];
	if (cached) return cached;
	const kindNameFromId = await loadKindNameFromId(grammar);
	const r = createRenderer(templatesDirFor(grammar), {
		kindNameFromId: kindNameFromId ?? undefined
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
async function parseAndRender(
	grammar: Grammar,
	source: string,
	kind: string
): Promise<ParseAndRenderResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree)
		throw new Error(`parseAndRender: parse failed for ${grammar} source`);

	const target = findFirst(tree.rootNode, kind);
	if (!target) {
		throw new Error(
			`parseAndRender: no ${kind} found in parsed source: ${JSON.stringify(source)}`
		);
	}

	const readTreeNodeFn = await loadReadTreeNode(grammar);
	if (!readTreeNodeFn) {
		throw new Error(`parseAndRender: no readTreeNode loader for ${grammar}`);
	}

	const kindIdFromName = await loadKindIdFromName(grammar);
	const handle = treeHandle(tree, source, kindIdFromName ?? undefined);
	const nodeData = readTreeNodeFn(handle, target.id) as AnyNodeData;

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
	 *  Cluster F sub-commit that should fix it. */
	mode: 'pass' | 'fail';
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
		mode: 'fail',
		why: 'forms-out-of-nodeMap: anonymous token `{` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve it to $type: 0 (id=0 sentinel). The rendered output is empty rather than `{ let x = 1; }`.'
	},
	{
		grammar: 'rust',
		kind: 'function_item',
		name: 'minimal fn renders without stray spaces',
		source: 'fn main() {}',
		target: 'fn main() {}',
		mode: 'fail',
		why: 'visibility_modifier + function_modifiers are optional; absent slots leave leading double-space and stray spaces around return_type / where_clause / type_parameters. All separators must move INSIDE conditionals.'
	},
	{
		grammar: 'rust',
		kind: 'function_item',
		name: 'fn with params + return type + body',
		source: 'fn add(x: i32, y: i32) -> i32 { x + y }',
		target: 'fn add(x: i32, y: i32) -> i32 { x + y }',
		mode: 'fail',
		why: 'Even with all optionals present, the walker emits double-spaces (e.g. "fn add  (...)") because of unconditional literal spaces between optional-but-empty type_parameters and the next slot.'
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
		why: 'Template prefixes a `{% if visibility_modifier | isPresent %}{{ visibility_modifier }}{% endif %}` which leaves a leading space when visibility absent. Also missing space around = and stray space before ;.'
	},
	{
		grammar: 'rust',
		kind: 'type_item',
		name: 'pub type with generic params',
		source: 'pub type Foo<T> = Vec<T>;',
		target: 'pub type Foo<T> = Vec<T>;',
		mode: 'fail',
		why: 'Walker emits "pub type Foo <T> =Vec<T> ;" — stray space before <T>, missing space around =, stray space before ;.'
	},
	{
		grammar: 'rust',
		kind: 'trait_item',
		name: 'minimal trait without bounds renders cleanly',
		source: 'trait Foo {}',
		target: 'trait Foo {}',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: `type_identifier` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve the name node to $type: 0 (id=0 sentinel). Rendering fails rather than producing "trait Foo {}".'
	},
	{
		grammar: 'rust',
		kind: 'if_expression',
		name: 'if without else renders without trailing space',
		source: 'fn main() { if x { 1 } }',
		target: 'if x { 1 }',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: numeric dispatch resolves to id=0 for form kinds embedded in this subtree, causing No render template for \'267\' errors at runtime. Whole render fails rather than producing the expected output.'
	},
	{
		grammar: 'rust',
		kind: 'if_expression',
		name: 'if with else still renders correctly',
		source: 'fn main() { if x { 1 } else { 2 } }',
		target: 'if x { 1 } else { 2 }',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: same as the if-without-else case — No render template for \'267\' error prevents the subtree from rendering.'
	},
	{
		grammar: 'rust',
		kind: 'while_expression',
		name: 'while without label renders without leading space',
		source: 'fn main() { while x {} }',
		target: 'while x {}',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: No render template for \'277\' error for a form kind embedded in the while subtree — rendering throws rather than producing expected output.'
	},
	{
		grammar: 'rust',
		kind: 'closure_expression',
		name: 'plain closure without modifiers renders without leading spaces',
		source: 'fn main() { let f = || 1; }',
		target: '|| 1',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: `closure_expression_expr` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve it to $type: 0 (id=0 sentinel). Rendering fails with unknown kind error.'
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
		mode: 'fail',
		why: 'forms-out-of-nodeMap: `type_identifier` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve the name to $type: 0 (id=0 sentinel). Rendering fails rather than producing "class Foo {}".'
	},
	{
		grammar: 'typescript',
		kind: 'class_declaration',
		name: 'class with extends heritage',
		source: 'class Foo extends Bar {}',
		target: 'class Foo extends Bar {}',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: same as the minimal-class case — `type_identifier` resolves to $type: 0 sentinel, rendering fails.'
	},
	{
		grammar: 'typescript',
		kind: 'type_alias_declaration',
		name: 'simple type alias renders without stray space',
		source: 'type Foo = string;',
		target: 'type Foo = string;',
		mode: 'fail',
		why: 'Template emits `=` directly with no surrounding spaces and `{{ semicolon }}` with leading space — produces "type Foo =string ;".'
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
		mode: 'fail',
		why: 'forms-out-of-nodeMap: anonymous token `{` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve it to $type: 0 (id=0 sentinel). The rendered output is empty rather than `{ let x = 1; }`.'
	},
	{
		grammar: 'typescript',
		kind: 'interface_declaration',
		name: 'minimal interface renders without stray spaces',
		source: 'interface Foo {}',
		target: 'interface Foo {}',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: `type_identifier` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve the name to $type: 0 (id=0 sentinel). Rendering fails rather than producing "interface Foo {}".'
	},
	{
		grammar: 'typescript',
		kind: 'interface_declaration',
		name: 'interface with extends',
		source: 'interface Foo extends Bar {}',
		target: 'interface Foo extends Bar {}',
		mode: 'fail',
		why: 'forms-out-of-nodeMap: same as the minimal-interface case — `type_identifier` resolves to $type: 0 sentinel, rendering fails.'
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
		why: 'Template `{{ children | join(" ") }} {{ semicolon }}` puts a literal space between children and the semicolon, producing "x ;".'
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
		mode: 'fail',
		why: 'forms-out-of-nodeMap: anonymous token `{` has no numeric TSKindId — kindIdFromName throws for it, causing readTreeNode to resolve it to $type: 0 (id=0 sentinel). The rendered output fails rather than producing "{}".'
	},
	{
		grammar: 'python',
		kind: 'dictionary',
		name: 'two-entry dictionary renders with separator + spaces',
		source: '{"a": 1, "b": 2}',
		target: '{"a": 1, "b": 2}',
		mode: 'fail',
		why: 'Walker emits `{ "a": 1,"b": 2 }` — joinWithTrailing(",") drops the space after the separator AND adds stray spaces around the braces. Target has no inner-brace whitespace and the canonical ", " separator.'
	}
];

// ---------------------------------------------------------------------------
// Test execution
// ---------------------------------------------------------------------------

describe('walker frozen output (Cluster F step 1)', () => {
	for (const c of FROZEN_CASES) {
		const label = `${c.grammar}/${c.kind}: ${c.name}`;
		if (c.mode === 'pass') {
			it(
				label,
				async () => {
					const { rendered } = await parseAndRender(
						c.grammar,
						c.source,
						c.kind
					);
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
					const { rendered } = await parseAndRender(
						c.grammar,
						c.source,
						c.kind
					);
					expect(rendered).toBe(c.target);
				},
				30000
			);
		}
	}
});
