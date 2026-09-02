// Two invariants a parse must hold, both of which a single-tree native engine
// broke silently.
//
// TREE IDENTITY — a tree stays bound to the source it was parsed from. Node
// handles are dense per-tree indices starting at 0, so a handle minted against
// one tree is in range in every later tree; without a tree tag, descending into
// an earlier root resolves against the newest parse and returns unrelated nodes
// with no error raised. The root itself hides this: its own `$render()` replays
// the captured `$text` and never touches a handle, so only a drill-in shows it.
//
// VERBATIM SOURCE — an untouched parse renders back byte for byte. Two things
// have to hold for that: the root's captured text has to span the whole file
// (tree-sitter's root node starts at the first token, so leading blank lines
// and indentation sit outside it), and a root with no structural children at
// all still has to count as untouched.
import { createNativeEngine } from '@sittir/common/engine';
import { describe, expect, it } from 'vitest';
import { getActiveBackend } from '../src/backend.js';
import { createEngine } from '../src/engine.js';

/** A statement's rendered text — undefined for a keyword statement stored as
 *  its kind id, which has nothing to drill into. */
const render = (statement: unknown): string | undefined =>
	typeof statement === 'object' && statement !== null && '$render' in statement
		? (statement as { $render(): string }).$render()
		: undefined;

describe('tree identity across parses', () => {
	it('keeps an earlier root bound to its own source after a later parse', () => {
		const engine = createEngine();
		const first = engine.parse('fn alpha_one() { let x = 1; }');
		const second = engine.parse('mod beta_two { struct S; }');

		// Drill in — the root's own $render() replays captured text and would
		// pass even against a hijacked tree.
		const firstStatements = first.statements();
		const secondStatements = second.statements();

		expect(render(firstStatements?.[0])).toContain('alpha_one');
		expect(render(firstStatements?.[0])).not.toContain('beta_two');
		expect(render(secondStatements?.[0])).toContain('beta_two');
	});

	it('keeps a root usable when it is first touched only after later parses', () => {
		const engine = createEngine();
		const held = engine.parse('fn gamma_three() { let y = 2; }');
		engine.parse('fn delta_four() {}');
		engine.parse('fn epsilon_five() {}');

		expect(render(held.statements()?.[0])).toContain('gamma_three');
	});

	it('interleaves reads across two live trees', () => {
		const engine = createEngine();
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
		it(`round-trips ${JSON.stringify(source)} byte for byte`, () => {
			const engine = createEngine();
			expect(engine.parse(source).$render()).toBe(source);
		});
	}

	it('spans the whole file on the root, including leading trivia', () => {
		const engine = createEngine();
		const source = '\n\n  fn a() {}\n';
		const root = engine.parse(source);

		expect(root.$span).toEqual({ start: 0, end: source.length });
		expect(root.$text).toBe(source);
	});
});

describe('parsed trees are released', () => {
	/** The native engine the boundary talks to, so its tree table is visible. */
	function nativeEngine() {
		const status = getActiveBackend();
		return status.name === 'native' ? new status.native.SittirEngine() : null;
	}

	it('holds one tree per parse and drops them on request', () => {
		const native = nativeEngine();
		if (!native) return;

		expect(native.liveTreeCount).toBe(0);
		for (let i = 0; i < 20; i += 1) native.parseAndRead(`fn f${i}() {}`);
		expect(native.liveTreeCount).toBe(20);

		native.disposeTree(0);
		expect(native.liveTreeCount).toBe(19);
		// Dropping the same tree twice is not an error: the registry cannot
		// know whether a tree was already released.
		native.disposeTree(0);
		expect(native.liveTreeCount).toBe(19);

		native.dispose();
		expect(native.liveTreeCount).toBe(0);
	});

	it('ignores a nonsense tree id rather than dropping the first tree', () => {
		const native = nativeEngine();
		if (!native) return;

		native.parseAndRead('fn a() {}');
		expect(native.liveTreeCount).toBe(1);
		// `as` saturates, so an unchecked cast would turn both of these into
		// 0 — which names a real tree, and a live one.
		native.disposeTree(Number.NaN);
		native.disposeTree(-1);
		expect(native.liveTreeCount).toBe(1);

		native.disposeTree(0);
		expect(native.liveTreeCount).toBe(0);
	});

	it('releases trees the caller no longer holds', async () => {
		// Disposal is driven by the collector, so without a way to run it this
		// asserts nothing. Run vitest under `--expose-gc` to exercise it.
		if (typeof globalThis.gc !== 'function') return;
		const status = getActiveBackend();
		if (status.name !== 'native') return;

		// Hand the boundary an engine this test also holds, so the tree table
		// it fills is observable from here. `SittirEngine` is reached with
		// `new`, so this stand-in has to be constructible — an arrow function
		// is not, and swapping one in makes the boundary report no engine and
		// this test quietly assert nothing.
		const shared = new status.native.SittirEngine();
		const { engine, reason } = createNativeEngine({
			templatesPath: '',
			kindNames: new Map<number, string>(),
			getActiveBackend: () => ({
				name: 'native',
				native: {
					SittirEngine: function StandInEngine() {
						return shared;
					}
				}
			})
		} as never);
		expect(reason).toBeUndefined();
		expect(engine).not.toBeNull();
		if (!engine) return;

		const kept = engine.diagnostics.parseAndRead('fn kept() {}');
		for (let i = 0; i < 200; i += 1) engine.diagnostics.parseAndRead(`fn dropped${i}() {}`);
		expect(shared.liveTreeCount).toBe(201);

		for (let round = 0; round < 10 && shared.liveTreeCount > 1; round += 1) {
			globalThis.gc?.();
			await new Promise((resolve) => setTimeout(resolve, 20));
		}

		// Everything unreferenced is gone; the one still held is not.
		expect(shared.liveTreeCount).toBe(1);
		expect(kept.tree.read?.()).toBeDefined();
	});
});
