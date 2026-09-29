// A call whose callee is a macro invocation: `m!(x)(y)`. The macro's own
// `arguments` (its token tree) and the call's `arguments` share a key, and
// each stays on its own owner.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('a call whose function is a macro invocation', () => {
	it('keeps each `arguments` on its own owner', () => {
		const node = rs.build.callExpression({
			function: rs.build.macroInvocation({ macro: rs.build.identifier('m'), arguments: rs.build.delimTokenTree.paren.strict(rs.build.nonSpecialToken.strict(rs.build.identifier('x'))) }),
			arguments: rs.build.arguments(rs.build.identifier('y'))
		});
		expect(node.$type).toBe(rs.kinds.CallExpression);
		expect(node.$render().toString()).toBe('m!(x)(y)');
	});
});
