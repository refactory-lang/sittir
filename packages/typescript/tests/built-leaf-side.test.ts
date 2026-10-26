import { expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import arena from '../src/arena.ts';

it("refuses a built leaf, such as an HTML comment, in a side of an object node, whose engine builds no records", async () => {
	const records = await arena.createEngine();
	useRecordConstruction(records, await import('../src/factories/records.ts'));
	const comment = records.build.htmlComment('<!-- c -->');
	const objects = await arena.createEngine();
	const statement = objects.build.expressionStatement(objects.build.identifier('x'));
	expect(() => statement.$trivia.trailing(comment as never)).toThrow('a side names a built record, and its engine builds no records');
	const parsed = objects.parse('x;\n').statements()[0] as unknown as typeof statement;
	expect(() => parsed.$trivia.trailing(comment as never)).toThrow('a side names a built record, and its engine builds no records');
});
