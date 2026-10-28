import { expect, it } from 'vitest';
import typescript from '../src/index.ts';

it("refuses a built leaf, such as an HTML comment, in a side of an object node, whose engine builds no records", async () => {
	const records = await typescript.createEngine();
	const comment = records.build.htmlComment('<!-- c -->');
	const objects = await typescript.createEngine({ nodeConstruction: 'object' });
	const statement = objects.build.expressionStatement(objects.build.identifier('x'));
	expect(() => statement.$trivia.trailing(comment as never)).toThrow('a side names a built record, and its engine builds no records');
	const parsed = objects.parse('x;\n').statements()[0] as unknown as typeof statement;
	expect(() => parsed.$trivia.trailing(comment as never)).toThrow('a side names a built record, and its engine builds no records');
});
