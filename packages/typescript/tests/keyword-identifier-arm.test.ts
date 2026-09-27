import { describe, expect, it } from 'vitest';
import { createEngine, ir, TSKindId } from '../src/index.ts';

function readLeftContent(text: string): { $type: number; $text?: string } | undefined {
	const { root } = createEngine().diagnostics.parseAndRead(`${text};`, { deep: true });
	const statements = (root as { _statements?: { _expression?: { _left?: { _content?: unknown } } } })._statements;
	return statements?._expression?._left?._content as { $type: number; $text?: string } | undefined;
}

describe('a contextual keyword at a slot that declares it as a keyword arm', () => {
	it('loose text resolves to the keyword arm the parser reads', () => {
		const built = ir.assignmentExpression({ left: 'async', right: ir.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		expect((built._left as unknown as { _content: unknown })._content).toBe(TSKindId.AsyncKeyword);
		expect(readLeftContent(text)?.$type).toBe(TSKindId.AsyncKeyword);
	});

	it('loose text that is not a keyword arm stays an identifier', () => {
		const built = ir.assignmentExpression({ left: 's', right: ir.identifier('b') });
		const text = built.$render().toString();
		expect(readLeftContent(text)).toMatchObject({ $type: TSKindId.Identifier, $text: 's' });
	});

	it('rejects an identifier spelled as the keyword arm', () => {
		expect(() => ir.assignmentExpression({ left: ir.identifier('async'), right: ir.identifier('b') })).toThrow(
			"LhsExpression.content: 'async' is this slot's keyword"
		);
	});
});
