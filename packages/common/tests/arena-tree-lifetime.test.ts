import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { cellFormatOf } from '@sittir/common/engine';
import { coordinateOf, treeOf } from '@sittir/common/utils';
import { getActiveBackend as pythonBackend } from '../../python/src/backend.ts';
import { getActiveBackend as rustBackend } from '../../rust/src/backend.ts';
import { getActiveBackend as typescriptBackend } from '../../typescript/src/backend.ts';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

function addon(backend: typeof rustBackend = rustBackend) {
	const status = backend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native;
}

const SOURCE = 'fn f(a: u8) -> u8 {\n    // why\n    a + 1\n}\n\nfn g() {}\n';

describe('an arena parse', () => {
	it('leaves no live tree once parse returns', async () => {
		using rs = await createEngine(rust, { nodeStorage: 'arena' });
		const before = addon().liveTreeCount();
		const root = rs.parse(SOURCE);
		expect(addon().liveTreeCount()).toBe(before);
		expect(rs.render(root).toString()).toBe(SOURCE);
		expect(addon().liveTreeCount()).toBe(before);
	});

	it('leaves no per-tree memory once parse returns', async () => {
		using rs = await createEngine(rust, { nodeStorage: 'arena' });
		const before = addon().treeMemory();
		const root = rs.parse(SOURCE);
		expect(rs.render(root).toString()).toBe(SOURCE);
		expect(addon().treeMemory()).toEqual(before);
	});

	it('names its root by its node, with no tree', async () => {
		using rs = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse(SOURCE);
		expect(treeOf(root)?.id).toBeUndefined();
		const at = coordinateOf(root) as object;
		expect(Object.keys(at).sort()).toEqual(['$node', '$span', '$type']);
	});

	it('keeps a tree per parse in object storage', async () => {
		using rs = await createEngine(rust, { nodeStorage: 'object' });
		const before = addon().liveTreeCount();
		const root = rs.parse(SOURCE);
		expect(addon().liveTreeCount()).toBe(before + 1);
		expect(typeof treeOf(root)?.id).toBe('number');
	});
});

describe('a built node that holds a parsed node', () => {
	it('renders the same after the parsed root is released', async () => {
		using rs = await createEngine(rust, { nodeStorage: 'arena' });
		const root = rs.parse(SOURCE);
		const first = root.statements()[0]!;
		if (!rs.is.functionItem(first)) throw new Error('not a function item');
		const built = rs.build.functionItem({ name: rs.build.identifier('h'), parameters: rs.build.parameters(), body: first.body() });
		const before = rs.render(built).toString();
		expect(before).toContain('// why');
		rs.release(root);
		expect(rs.render(built).toString()).toBe(before);
	});
});

describe('a link record', () => {
	it('takes 8 words', () => {
		expect(cellFormatOf(addon())?.linkWords).toBe(8);
	});
});

const NESTED = 10_000;
const nested = (open: string, close: string): string => `${open.repeat(NESTED)}1${close.repeat(NESTED)}`;

describe('a deeply nested source', () => {
	it.each([
		['rust', rust, rustBackend, `fn f() {\n    let x = ${nested('(', ')')};\n}\n`],
		['typescript', typescript, typescriptBackend, `let x = ${nested('(', ')')};\n`],
		['python', python, pythonBackend, `x = ${nested('(', ')')}\n`]
	] as const)('%s: hydrates at parse and renders as read', async (_name, language, backend, source) => {
		using engine = await createEngine(language as typeof rust, { nodeStorage: 'arena' });
		const live = (): number => addon(backend as typeof rustBackend).liveTreeCount();
		const before = live();
		const root = engine.parse(source);
		expect(live()).toBe(before);
		expect(engine.render(root).toString()).toBe(source);
	}, 120_000);
});
