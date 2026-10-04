import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

function shapeOf(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(shapeOf);
	if (node === null || typeof node !== 'object') return node;
	return Object.fromEntries(
		Object.entries(node as Record<string, unknown>)
			.filter(([key, value]) => typeof value !== 'function' && (key === '$type' || !key.startsWith('$')))
			.map(([key, value]) => [key, shapeOf(value)])
	);
}

function memberNames(node: object): string[] {
	const names = new Set<string>();
	for (let o: object | null = node; o !== null && o !== Object.prototype && o !== Array.prototype; o = Object.getPrototypeOf(o)) {
		for (const name of Object.getOwnPropertyNames(o)) if (/^[a-z]/.test(name) && !(name in Array.prototype)) names.add(name);
	}
	return [...names];
}

function findParsed(node: unknown, kind: number): Record<string, unknown> | undefined {
	if (node === null || typeof node !== 'object') return undefined;
	if ((node as { $type?: unknown }).$type === kind) return node as Record<string, unknown>;
	for (const name of memberNames(node)) {
		const member = (node as Record<string, unknown>)[name];
		if (typeof member !== 'function' || member.length !== 0) continue;
		const held: unknown = member.call(node);
		for (const child of Array.isArray(held) ? held : [held]) {
			const found = findParsed(child, kind);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

const accessorOf = (storageKey: string): string => storageKey.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function parsedShape(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(parsedShape);
	if (node === null || typeof node !== 'object') return node;
	const record = node as Record<string, unknown>;
	return Object.fromEntries(
		Object.entries(record)
			.filter(([key, value]) => typeof value !== 'function' && (key === '$type' || !key.startsWith('$')))
			.map(([key, value]) => {
				const accessor = key.startsWith('_') ? record[accessorOf(key)] : undefined;
				return [key, parsedShape(typeof accessor === 'function' && accessor.length === 0 ? accessor.call(node) : value)];
			})
	);
}

describe('a case pattern over aliased hidden storage', () => {
	it('builds the same envelope the reader reads', () => {
		const built = py.build.casePattern.strict(
			py.build.simplePattern.strict(
				py.build.classPattern.strict({ name: py.build.dottedName.strict(py.build.identifier('a'), py.build.identifier('test')) })
			)
		);
		expect(py.render(built).toString()).toBe('a.test()');
		const read = findParsed(py.parse('match x:\n    case a.test():\n        pass\n'), py.kinds.CasePattern);
		expect(parsedShape(read)).toEqual(shapeOf(built));
	});
});
