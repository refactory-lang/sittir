import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '@sittir/common/utils';
import rust from '../src/index.ts';

type Members = Record<string, (...args: unknown[]) => unknown>;

const SOURCE = 'type T = ((Foo, (Baz,)), (Bar,), ());\n';

describe('a read that fails partway, in object storage', () => {
	it('leaves no list it made unfilled for the read that follows, wherever it fails', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'object' });
		const statementOf = () => {
			const statement = rs.parse(SOURCE, { depth: 1 }).statements()[0]!;
			if (!rs.is.typeItem(statement)) throw new Error('not a type item');
			return statement;
		};
		const items = (node: unknown): unknown => (rs.is.tupleType(node as never) ? Array.from(node as Iterable<unknown>, items) : rs.render(node as never).toString());
		const expected = [['Foo', ['Baz']], ['Bar'], '()'];
		expect(items(statementOf().value())).toEqual(expected);
		let failures = 0;
		for (let failAt = 1; ; failAt++) {
			const statement = statementOf();
			const reader = treeOf(statement) as unknown as Members;
			const read = reader.read!;
			let calls = 0;
			reader.read = function (this: unknown, ...args: unknown[]) {
				if (++calls === failAt) throw new Error('injected read failure');
				return read.apply(this, args);
			};
			let failed = false;
			try {
				statement.value();
			} catch (error) {
				expect((error as Error).message).toBe('injected read failure');
				failed = true;
			}
			if (!failed) break;
			failures++;
			expect(items(statement.value())).toEqual(expected);
		}
		expect(failures).toBeGreaterThan(3);
	});
});
