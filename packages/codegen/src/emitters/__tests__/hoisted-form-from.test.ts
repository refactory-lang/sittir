import { FIELD, PATTERN, SEQ, STRING, SYMBOL, CHOICE } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { classifyFromEmission } from '../shared.ts';
import { bundleEntries } from '../overlays/module.ts';

/**
 * Mirrors rust's `impl_item` trait clause: a single-value slot whose two arms
 * are HOISTED forms differing only by a leading `!`, each wrapping the same
 * `trait` field. Both arms need their own coercer; neither belongs on the
 * top-level bundle.
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

function makeImplNodeMap() {
	const implRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: STRING, value: 'impl' },
			{
				type: FIELD,
				name: 'clause',
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: '_impl_positive' },
						{ type: SYMBOL, name: '_impl_negative' }
					]
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

describe('from() for a hoisted form', () => {
	it('classifies the form as emitted', () => {
		const nodeMap = makeImplNodeMap();
		const node = nodeMap.nodes.get('_impl_positive')!;

		expect(classifyFromEmission('_impl_positive', node, { nodeMap })).toBe('emit');
	});

	it('emits the form its own coercer and a _fromMap row', () => {
		const nodeMap = makeImplNodeMap();
		const fromFn = nodeMap.nodes.get('_impl_positive')!.fromFunctionName;
		const src = emitFrom({ grammar: 'synth', nodeMap });

		expect(fromFn).toBeDefined();
		expect(src).toContain(`export function ${fromFn}`);
		expect(src).toContain(`"_impl_positive": ${fromFn}`);
	});

	it('keeps the form off the top-level bundle', () => {
		const nodeMap = makeImplNodeMap();

		const keys = bundleEntries(nodeMap).map((e) => e.node.kind);

		expect(keys).toContain('impl');
		expect(keys).not.toContain('_impl_positive');
		expect(keys).not.toContain('_impl_negative');
	});
});
