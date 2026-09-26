import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '../src/index.ts';

function shapeOf(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(shapeOf);
	if (node === null || typeof node !== 'object') return node;
	return Object.fromEntries(
		Object.entries(node as Record<string, unknown>)
			.filter(([key, value]) => typeof value !== 'function' && (key === '$type' || !key.startsWith('$')))
			.map(([key, value]) => [key, shapeOf(value)])
	);
}

describe('an assignment target over aliased hidden storage', () => {
	it('builds the same envelope the reader reads', () => {
		const built = ir.assignmentExpression.strict({
			left: ir.lhsExpression.strict(ir.identifier('a')),
			right: ir.number('1')
		});
		expect(built.$render().toString()).toBe('a = 1');
		const { root } = createEngine().diagnostics.parseAndRead('a = 1;', { deep: true });
		const read = (root as { _statements?: { _expression?: { _left?: unknown } } })._statements?._expression?._left;
		expect(shapeOf(read)).toEqual(shapeOf(built._left));
	});
});
