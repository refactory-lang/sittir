// A call whose callee is a macro invocation: `m!(x)(y)`. The macro's own
// `arguments` (its token tree) shares its key with the call's `arguments`,
// so the arm takes the macro's config whole under `function` instead of
// merging its keys into the call's — both owners keep their `arguments`.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('ir.callExpression.macroInvocation', () => {
	it('builds a call whose function is a macro invocation, each `arguments` on its own owner', () => {
		const node = ir.callExpression.macroInvocation({
			function: { macro: ir.identifier('m'), arguments: ir.delimTokenTree.paren.strict(ir.identifier('x')) },
			arguments: ir.arguments(ir.identifier('y'))
		});
		expect(node.$type).toBe(TSKindId.CallExpression);
		expect(node.$render().toString()).toBe('m!(x)(y)');
	});
});
