// A call whose callee is a macro invocation: `m!(x)(y)`. The macro's own
// `arguments` (its token tree) and the call's `arguments` share a key, and
// each stays on its own owner.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('a call whose function is a macro invocation', () => {
	it('keeps each `arguments` on its own owner', () => {
		const node = ir.callExpression({
			function: ir.macroInvocation({ macro: ir.identifier('m'), arguments: ir.delimTokenTree.paren.strict(ir.nonSpecialToken.strict(ir.identifier('x'))) }),
			arguments: ir.arguments(ir.identifier('y'))
		});
		expect(node.$type).toBe(TSKindId.CallExpression);
		expect(node.$render().toString()).toBe('m!(x)(y)');
	});
});
