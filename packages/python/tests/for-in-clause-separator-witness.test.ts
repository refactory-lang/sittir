import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/python';

function stripText(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(stripText);
	if (node === null || typeof node !== 'object') return node;
	const record = node as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(record)) {
		if (key === '$text') continue;
		out[key] = stripText(value);
	}
	return out;
}

describe('for_in_clause right side — a $text-stripped rebuild of a bare-tuple iterable', () => {
	it.fails(
		'OPEN: the native reader delivers the field-tagged separator into a mixedEnum array slot; a deep $text-stripped rebuild renders unknown kind id (comma)',
		() => {
			const source = '[a for a in lambda: True, lambda: False if a()]';
			const engine = createEngine();
			const { root } = engine.diagnostics.parseAndRead(source, { deep: true });
			const listComprehension = (
				root as unknown as {
					_statements: { _simple_statements_elements: { _simple_statement: { _list_comprehension: unknown } } };
				}
			)._statements._simple_statements_elements._simple_statement._list_comprehension;
			const rendered = engine.render(stripText(listComprehension) as never).toString();
			expect(rendered).toBe(source);
		}
	);
});
