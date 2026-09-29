import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsNative = (await typescript.load()).createNative();

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
		const built = ts.build.assignmentExpression.strict({
			left: ts.build.lhsExpression.strict(ts.build.identifier('a')),
			right: ts.build.number('1')
		});
		expect(built.$render().toString()).toBe('a = 1');
		const { root } = tsNative.parseAndRead('a = 1;', { deep: true });
		const read = (root as { _statements?: { _expression?: { _left?: unknown } } })._statements?._expression?._left;
		expect(shapeOf(read)).toEqual(shapeOf(built._left));
	});

	it('takes a bare string on the loose surface and builds the strict envelope', () => {
		const loose = ts.build.assignmentExpression({ left: 'result', right: ts.build.number('1') });
		const strict = ts.build.assignmentExpression.strict({
			left: ts.build.lhsExpression.strict(ts.build.identifier('result')),
			right: ts.build.number('1')
		});
		expect(loose.$render().toString()).toBe('result = 1');
		expect(shapeOf(loose)).toEqual(shapeOf(strict));
	});
});
