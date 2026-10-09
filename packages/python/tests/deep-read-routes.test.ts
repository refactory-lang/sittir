import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

type Stored = Record<string, unknown>;

function storedOfKind(node: unknown, kind: number): Stored | undefined {
	if (node === null || typeof node !== 'object') return undefined;
	if (Array.isArray(node)) {
		for (const entry of node) {
			const found = storedOfKind(entry, kind);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if ((node as Stored).$type === kind) return node as Stored;
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_')) continue;
		const found = storedOfKind((node as Stored)[key], kind);
		if (found !== undefined) return found;
	}
	return undefined;
}

const readDeep = (source: string): unknown => py.diagnostics.parseAndRead(source, { depth: 8 }).root;

describe('a child read ahead of its parent is stored under its model slot', () => {
	it('a list the parser keys by its kind is stored under the slot the model names, and its accessor wraps it', () => {
		const statement = storedOfKind(readDeep('from a import b, c\n'), py.kinds.ImportFromStatement);
		expect(statement).toHaveProperty('_content');
		expect(statement).not.toHaveProperty('_import_list');
		const parsed = py.parse('from a import b, c\n', { depth: 8 }).$query().$descendants.ofType(py.kinds.ImportFromStatement).find();
		if (parsed === undefined) throw new Error('expected an import-from statement');
		const list = parsed.content() as unknown as ArrayLike<unknown> & { $render(): unknown };
		expect(typeof list.$render).toBe('function');
		expect(list.length).toBe(2);
	});

	it('a list owner sizes its view from the list read ahead with it', () => {
		const parsed = py.parse('def f(a, b): pass\n', { depth: 8 }).statements()[0];
		if (parsed === undefined || !py.is.functionDefinition(parsed)) throw new Error('expected a function definition');
		expect(parsed.parameters().length).toBe(2);
	});
});
