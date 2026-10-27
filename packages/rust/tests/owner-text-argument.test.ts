import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const rsStrict = await createEngine(rust, { api: 'strict' });
const verifyingStrict = await createEngine(rust, { verifyStructure: 'runtime', api: 'strict' });

describe('a strict builder whose one slot holds a leaf', () => {
	it('takes the built leaf, and refuses the leaf\'s text', () => {
		expect(rsStrict.build.lifetime(rs.build.identifier('a')).$render()).toBe("'a");
		// @ts-expect-error text to a leaf is coercion: the loose entry takes it
		expect(() => verifyingStrict.build.lifetime('a')).toThrow(/Lifetime.name: a strict factory takes a built node, not a string/);
	});

	it('refuses the text through two builders too', () => {
		const label = rsStrict.build.label(rs.build.identifier('outer'));
		expect(rsStrict.build.continueExpression(label).$render()).toBe("continue 'outer");
		// @ts-expect-error text to a leaf is coercion: the loose entry takes it
		expect(() => verifyingStrict.build.continueExpression('outer')).toThrow(/ContinueExpression.label: a strict factory takes a built node/);
	});

	it('leaves the text to the loose entry', () => {
		expect(rs.build.lifetime('a').$render()).toBe("'a");
		expect(rs.build.continueExpression('outer').$render()).toBe("continue 'outer");
	});
});
