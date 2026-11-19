import { describe, expect, it } from 'vitest';
import { type GrammarInput, readBindings, resolveRoutes, slotModelOf } from '../../../../bindings/index.ts';
import { emitPortableNodeModel } from '../node-model.ts';
import { EMPTY_VOCABULARY } from '../../../../__tests__/helpers/vocabulary.ts';

const input = async (scm: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(scm),
	model: slotModelOf({
		nodes: [
			{ kind: 'zeta', slots: [{ name: 'value', accessor: 'value', required: true, values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'alpha' }] }] },
			{
				kind: 'alpha',
				slots: [
					{ name: 'left', accessor: 'left', required: true, values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'zeta' }] },
					{ name: 'operator', accessor: 'operator', required: true, values: [{ kind: 'terminal', value: '+' }] }
				]
			},
			{ kind: 'wrapper', modelType: 'envelope', slots: [{ name: 'inner', accessor: 'inner', required: true, values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'alpha' }] }] }
		]
	}, {}),
	textTokens: new Set(),
	layoutSlots: [], vocabulary: EMPTY_VOCABULARY
});

describe('emitPortableNodeModel', () => {
	it('writes each kind\'s routes in kind order: its default vocabulary kind, read entries, slots with their build paths, and its unwrap', async () => {
		const text = emitPortableNodeModel(
			resolveRoutes(await input(['(alpha operator: "+") @expression.add', '(alpha left: (_) @lhs) @expression.binary', '(zeta) @expression.z'].join('\n'))),
			(entry) => (entry.pins.length === 0 ? [] : [{ up: 0, via: [], plan: { op: 'eq', text: entry.pins[0]!.text, slots: { 1: 0 } } }]),
			[]
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
					pins: [{ name: 'operator', slot: 'operator', text: '+' }],
					test: [{ up: 0, via: [], plan: { op: 'eq', text: '+', slots: { 1: 0 } } }]
				},
				{ vocab: 'expression.binary', toplevel: true, within: [], pins: [], test: [] }
			],
			slots: [
				{ name: 'lhs', route: 'slot', slot: 'left', path: [{ owner: 'alpha', slot: 'left' }] },
				{ name: 'left', route: 'slot', slot: 'left', path: [{ owner: 'alpha', slot: 'left' }] }
			]
		});
		expect(model.kinds.wrapper).toEqual({ container: { slot: 'inner', kinds: ['alpha'], terminals: [], list: false } });
		expect(model.namespaces).toEqual({
			levels: [
				{ depth: 1, paths: 1, kinds: 0, refinements: 0 },
				{ depth: 2, paths: 3, kinds: 2, refinements: 0 }
			]
		});
		expect(text.endsWith('}\n')).toBe(true);
	});

	it('stamps a kind that reads as a covered family path with its cases, its refinements and any case two of them take', async () => {
		const routes = resolveRoutes(await input(['(alpha operator: "+") @expression.binary.add', '(alpha) @expression.binary'].join('\n')));
		const entry = routes.readEntries.get('alpha')!.find((candidate) => candidate.vocab === 'expression.binary')!;
		const covered = { entry, refinements: ['expression.binary.add'], cases: 1 };
		expect(JSON.parse(emitPortableNodeModel(routes, () => [], [{ ...covered, overlapping: [] }])).kinds.alpha.covered).toEqual([{ path: 'expression.binary', cases: 1, refinements: ['expression.binary.add'] }]);
		expect(JSON.parse(emitPortableNodeModel(routes, () => [], [{ ...covered, overlapping: ['alpha'] }])).kinds.alpha.covered).toEqual([
			{ path: 'expression.binary', cases: 1, refinements: ['expression.binary.add'], overlapping: ['alpha'] }
		]);
		expect(JSON.parse(emitPortableNodeModel(routes, () => [], [])).kinds.alpha.covered).toBeUndefined();
	});
});
