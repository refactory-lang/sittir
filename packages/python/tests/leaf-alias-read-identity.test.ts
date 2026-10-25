import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);
const kindNames = new Map(Object.entries(py.kinds).flatMap(([name, id]) => (typeof id === 'number' ? [[id, name] as const] : [])));

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

describe('a relaxed keyword used as a name reads and builds as the word rule', () => {
	for (const word of ['print', 'exec', 'async', 'await', 'match', 'type']) {
		it(`reads \`${word} = 1\` as an identifier`, () => {
			const source = `${word} = 1\n`;
			const root = py.parse(source, { depth: Infinity });
			const kinds = kindsOf(root.$snapshot());
			expect(kinds).toContain('Identifier');
			expect(kinds.filter((kind) => kind.endsWith('Keyword'))).toEqual([]);
			expect(root.$render()).toBe(source);
		});
		it(`queries \`${word} = 1\` with the word as an identifier, not a keyword unit`, () => {
			const nodes = Array.from(py.parse(`${word} = 1\n`).$query().$descendants);
			expect(nodes.flatMap((node) => (typeof node !== 'number' && node.$type === py.kinds.Identifier ? [node.$text()] : []))).toEqual([word]);
			expect(nodes.filter((node) => typeof node === 'number' && kindNames.get(node)?.endsWith('Keyword'))).toEqual([]);
		});
		it(`builds identifier('${word}') where the grammar relaxes it`, () => {
			const built = py.build.assignmentEq({ name: py.build.identifier(word), value: py.build.integer('1') });
			expect(built.$render().toString()).toBe(`${word} = 1`);
		});
	}
});

describe('a unit the parser shows as itself', () => {
	it('queries as its unit kind', () => {
		expect(Array.from(py.parse('pass\n').$query().$descendants).filter((node) => typeof node === 'number')).toContain(py.kinds.PassStatement);
	});
});
