import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const kindNames = new Map(Object.entries(ts.kinds as unknown as Record<string, number>).map(([name, id]) => [id, name]));

const kindsOf = (node: unknown, out: string[] = []): string[] => {
	if (typeof node === 'number') out.push(kindNames.get(node) ?? `#${node}`);
	else if (Array.isArray(node)) for (const item of node) kindsOf(item, out);
	else if (node !== null && typeof node === 'object') {
		const { $type } = node as { $type?: number };
		if ($type !== undefined) out.push(kindNames.get($type) ?? `#${$type}`);
		for (const [key, value] of Object.entries(node)) if (!key.startsWith('$')) kindsOf(value, out);
	}
	return out;
};

describe('a contextual keyword used as a name reads as an identifier', () => {
	for (const word of ['type', 'get', 'async', 'let', 'declare']) {
		it(`reads \`${word} = 1;\` with no keyword kind`, () => {
			const source = `${word} = 1;\n`;
			const root = ts.parse(source, { depth: Infinity });
			const kinds = kindsOf(root.$snapshot());
			expect(kinds).toContain('Identifier');
			expect(kinds.filter((kind) => kind.endsWith('Keyword'))).toEqual([]);
			expect(root.$render()).toBe(source);
		});
	}
});
