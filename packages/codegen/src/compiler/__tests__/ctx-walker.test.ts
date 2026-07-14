import { describe, it, expect } from 'vitest';
import { NormalizeCtx } from '../normalize.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import type { LinkedGrammar, ExternalRole } from '../types.ts';

function makeLinked(rules: Record<string, Rule<'link'>>, overrides?: Partial<LinkedGrammar>): LinkedGrammar {
	return {
		name: 'test',
		rules,
		supertypes: new Set(),
		externalRoles: new Map<string, ExternalRole>(),
		word: null,
		references: [],
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}

describe('BaseCtx.walker', () => {
	it('is bound to ctx.rules — deref resolves through them', () => {
		const rules: Record<string, Rule> = {
			a: { type: SEQ, members: [{ type: SYMBOL, name: 'b' }] } as Rule,
			b: { type: STRING, value: 'x' } as Rule
		};
		const ctx = new NormalizeCtx({
			grammar: makeLinked(rules),
			diagnostics: new DiagnosticSink(),
			inlineKinds: new Set()
		});
		expect(ctx.walker.deref({ type: SYMBOL, name: 'b' } as Rule)).toBe(rules.b);
		expect(ctx.walker.find(rules.a!, (r) => r.type === STRING)).toBeUndefined(); // find is shallow
		expect(ctx.walker.findDeep(rules.a!, (r) => r.type === STRING)).toBe(rules.b);
	});
});
