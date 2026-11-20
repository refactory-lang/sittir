import { describe, expect, it } from 'vitest';
import { boundaryTableOf, type BoundaryInputs, type BoundarySlot } from '../boundary-arms.ts';
import type { Body } from '../render-body.ts';

const HOLDER = 10;
const LEAF = 20;
const SITE = 7;
const FLANK = 5;

function inputsOf(body: Body, slots: Record<string, BoundarySlot>, tokens: Record<string, number> = {}): BoundaryInputs {
	return {
		templates: new Map([
			[
				'holder',
				{
					body,
					ownEdge: () => false,
					site: () => SITE,
					optional: (name) => slots[name]?.presence === 'optional',
					slot: (name) => slots[name]!
				}
			]
		]),
		members: new Map(),
		kindOf: (kind) => ({ id: kind === 'holder' ? HOLDER : kind === 'leaf' ? LEAF : undefined, hidden: false }),
		tokenIdOf: (text) => tokens[text],
		concrete: (kinds) => new Set(kinds)
	};
}

function listThenLast(fields: { readonly members: readonly number[]; readonly last: readonly number[] }): BoundaryInputs {
	return inputsOf([{ kind: 'slot', name: 'members' }, { kind: 'slot', name: 'last' }], {
		members: {
			presence: 'optional',
			prefix: '',
			suffix: '',
			elements: [{ kind: 'leaf' }],
			fields: fields.members,
			list: { head: FLANK, leading: 'none', trailing: 'none', separators: [] }
		},
		last: { presence: 'required', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: fields.last }
	});
}

type HiddenSlot = { readonly kind: 'slot'; readonly name: string; readonly element: string; readonly presence: BoundarySlot['presence'] };

function slotOf(name: string, element: string, presence: BoundarySlot['presence'] = 'required'): HiddenSlot {
	return { kind: 'slot', name, element, presence };
}

function holding(child: string, hidden: Record<string, readonly (HiddenSlot | Body[number])[]>): BoundaryInputs {
	const outer = inputsOf([{ kind: 'seam', field: 'open' }, { kind: 'slot', name: 'child' }], {
		child: { presence: 'required', prefix: '', suffix: '', elements: [{ kind: child }], fields: [] }
	});
	const templates = new Map(outer.templates);
	for (const [kind, steps] of Object.entries(hidden)) {
		const slots = new Map(steps.flatMap((step) => ('element' in step ? [[step.name, step] as const] : [])));
		templates.set(kind, {
			body: steps.map((step) => ('element' in step ? { kind: 'slot', name: step.name } : step)) as Body,
			ownEdge: () => false,
			site: () => SITE,
			optional: (name) => slots.get(name)?.presence === 'optional',
			slot: (name) => ({ presence: slots.get(name)!.presence, prefix: '', suffix: '', elements: [{ kind: slots.get(name)!.element }], fields: [] })
		});
	}
	return { ...outer, templates, kindOf: (kind) => ({ ...outer.kindOf(kind), hidden: kind.startsWith('_') }) };
}

describe('boundaryTableOf', () => {
	it('splits the arms one child kind reaches through two slots by the field the tree tags it with', () => {
		const table = boundaryTableOf(listThenLast({ members: [1], last: [2] }));
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([{ kind: HOLDER, before: [{ next: LEAF, field: 1, marks: [{ at: 'flank', site: FLANK }] }], after: [] }]);
	});

	it('drops an arm whose variants place different marks and share a field it could tell them apart by', () => {
		const table = boundaryTableOf(listThenLast({ members: [], last: [2] }));
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'before', drop: 'ambiguous', next: LEAF, variants: ['[]', `[flank:${FLANK}]`] }]);
	});

	const SEMI = 40;
	const declarations: BoundarySlot = {
		presence: 'optional',
		prefix: '',
		suffix: '',
		elements: [{ text: ';', id: SEMI }],
		fields: [1],
		list: { tail: FLANK, leading: 'none', trailing: 'none', separators: [] }
	};

	it("places a fixed token's marks on an arm with no field, after the arms of the fields a list's same token is tagged with", () => {
		const table = boundaryTableOf(inputsOf([{ kind: 'text', text: ';' }, { kind: 'seam', field: 'declarations' }, { kind: 'slot', name: 'declarations' }], { declarations }, { ';': SEMI }));
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([
			{
				kind: HOLDER,
				before: [],
				after: [
					{ next: SEMI, field: 1, marks: [{ at: 'flank', site: FLANK }] },
					{ next: SEMI, marks: [{ at: 'site', site: SITE }] }
				]
			}
		]);
	});

	it("keeps a field's arm that places no marks when a fixed token's arm after it places some", () => {
		const table = boundaryTableOf(inputsOf([{ kind: 'slot', name: 'declarations' }, { kind: 'seam', field: 'declarations' }, { kind: 'text', text: ';' }], { declarations }, { ';': SEMI }));
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([
			{
				kind: HOLDER,
				before: [
					{ next: SEMI, field: 1, marks: [] },
					{ next: SEMI, marks: [{ at: 'site', site: SITE }] }
				],
				after: []
			}
		]);
	});

	it('drops an arm whose fixed tokens place different marks, since no field tells them apart', () => {
		const flag: BoundarySlot = { presence: 'optional', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: [] };
		const table = boundaryTableOf(
			inputsOf(
				[{ kind: 'text', text: ';' }, { kind: 'seam', field: 'flag' }, { kind: 'if', arms: [{ test: 'flag', body: [{ kind: 'text', text: ';' }] }], fallback: undefined }],
				{ flag },
				{ ';': SEMI }
			)
		);
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'after', drop: 'ambiguous', next: SEMI, variants: ['[]', `[site:${SITE}]`] }]);
	});

	it('places no depth move at a boundary, and models the marks beside one', () => {
		const table = boundaryTableOf(
			inputsOf([{ kind: 'seam', field: 'open' }, { kind: 'indent' }, { kind: 'slot', name: 'child' }, { kind: 'dedent' }], {
				child: { presence: 'required', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: [] }
			})
		);
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([{ kind: HOLDER, before: [{ next: LEAF, marks: [{ at: 'site', site: SITE }] }], after: [] }]);
	});

	it('drops a side that reaches a token no kind resolves by its literal, when it places marks', () => {
		const table = boundaryTableOf(
			inputsOf([{ kind: 'seam', field: 'open' }, { kind: 'slot', name: 'child' }, { kind: 'text', text: 'zz' }], {
				child: { presence: 'optional', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: [] }
			})
		);
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'before', drop: 'unknown', variants: ['zz'] }]);
	});

	it('takes only the present arm of a test on a required slot, so the edge reaches nothing past it', () => {
		const table = boundaryTableOf(
			inputsOf(
				[{ kind: 'if', arms: [{ test: 'left', body: [{ kind: 'slot', name: 'left' }] }], fallback: undefined }, { kind: 'seam', field: 'op' }, { kind: 'text', text: '+' }, { kind: 'slot', name: 'right' }],
				{
					left: { presence: 'required', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: [] },
					right: { presence: 'required', prefix: '', suffix: '', elements: [{ kind: 'leaf' }], fields: [] }
				},
				{ '+': 30 }
			)
		);
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([]);
	});

	it("reaches a hidden kind's other arms past a recursion at its edge that places no marks", () => {
		const table = boundaryTableOf(holding('_loop', { _loop: [slotOf('rest', '_loop', 'optional'), slotOf('last', 'leaf')] }));
		expect(table.dropped).toEqual([]);
		expect(table.rows).toEqual([{ kind: HOLDER, before: [{ next: LEAF, marks: [{ at: 'site', site: SITE }] }], after: [] }]);
	});

	it('drops a side that reaches a hidden kind whose recursion at its edge places a mark, and names the cycle', () => {
		const table = boundaryTableOf(holding('_loop', { _loop: [{ kind: 'seam', field: 'x' }, slotOf('rest', '_loop', 'optional'), slotOf('last', 'leaf')] }));
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'before', drop: 'unmodeled', variants: ['_loop > _loop'] }]);
	});

	it('drops a side that reaches hidden kinds that hold each other at their edges, and names the cycle', () => {
		const table = boundaryTableOf(
			holding('_a', { _a: [slotOf('rest', '_b', 'optional'), slotOf('last', 'leaf')], _b: [slotOf('rest', '_a', 'optional'), slotOf('last', 'leaf')] })
		);
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'before', drop: 'unmodeled', variants: ['_a > _b > _a'] }]);
	});

	it('drops a side whose only marks lead to a token no kind resolves', () => {
		const table = boundaryTableOf(inputsOf([{ kind: 'seam', field: 'open' }, { kind: 'text', text: 'zz' }], {}));
		expect(table.rows).toEqual([]);
		expect(table.dropped).toEqual([{ kind: 'holder', side: 'before', drop: 'unknown', variants: ['zz'] }]);
	});
});
