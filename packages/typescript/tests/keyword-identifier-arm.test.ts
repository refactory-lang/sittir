import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsNative = (await typescript.load()).createNative();

function readLeftContent(text: string): { $type: number; $text?: string } | undefined {
	const { root } = tsNative.parseAndRead(`${text};`, { deep: true });
	const statements = (root as { _statements?: { _expression?: { _left?: { _content?: unknown } } } })._statements;
	return statements?._expression?._left?._content as { $type: number; $text?: string } | undefined;
}

describe('a contextual keyword at a slot that declares it as a keyword arm', () => {
	it('loose text resolves to the keyword arm the parser reads', () => {
		const built = ts.build.assignmentExpression({ left: 'async', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		expect((built._left as unknown as { _content: unknown })._content).toBe(ts.kinds.AsyncKeyword);
		expect(readLeftContent(text)?.$type).toBe(ts.kinds.AsyncKeyword);
	});

	it('loose text that is not a keyword arm stays an identifier', () => {
		const built = ts.build.assignmentExpression({ left: 's', right: ts.build.identifier('b') });
		const text = built.$render().toString();
		expect(readLeftContent(text)).toMatchObject({ $type: ts.kinds.Identifier, $text: 's' });
	});

	it('rejects an identifier spelled as the keyword arm', () => {
		expect(() => ts.build.assignmentExpression({ left: ts.build.identifier('async'), right: ts.build.identifier('b') })).toThrow(
			"LhsExpression.content: 'async' is this slot's keyword"
		);
	});
});
