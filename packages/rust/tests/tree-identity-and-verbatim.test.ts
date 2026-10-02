// Two invariants a parse must hold, both of which a single-tree native engine
// broke silently.
//
// TREE IDENTITY — a tree stays bound to the source it was parsed from. Node
// handles are dense per-tree indices starting at 0, so a handle minted against
// one tree is in range in every later tree; without a tree tag, descending into
// an earlier root resolves against the newest parse and returns unrelated nodes
// with no error raised. The root itself hides this: its own `$render()` replays
// the captured `$text` and never touches a handle, so only a hydration shows it.
//
// VERBATIM SOURCE — an untouched parse renders back byte for byte. Two things
// have to hold for that: the root's captured text has to span the whole file
// (tree-sitter's root node starts at the first token, so leading blank lines
// and indentation sit outside it), and a root with no structural children at
// all still has to count as untouched.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

/** A statement's rendered text — undefined for a keyword statement stored as
 *  its kind id, which has nothing to hydrate into. */
const render = (statement: unknown): string | undefined =>
	typeof statement === 'object' && statement !== null && '$render' in statement
		? (statement as { $render(): string }).$render()
		: undefined;

describe('tree identity across parses', () => {
	it('keeps an earlier root bound to its own source after a later parse', async () => {
		const engine = await createEngine(rust);
		const first = engine.parse('fn alpha_one() { let x = 1; }');
		const second = engine.parse('mod beta_two { struct S; }');

		// Hydrate — the root's own $render() replays captured text and would
		// pass even against a hijacked tree.
		const firstStatements = first.statements();
		const secondStatements = second.statements();

		expect(render(firstStatements?.[0])).toContain('alpha_one');
		expect(render(firstStatements?.[0])).not.toContain('beta_two');
		expect(render(secondStatements?.[0])).toContain('beta_two');
	});

	it('keeps a root usable when it is first touched only after later parses', async () => {
		const engine = await createEngine(rust);
		const held = engine.parse('fn gamma_three() { let y = 2; }');
		engine.parse('fn delta_four() {}');
		engine.parse('fn epsilon_five() {}');

		expect(render(held.statements()?.[0])).toContain('gamma_three');
	});

	it('interleaves reads across two live trees', async () => {
		const engine = await createEngine(rust);
		const a = engine.parse('fn a_one() {}');
		const b = engine.parse('fn b_two() {}');

		// Alternate so neither tree is simply "the current one".
		expect(render(a.statements()?.[0])).toContain('a_one');
		expect(render(b.statements()?.[0])).toContain('b_two');
		expect(render(a.statements()?.[0])).toContain('a_one');
		expect(render(b.statements()?.[0])).toContain('b_two');
	});
});

describe('untouched parses render verbatim', () => {
	const VERBATIM = [
		'fn a() {}',
		'fn a() {}\n',
		'\nfn a() {}\n',
		'\n\n// leading blank lines\nfn a() {}\n',
		'  fn a() {}  ',
		'\tfn indented() {}\n',
		'// lead\nfn a() {}\n',
		'fn a() {}\n// trail\n',
		'// just a comment\n',
		'   \n\n  ',
		''
	];

	for (const source of VERBATIM) {
		it(`round-trips ${JSON.stringify(source)} byte for byte`, async () => {
			const engine = await createEngine(rust);
			expect(engine.parse(source).$render()).toBe(source);
		});
	}

	it('spans the whole file on the root, including leading trivia', async () => {
		const native = (await rust.load()).createNative();
		const source = '\n\n  fn a() {}\n';
		const { root, tree } = native.parseAndRead(source) as { root: { $span: unknown }; tree: { source: string } };

		expect(root.$span).toEqual({ start: 0, end: source.length });
		expect(tree.source).toBe(source);
	});
});
