import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import { seatedFormKinds } from '../ir-surface.ts';
import { buildNodeMap } from '../../../__tests__/helpers/synth-node-map.ts';

const spliced = () =>
	buildNodeMap(
		{
			root: { type: SEQ, members: [{ type: SYMBOL, name: 'foreach' }] },
			foreach: {
				type: SEQ,
				members: [
					{ type: STRING, value: 'foreach' },
					{ type: SYMBOL, name: '_initializer' },
					{ type: FIELD, name: 'body', content: { type: SYMBOL, name: 'identifier' } }
				]
			},
			_initializer: {
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'foreach_initializer_arm', annotations: { variant: 'arm', variantOf: '_initializer' } },
					{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' }, annotations: { variantOf: '_initializer' } }
				]
			},
			foreach_initializer_arm: {
				type: SEQ,
				members: [
					{ type: FIELD, name: 'type', content: { type: SYMBOL, name: 'identifier' } },
					{ type: FIELD, name: 'left', content: { type: SYMBOL, name: 'identifier' } }
				],
				annotations: { hoisted: true, variant: 'arm', variantOf: '_initializer' }
			},
			identifier: { type: PATTERN, value: '[a-z]+' }
		},
		{ inline: ['_initializer'] }
	);

describe('a seated arm hoisted from a spliced hidden rule', () => {
	it('has a builder path the surface check reaches', () => {
		const { nodeMap } = spliced();
		const arm = nodeMap.nodes.get('foreach_initializer_arm')!;
		expect(arm.builderPath).toEqual(['foreach', 'arm']);
		expect(() => seatedFormKinds(nodeMap)).not.toThrow();
	});
});
