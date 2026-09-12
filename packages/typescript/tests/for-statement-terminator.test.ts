// The reader must not seat a slot's separator: typescript's
// `for_statement.condition` is field-tagged together with the `;` that
// terminates it. Unlike python's `for_in_clause.right` (a repeated slot,
// whose `,` the separator table drops), the field here wraps a singular
// `seq(_expressions, ';')`, which the table does not cover: the read seats
// the `;` beside the expression, and the render template prints no `;`
// after the condition either, so a provenance-detached rebuild of
// `for (let i = 0; i < 3; i++) {}` renders `for (let i = 0;i < 3 i++) {}`.
// Coordinate folding hides both from the read-render-parse counts.
import { sliceSpan } from '@sittir/common';
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { TSKindId } from '../src/types.js';

const SOURCE = 'for (let i = 0; i < 3; i++) {}\n';

type Read = { readonly $type: number; readonly $span: { start: number; end: number } };

describe('for_statement.condition', () => {
	it.fails('holds the condition alone — today the read seats the `;` beside the expression', () => {
		const engine = createEngine();
		const { root } = engine.diagnostics.parseAndRead(SOURCE, { deep: true });
		const statement = (root as unknown as { _statements: { _condition: unknown } | { _condition: unknown }[] })
			._statements;
		const forStatement = Array.isArray(statement) ? statement[0]! : statement;
		const condition = forStatement._condition;
		// A seated separator would make the slot an array of two: the
		// expression and the `;` token.
		expect(Array.isArray(condition)).toBe(false);
		const node = condition as Read;
		expect(node.$type).toBe(TSKindId.BinaryExpression);
		expect(sliceSpan(SOURCE, node.$span)).toBe('i < 3');
	});
});
