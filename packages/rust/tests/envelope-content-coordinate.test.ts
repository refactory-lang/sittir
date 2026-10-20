import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { coordinateOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

const coordinateType = (value: unknown): number | undefined => (typeof value === 'object' && value !== null ? coordinateOf(value)?.$type : undefined);

for (const nodeStorage of ['object', 'arena'] as const) {
	const rs = await createEngine(rust, { nodeStorage });
	const read = () => {
		const statements = rs.parse('type T = A;\nfn f() { let x = 1; }\n').statements();
		const [alias, func] = [statements[0]!, statements[1]!];
		if (!rs.is.typeItem(alias)) throw new Error('not a type item');
		if (!rs.is.functionItem(func)) throw new Error('not a function item');
		const declaration = func.body().statements()[0]!;
		if (!rs.is.letDeclaration(declaration)) throw new Error('not a let declaration');
		const name = alias.name();
		return { name, content: name.content(), declaration };
	};

	describe(`an alias envelope's content names its envelope's row (${nodeStorage})`, () => {
		it('has the coordinate of its envelope, display id included, read in place', () => {
			const { name, content } = read();
			expect(coordinateType(content)).toBe(coordinateType(name));
			expect(content.$type).not.toBe(coordinateType(content));
		});

		it('keeps that coordinate under another parent and through its envelope’s $with', () => {
			const { name, content, declaration } = read();
			const envelope = coordinateType(name);
			expect(coordinateType(declaration.$with.pattern(content).pattern())).toBe(envelope);
			expect(coordinateType(name.$with.content(content).content())).toBe(envelope);
		});
	});
}
