import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const kindNames = new Map(Object.entries(rs.kinds).flatMap(([name, id]) => (typeof id === 'number' ? [[id, name] as const] : [])));

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

describe('a pattern-position name that spells a primitive reads as an identifier', () => {
	for (const [source, identifiers] of [
		['fn f() { let str = 1; }\n', 2],
		['fn f() { let u8 = 1; }\n', 2],
		['fn f() { let default = 1; }\n', 2],
		['fn f() { let g = |str| str; }\n', 4]
	] as const) {
		it(`reads ${JSON.stringify(source)} with no keyword kind`, () => {
			const root = rs.parse(source, { depth: Infinity });
			const kinds = kindsOf(root.$snapshot());
			expect(kinds.filter((kind) => kind.endsWith('Keyword'))).toEqual([]);
			expect(kinds.filter((kind) => kind === 'Identifier')).toHaveLength(identifiers);
			expect(root.$render()).toBe(source);
		});
	}

	it("builds identifier('str') in a pattern position", () => {
		const built = rs.build.letDeclaration({ name: rs.build.identifier('str'), value: rs.build.integerLiteral('1') });
		expect(built.$render().toString()).toBe('let str = 1;');
	});
});
