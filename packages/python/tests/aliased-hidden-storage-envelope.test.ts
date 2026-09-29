import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyNative = (await python.load()).createNative();

function shapeOf(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(shapeOf);
	if (node === null || typeof node !== 'object') return node;
	return Object.fromEntries(
		Object.entries(node as Record<string, unknown>)
			.filter(([key, value]) => typeof value !== 'function' && (key === '$type' || !key.startsWith('$')))
			.map(([key, value]) => [key, shapeOf(value)])
	);
}

function findKind(node: unknown, kind: number): unknown {
	if (Array.isArray(node)) return node.map((child) => findKind(child, kind)).find((hit) => hit !== undefined);
	if (node === null || typeof node !== 'object') return undefined;
	if ((node as { $type?: number }).$type === kind) return node;
	return Object.entries(node as Record<string, unknown>)
		.filter(([key]) => key.startsWith('_'))
		.map(([, child]) => findKind(child, kind))
		.find((hit) => hit !== undefined);
}

describe('a case pattern over aliased hidden storage', () => {
	it('builds the same envelope the reader reads', () => {
		const built = py.build.casePattern.strict(
			py.build.simplePattern.strict(
				py.build.classPattern.strict({ name: py.build.dottedName.strict(py.build.identifier('a'), py.build.identifier('test')) })
			)
		);
		expect(py.render(built).toString()).toBe('a.test()');
		const { root } = pyNative.parseAndRead('match x:\n    case a.test():\n        pass\n', {
			deep: true
		});
		expect(shapeOf(findKind(root, py.kinds.CasePattern))).toEqual(shapeOf(built));
	});
});
