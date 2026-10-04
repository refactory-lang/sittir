import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

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

describe('an assignment target over aliased hidden storage', () => {
	it('builds the same envelope the reader reads', () => {
		const built = ts.build.assignmentExpression.strict({
			left: ts.build.lhsExpression.strict(ts.build.identifier('a')),
			right: ts.build.number('1')
		});
		expect(built.$render().toString()).toBe('a = 1');
		const assignment = findParsed(ts.parse('a = 1;'), ts.kinds.AssignmentExpression) as { left(): unknown } | undefined;
		expect(shapeOf(assignment?.left())).toEqual(shapeOf(built._left));
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
