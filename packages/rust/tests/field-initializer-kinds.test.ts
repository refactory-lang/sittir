import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const ir = rs.build;

const children = rs.query as unknown as (node: object) => { readonly $children: Iterable<{ readonly $type: number } | number> };

const itemKinds = (source: string): number[] => {
	const items: number[] = [];
	const walk = (node: object): void => {
		for (const child of children(node).$children) {
			if (typeof child === 'number') continue;
			if (child.$type === rs.kinds.ShorthandFieldInitializer || child.$type === rs.kinds.FieldInitializer) items.push(child.$type);
			walk(child);
		}
	};
	walk(rs.parse(source) as object);
	return items;
};

describe('a shorthand field initializer and a field initializer stay two kinds', () => {
	it('reads `a` as a shorthand and `b: 1` as a field initializer', () => {
		expect(itemKinds('fn f() { S { a, b: 1 }; }\n')).toEqual([rs.kinds.ShorthandFieldInitializer, rs.kinds.FieldInitializer]);
	});

	it('builds a shorthand without a value and reads it back as a shorthand', () => {
		const shorthand = ir.shorthandFieldInitializer({ name: ir.identifier('a') });
		expect(shorthand.$type).toBe(rs.kinds.ShorthandFieldInitializer);
		expect(itemKinds(`fn f() { S { ${shorthand.$render().toString()} }; }\n`)).toEqual([rs.kinds.ShorthandFieldInitializer]);
	});

	it('builds a field initializer with a value and reads it back as a field initializer', () => {
		const field = ir.fieldInitializer({ field: 'b', value: ir.integerLiteral('1') });
		expect(field.$type).toBe(rs.kinds.FieldInitializer);
		expect(itemKinds(`fn f() { S { ${field.$render().toString()} }; }\n`)).toEqual([rs.kinds.FieldInitializer]);
	});
});
