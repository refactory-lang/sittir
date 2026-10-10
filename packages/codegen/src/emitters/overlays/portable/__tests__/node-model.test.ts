import { describe, expect, it } from 'vitest';
import { type GrammarInput, readBindings, resolveRoutes, slotModelOf } from '../../../../bindings/index.ts';
import { emitPortableNodeModel } from '../node-model.ts';

const input = async (scm: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(scm),
	model: slotModelOf({
		nodes: [
			{ kind: 'zeta', slots: [{ name: 'value', propertyName: 'value', required: true, kinds: ['alpha'] }] },
			{
				kind: 'alpha',
				slots: [
					{ name: 'left', propertyName: 'left', required: true, kinds: ['zeta'] },
					{ name: 'operator', propertyName: 'operator', required: true, values: [{ kind: 'terminal', value: '+' }] }
				]
			},
			{ kind: 'wrapper', modelType: 'envelope', slots: [{ name: 'inner', propertyName: 'inner', required: true, kinds: ['alpha'] }] }
		]
	}),
	textTokens: new Set(),
	layoutSlots: []
});

describe('emitPortableNodeModel', () => {
	it('writes each kind\'s routes in kind order: its default vocabulary kind, read entries, members with their build paths, and its unwrap', async () => {
		const text = emitPortableNodeModel(
			resolveRoutes(await input(['(alpha operator: "+") @expression.add', '(alpha left: (_) @lhs) @expression.binary', '(zeta) @expression.z'].join('\n'))),
			(entry) => (entry.pins.length === 0 ? [] : [{ up: 0, via: [], plan: { op: 'eq', text: entry.pins[0]!.text, fields: ['operator'], kinds: [] } }])
		);
		const model = JSON.parse(text);
		expect(Object.keys(model.kinds)).toEqual(['alpha', 'wrapper', 'zeta']);
		expect(model.kinds.alpha).toEqual({
			vocab: 'expression.binary',
			read: [
				{
					vocab: 'expression.add',
					toplevel: true,
					within: [],
					pins: [{ member: 'operator', slot: 'operator', text: '+' }],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: '+', fields: ['operator'], kinds: [] } }]
				},
				{ vocab: 'expression.binary', toplevel: true, within: [], pins: [], test: [] }
			],
			members: [
				{ name: 'lhs', route: 'slot', slot: 'left', path: [{ owner: 'alpha', slot: 'left' }] },
				{ name: 'operator', route: 'slot', slot: 'operator', path: [{ owner: 'alpha', slot: 'operator' }] }
			]
		});
		expect(model.kinds.wrapper).toEqual({ container: { kinds: ['alpha'], terminals: [], list: false } });
		expect(model.namespaces).toEqual({
			levels: [
				{ depth: 1, paths: 1, kinds: 0, refinements: 0, aliases: 3 },
				{ depth: 2, paths: 3, kinds: 2, refinements: 0, aliases: 0 }
			],
			dropped: []
		});
		expect(text.endsWith('}\n')).toBe(true);
	});
});
