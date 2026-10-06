import { describe, expect, it } from 'vitest';
import { treeTokenOf } from '@sittir/common/utils';
import { loadNativeEngine } from '../common.ts';

async function roundTrip(grammar: string, source: string): Promise<string | null> {
	const engine = await loadNativeEngine(grammar);
	const treeId = treeTokenOf(engine.parse(source, { deep: true }) as object)?.treeId;
	if (treeId === undefined) throw new Error(`${grammar}: the parsed root holds no tree`);
	return engine.diagnostics.typedReadRoundTrip(treeId);
}

describe('a typed read crosses to JavaScript and back unchanged', () => {
	it.each([
		['rust', 'fn f() {\n    // note\n    a;\n}\n', 'a comment owned as trivia'],
		['rust', 'fn f() { let v = [1, 2, 3]; }', 'a separated list'],
		['rust', 'fn f() { x }', 'a text leaf held by a choice'],
		['typescript', 'const xs = [a, , b];', "an elided element's hole"],
		['typescript', 'a.get;', 'a keyword read as a property name'],
		['python', 'def f():\n    return x  # note\n', 'a trailing comment']
	])('%s: %s (%s)', async (grammar, source) => {
		expect(await roundTrip(grammar, source)).toBeNull();
	});
});
