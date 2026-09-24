import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '../src/index.ts';

function leftOf(root: unknown): { $type: number; _identifier?: { $text?: string } } | undefined {
	const statements = (root as { _statements?: { _expression?: { _left?: unknown } } })._statements;
	return statements?._expression?._left as { $type: number; _identifier?: { $text?: string } } | undefined;
}

describe('a contextual keyword folds into its identifier display arm', () => {
	it('assignmentExpression.identifier takes a keyword spelling, renders it and reparses it as the identifier', () => {
		const built = ir.assignmentExpression.identifier({ left: ['async'], right: ir.identifier('b') });
		const text = built.$render().toString();
		expect(text).toBe('async = b');
		const { root } = createEngine().diagnostics.parseAndRead(`${text};`, { deep: true });
		expect(leftOf(root)?._identifier?.$text).toBe('async');
	});
});
