// A bigint literal is one token: its digits and its `n` render with no space
// between them, in every radix, and reparse as one bigint.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

function textsOf(kind: number, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) textsOf(kind, item, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as { $type?: unknown; $text?: unknown };
		if (node.$type === kind && typeof node.$text === 'string') out.push(node.$text);
		for (const child of Object.values(value)) textsOf(kind, child, out);
	}
	return out;
}

describe('a bigint literal', () => {
	it.each([
		['42', '42n'],
		['0x2A', '0x2An'],
		['0b101010', '0b101010n'],
		['0o52', '0o52n']
	])('%s renders %s', (digits, text) => {
		expect(ir.number.bigint(digits).$render()).toBe(text);
	});

	it('reparses as one bigint', () => {
		const engine = createEngine();
		for (const digits of ['42', '0x2A', '0b101010', '0o52']) {
			const text = ir.number.bigint(digits).$render();
			const root = engine.diagnostics.parseAndRead(`const x = ${text};`, { deep: true }).root;
			expect(textsOf(TSKindId.NumberBigint, root)).toEqual([text]);
		}
	});
});
