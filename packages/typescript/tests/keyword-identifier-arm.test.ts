import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '../src/index.ts';

function leftOf(root: unknown): { $type: number; _content?: { $text?: string } } | undefined {
	const statements = (root as { _statements?: { _expression?: { _left?: unknown } } })._statements;
	return statements?._expression?._left as { $type: number; _content?: { $text?: string } } | undefined;
}

describe('a contextual keyword spelled as an identifier', () => {
	it('renders as the identifier and reparses as the identifier', () => {
		const built = ir.assignmentExpression({ left: ir.identifier('async'), right: ir.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		const { root } = createEngine().diagnostics.parseAndRead(`${text};`, { deep: true });
		expect(leftOf(root)?._content?.$text).toBe('async');
	});
});
