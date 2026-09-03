import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';

/**
 * Mirrors rust's `impl_item` trait clause: one slot, two arms wrapping the
 * same `trait` field, so a bare value fits either and the resolver cannot
 * choose. `arm.default` stamps `annotations.default` on the arm a bare value
 * means; this pins that the stamp reaches the emitted resolver call.
 */
function clauseRule(negative: boolean): SeqRule<'link'> {
	return {
		type: SEQ,
		members: [
			...(negative ? [{ type: STRING, value: '!' } as const] : []),
			{ type: FIELD, name: 'trait', content: { type: SYMBOL, name: 'identifier' } },
			{ type: STRING, value: 'for' }
		]
	};
}

function makeImplNodeMap(declareDefault: boolean) {
	const positiveArm = declareDefault
		? ({ type: SYMBOL, name: '_impl_positive', annotations: { default: true } } as const)
		: ({ type: SYMBOL, name: '_impl_positive' } as const);
	const implRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: STRING, value: 'impl' },
			{
				type: FIELD,
				name: 'clause',
				content: {
					type: CHOICE,
					members: [positiveArm, { type: SYMBOL, name: '_impl_negative' }]
				} satisfies ChoiceRule<'link'>
			}
		]
	};

	const nodes = new Map<string, AssembledNode>();
	const implRender = flatten(implRule);
	nodes.set('impl', new AssembledBranch('impl', implRender, implRender));
	for (const [kind, negative] of [
		['_impl_positive', false],
		['_impl_negative', true]
	] as const) {
		const render = flatten(clauseRule(negative));
		nodes.set(kind, new AssembledBranch(kind, render, render, { hoisted: true }));
	}
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z_:]+' }));
	return makeNodeMapWith(nodes);
}

/** The body of the `clause` slot's own resolver — the one `_resolveOne` call under test. */
function clauseResolverCall(src: string): string {
	const lines = src.split('\n');
	const at = lines.findIndex((l) => l.includes('export function resolveImpl_clause('));
	if (at === -1) throw new Error('fixture emitted no resolveImpl_clause; the slot shape changed');
	return lines[at + 1]!.trim();
}

describe('arm.default reaches the emitted resolver', () => {
	it('passes the declared arm as the resolver call default', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeImplNodeMap(true) });

		expect(clauseResolverCall(src)).toContain('"_impl_positive")');
	});

	it('emits a three-argument call when no arm is declared', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeImplNodeMap(false) });

		const call = clauseResolverCall(src);
		expect(call).not.toContain('"_impl_positive")');
		expect(call).not.toContain('"_impl_negative")');
	});

	it('never nominates an arm the author did not declare', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeImplNodeMap(true) });

		expect(clauseResolverCall(src)).not.toContain('"_impl_negative")');
	});

	it('makes both arms string-capable through the bare-input closure', () => {
		// Each arm forwards to a `trait` slot admitting the `identifier` pattern,
		// so a bare string can reach either — which is why the default is needed.
		const src = emitFrom({ grammar: 'synth', nodeMap: makeImplNodeMap(true) });

		const set = src.split('\n').find((l) => l.includes('_STRING_CAPABLE_BRANCHES')) ?? '';
		expect(set).toContain('"_impl_positive"');
		expect(set).toContain('"_impl_negative"');
	});

	it('emits the shared arm-choosing helper', () => {
		const src = emitFrom({ grammar: 'synth', nodeMap: makeImplNodeMap(true) });

		expect(src).toContain('function _pickArm(');
		expect(src).toContain('return defaultArm !== undefined && arms.includes(defaultArm) ? defaultArm : undefined;');
	});
});
