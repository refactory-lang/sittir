import { createRequire } from 'node:module';
import { afterEach, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import type { NativeModuleLike } from '@sittir/common/engine';
import type { TreeHandle } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';
import { reportFor, storageBenchTestTimeout } from './storage-bench.helpers.ts';

const native = createRequire(import.meta.url)('../../scm/native/index.cjs') as Required<NativeModuleLike>;

afterEach(() => vi.restoreAllMocks());

it('parses a diagnostic tree without reading it, and keeps its root error stamp and cached identity', async () => {
	const read = vi.spyOn(native, 'read');
	const engine = await createEngine(await languageByName('scm'), { nodeStorage: 'object' });
	try {
		const tree = engine.diagnostics.parseTree('(identifier)') as TreeHandle;
		expect(read).not.toHaveBeenCalled();
		const root = tree.read!(0) as { $errors: readonly unknown[] };
		expect(root.$errors).toEqual([]);
		expect(tree.read!(0)).toBe(root);
		expect(read).toHaveBeenCalledTimes(1);
	} finally {
		engine.dispose();
	}
});

it('reads each diagnostic root at its own depth, keeping each tree, error stamp and cached identity', async () => {
	const read = vi.spyOn(native, 'read');
	const engine = await createEngine(await languageByName('scm'), { nodeStorage: 'object' });
	try {
		const first = engine.diagnostics.parseAndRead('(identifier)', { depth: 1 });
		const second = engine.diagnostics.parseAndRead('(identifier) @name', { depth: Infinity });
		const firstTree = first.tree as TreeHandle;
		const secondTree = second.tree as TreeHandle;
		expect(firstTree.id).not.toBe(secondTree.id);
		expect(read).toHaveBeenNthCalledWith(1, firstTree.id, 0, 1);
		expect(read).toHaveBeenNthCalledWith(2, secondTree.id, 0, Infinity);
		expect(first.root.$errors).toEqual([]);
		expect(second.root.$errors).toEqual([]);
		expect(firstTree.read!(0, 1)).toBe(first.root);
		expect(secondTree.read!(0, Infinity)).toBe(second.root);
		expect(read).toHaveBeenCalledTimes(2);
	} finally {
		engine.dispose();
	}
});

it.each(['python', 'regex', 'rust', 'scm', 'typescript'])(
	'%s deep arena validation covers the same typed candidates and outcomes as objects',
	async (grammar) => {
		const report = await reportFor([grammar, '--validation', '--rounds', '1', '--warmup', '0', '--iterations', '1']);
		expect(report.mode).toBe('validation-storage');
		expect(report.validationSamples).toHaveLength(2);
		expect(report.validationSamples.every((sample: { grammar: string }) => sample.grammar === grammar)).toBe(true);
	},
	storageBenchTestTimeout
);
