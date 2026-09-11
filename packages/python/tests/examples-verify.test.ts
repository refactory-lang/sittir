// Runtime verification of the Python use-case examples against the native
// engine: every export executes and produces what the guide promises.
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/python';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildProbeSweep, callStatement } from '../../../examples/19-dogfood-python.ts';
import { rebuildProbeSweepStrict, callStatementStrict } from '../../../examples/19-dogfood-python-strict.ts';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The generated rebuild is loaded by a computed path so tsc does not follow
// it: its type errors are counted under examples/generated-typecheck-ceiling.json,
// and vitest runs it regardless.
const rebuildPython4spaceGenerated = async (): Promise<{ $render(): string }> => {
	const absolute = fileURLToPath(new URL('../../../examples/19-dogfood-python.generated.ts', import.meta.url));
	const mod = (await import(pathToFileURL(absolute).href)) as Record<string, () => { $render(): string }>;
	return mod.rebuildPython4spaceGenerated!();
};

// GAP inventory (examples/19): D=2 (every suite-carrying slot rejects a block,
// at BOTH layers; the strict statement list rejects what the coercer accepts)
// A=1 (import statements route through a hidden list with no public
// constructor). No function definition can be built by any path.
describe('examples/19 dogfood python (probe-sweep.py) — coercion surface', () => {
	const target = new URL('../../tools/scripts/probe-sweep.py', import.meta.url).pathname;
	it('builds and renders the fragments that cross the boundary', () => {
		const rendered = rebuildProbeSweep().$render();
		expect(rendered.startsWith('#!/usr/bin/env python3\n')).toBe(true);
		expect(rendered).toContain('# import argparse\n');
		expect(rendered.endsWith('\nmain()\n')).toBe(true);
	});
	it('composes a call statement, which the module then holds as a simple-statements line', () => {
		expect(callStatement().$render()).toBe('main()');
	});
	it.fails('re-parses to the same tree as the real file', async () => {
		expect(dogfoodContract(createEngine(), rebuildProbeSweep(), target).reparsesEqual).toBe(true);
	});
	it.fails('is identical to the real file modulo whitespace', () => {
		expect(dogfoodContract(createEngine(), rebuildProbeSweep(), target).sameModuloWhitespace).toBe(true);
	});
});

describe('examples/19 dogfood python — strict factory surface', () => {
	it('composes a call statement with strict inner nodes', () => {
		expect(callStatementStrict().$render()).toBe('main()\n');
	});
	it('assembles the statements the coercion surface assembles', () => {
		expect(rebuildProbeSweepStrict().$render()).toContain('#!/usr/bin/env python3');
	});
});

// Ceiling, never a floor: an artefact kind moves off the top-level namespace
// onto its parent, so this count only shrinks.
describe('ir entry ratchet', () => {
	it('exposes no more top-level builders than the recorded ceiling', () => {
		// Grouped namespaces and `synonym` are objects, not builders — the
		// ratchet tracks builder exposure, so only callable entries count.
		const builders = Object.keys(ir).filter((k) => typeof (ir as Record<string, unknown>)[k] === 'function');
		expect(builders.length).toBeLessThanOrEqual(197);
	});
});

// The generated rebuild: `sittir tool emit-factory-source` over the 4-space
// fixture (probe-sweep.py is not a target: the override parser rejects its
// `name=True` keyword defaults, see "Where the examples stand").
describe('examples/19 generated rebuild (python-4space.py)', () => {
	const target = new URL('../../../tests/format-roundtrip/fixtures/python-4space.py', import.meta.url).pathname;
	it('renders — the seated spellings reach ir', async () => {
		expect((await rebuildPython4spaceGenerated()).$render()).toContain('def ');
	});
	it('re-parses to the same tree as the real file', async () => {
		expect(dogfoodContract(createEngine(), await rebuildPython4spaceGenerated(), target).reparsesEqual).toBe(true);
	});
});
