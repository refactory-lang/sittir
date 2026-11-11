import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

setFlagsFromString('--expose-gc');
const gc = runInNewContext('gc') as () => void;

describe('an arena builder call', () => {
	it('keeps no leaf it placed once its caller releases the parent and drops the leaf', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const b = rs.build;
		const placed = (() => {
			const name = b.identifier('x');
			name.$trivia.leading(b.blockComment(b.blockCommentRegular(' note ')));
			const statement = b.expressionStatement.withSemi(name);
			expect(rs.render(statement).toString()).toBe('/* note */ x;');
			rs.release(statement);
			return new WeakRef(name);
		})();
		expect(rs.render(b.expressionStatement.withSemi(b.identifier('y'))).toString()).toBe('y;');
		await new Promise((resolve) => setTimeout(resolve, 0));
		gc();
		expect(placed.deref()).toBeUndefined();
		rs.dispose();
	});
});
