// Runtime verification of the Python use-case examples against the native
// engine: every export executes and produces what the guide promises.
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/python';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildProbeSweepStrict, callStatementStrict } from '../../../examples/19-dogfood-python-strict.ts';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The generated rebuild is loaded by a computed path so tsc does not follow
// it: its type errors are counted under examples/generated-typecheck-ceiling.json,
// and vitest runs it regardless.
const generatedRebuild = (file: string, exportName: string) => async (): Promise<{ $render(): string }> => {
	const absolute = fileURLToPath(new URL(`../../../examples/${file}`, import.meta.url));
	const mod = (await import(pathToFileURL(absolute).href)) as Record<string, () => { $render(): string }>;
	return mod[exportName]!();
};
const rebuildPython4spaceGenerated = generatedRebuild('19-dogfood-python.generated.ts', 'rebuildPython4spaceGenerated');
const rebuildPython4spaceLoose = generatedRebuild('19-dogfood-python-loose.generated.ts', 'rebuildPython4spaceLoose');

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

// The loose rebuild: the same file through the bundle calls, with every
// coercion the loose contract admits spelled bare.
describe('examples/19 loose rebuild (python-4space.py)', () => {
	const target = new URL('../../../tests/format-roundtrip/fixtures/python-4space.py', import.meta.url).pathname;
	it('renders', async () => {
		expect((await rebuildPython4spaceLoose()).$render()).toContain('def ');
	});
	it('re-parses to the same tree as the real file', async () => {
		expect(dogfoodContract(createEngine(), await rebuildPython4spaceLoose(), target).reparsesEqual).toBe(true);
	});
});
