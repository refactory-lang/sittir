import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';
import { coerceToObjectTypeContent, coerceToVariableDeclaration } from '../src/factories/coerce.ts';
import { TSKindId } from '../src/kinds.ts';

for (const nodeStorage of ['object', 'arena'] as const) {
	const ts = await createEngine(typescript, { nodeStorage });
	const members = () => {
		const alias = ts.parse('type T = { a: string, b: number };\n').statements()[0]!;
		if (!ts.is.typeAliasDeclaration(alias)) throw new Error('not a type alias');
		const value = alias.value();
		if (!ts.is.objectType(value)) throw new Error('not an object type');
		const content = value.members();
		if (content === undefined) throw new Error('no members');
		return content;
	};
	const declaration = () => {
		const statement = ts.parse('var x = 1\n').statements()[0]!;
		if (!ts.is.variableDeclaration(statement)) throw new Error('not a variable declaration');
		return statement;
	};

	describe(`a from() given a node of its own kind (${nodeStorage})`, () => {
		it("returns a list node, or sets a separator over the list's own", () => {
			const content = members();
			expect(coerceToObjectTypeContent(content)).toBe(content);
			expect(String(ts.render(coerceToObjectTypeContent({ separator: TSKindId.Semi }, content)))).toBe('a: string; b: number');
			expect(String(ts.render(content))).toBe('a: string, b: number');
		});

		it("returns a spread kind's node, or sets a leading option over the node's own", () => {
			const statement = declaration();
			expect(coerceToVariableDeclaration(statement)).toBe(statement);
			expect(String(ts.render(coerceToVariableDeclaration({ terminator: TSKindId.Semi }, statement)))).toBe('var x = 1;');
			expect(String(ts.render(statement))).toBe('var x = 1');
		});
	});
}
