import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const b = ts.build;

describe('a list whose element admits a hole', () => {
	it('keeps an absent item as a hole', () => {
		const array = b.array(b.identifier('a'), undefined, b.identifier('b'));
		expect(array.elements()).toHaveLength(3);
		expect(array.$render()).toMatch(/^\[a, ?, b\]$/);
	});

	it('reads a null item as a hole', () => {
		expect(b.array(b.identifier('a'), null as never, b.identifier('b')).$render()).toMatch(/^\[a, ?, b\]$/);
	});

	it('round-trips a parsed hole through JSON', () => {
		const parsed = ts.parse('[a, , b];\n');
		const revived = JSON.parse(JSON.stringify(parsed), ts.reviver) as typeof parsed;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(parsed));
		expect(String(revived)).toMatch(/\[a, ?, b\]/);
	});
});

describe('a list whose element admits no hole', () => {
	it('refuses an absent item in its type', () => {
		// @ts-expect-error a statement block holds no holes
		const refused = () => b.statementBlock(b.emptyStatement(), undefined);
		expect(refused).toBeTypeOf('function');
	});
});
