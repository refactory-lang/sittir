import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

setFlagsFromString('--expose-gc');
const gc = runInNewContext('gc') as () => void;

describe('the first node an arena engine builds of each kind', () => {
	it('is refused as an input once the tree it went into is released', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const awaited = rs.build.awaitExpression(rs.build.identifier('futures'));
		const root = rs.build.sourceFile({ statements: [rs.build.expressionStatement.withSemi(awaited)] });
		expect(rs.render(root).toString()).toBe('futures.await;\n');
		rs.release(root);
		expect(() => rs.build.expressionStatement.withSemi(awaited)).toThrow(/was released/);
		rs.dispose();
	});

	it('is refused as an input once released itself', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const awaited = rs.build.awaitExpression(rs.build.identifier('futures'));
		rs.release(awaited);
		expect(() => rs.build.expressionStatement.withSemi(awaited)).toThrow(/was released/);
		rs.dispose();
	});
});

describe('the first node an object engine builds of each kind', () => {
	it('is not kept once its builder drops it', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'object' });
		const firsts = (() => {
			const statement = rs.build.expressionStatement.withSemi(rs.build.awaitExpression(rs.build.identifier('futures')));
			const root = rs.build.sourceFile({ statements: [statement] });
			expect(root.$render()).toBe('futures.await;\n');
			return [new WeakRef(statement), new WeakRef(root)];
		})();
		await new Promise((resolve) => setTimeout(resolve, 0));
		gc();
		expect(firsts.map((first) => first.deref())).toEqual([undefined, undefined]);
		rs.dispose();
	});
});
