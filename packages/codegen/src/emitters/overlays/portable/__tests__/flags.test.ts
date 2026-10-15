import { describe, expect, it } from 'vitest';
import type { PortableCondition, SlotRoutes } from '@sittir/types';
import type { MemberRoute } from '../../../../bindings/index.ts';
import { flagPlansOf } from '../flags.ts';

const ROUTES: Readonly<Record<string, SlotRoutes>> = {
	'fn.mods': { fields: [], kinds: ['mods'] },
	'mods.modifier': { fields: [], kinds: ['async', 'const', 'extern_modifier'] },
	'method.static': { fields: [], kinds: ['static'] },
	'method.name': { fields: ['name'], kinds: [] },
	'list.items': { fields: [], kinds: ['item'] },
	'item.marker': { fields: [], kinds: ['marker'] }
};
const KEYWORDS: Readonly<Record<string, string>> = { 'method.static': 'static', 'item.marker': 'marker' };
const TYPES: Readonly<Record<string, readonly number[]>> = { computed_name: [41], extern_modifier: [52], _name: [41, 42] };

const plans = (members: readonly MemberRoute[], tests: readonly (readonly [string, readonly PortableCondition[], boolean])[] = []) =>
	flagPlansOf({
		kind: 'k',
		members,
		claimFlags: tests.map(([flag, test, placed]) => ({ flag, test, placed })),
		routesOf: (owner, slot) => ROUTES[`${owner}.${slot}`],
		presenceOf: (owner, slot) => KEYWORDS[`${owner}.${slot}`],
		typesOf: (kind) => TYPES[kind] ?? []
	});

describe('flagPlansOf', () => {
	it('steps into the wrapper a flag keyword sits in, and compares the keyword among the slot\'s others', () => {
		const async: MemberRoute = { route: 'presence', name: 'async', via: [], token: 'async', flag: true, path: [{ owner: 'fn', slot: 'mods' }, { owner: 'mods', slot: 'modifier' }] };
		expect(plans([async])).toEqual(
			new Map([['async', { op: 'child', fields: [], kinds: ['mods'], of: { op: 'eq', text: 'async', fields: [], kinds: ['async', 'const', 'extern_modifier'] } }]])
		);
	});

	it('tests presence when the flag\'s slot holds only its keyword', () => {
		const flagSlot: MemberRoute = { route: 'presence', name: 'static', via: [], token: 'static', flag: true, path: [{ owner: 'method', slot: 'static' }] };
		expect(plans([flagSlot]).get('static')).toEqual({ op: 'present', fields: [], kinds: ['static'] });
	});

	it('tests a captured node by its kind, expanded by membership', () => {
		const computed: MemberRoute = { route: 'kind', name: 'computed', kind: '_name', flag: true, path: [{ owner: 'method', slot: 'name' }] };
		expect(plans([computed]).get('computed')).toEqual({ op: 'is', types: [41, 42], fields: ['name'], kinds: [] });
	});

	it('keeps a step\'s anchor on the child step', () => {
		const marked: MemberRoute = { route: 'presence', name: 'marked', via: [], token: 'marker', flag: true, path: [{ owner: 'list', slot: 'items', anchor: 'first' }, { owner: 'item', slot: 'marker' }] };
		expect(plans([marked]).get('marked')).toEqual({ op: 'child', fields: [], kinds: ['item'], anchor: 'first', of: { op: 'present', fields: [], kinds: ['marker'] } });
	});

	it('holds always for a flag the kind\'s own form spells', () => {
		const generator: MemberRoute = { route: 'presence', name: 'generator', via: [], token: '*', flag: true, spelled: true, path: undefined };
		expect(plans([generator]).get('generator')).toEqual({ op: 'and', of: [] });
		const exclusive: MemberRoute = { route: 'kind', name: 'exclusive', kind: 'mutable_specifier', flag: true, spelled: true, path: undefined };
		expect(plans([exclusive]).get('exclusive')).toEqual({ op: 'and', of: [] });
	});

	it('refuses a flag whose route reaches no slot and that its kind does not spell', () => {
		const lost: MemberRoute = { route: 'presence', name: 'lost', via: [], token: '*', flag: true, path: undefined };
		expect(() => plans([lost])).toThrow(/k's flag lost: its route reaches no slot/);
	});

	it('lists a flag declared twice once when both routes lower alike, and or-s them otherwise', () => {
		const a: MemberRoute = { route: 'slot', name: 'static', slot: { name: 'static' } as never, flag: true, path: [{ owner: 'method', slot: 'static' }] };
		const b: MemberRoute = { route: 'presence', name: 'static', via: [], token: 'static', flag: true, path: [{ owner: 'method', slot: 'static' }] };
		expect(plans([a, b]).get('static')).toEqual({ op: 'present', fields: [], kinds: ['static'] });
		const c: MemberRoute = { route: 'kind', name: 'static', kind: 'computed_name', flag: true, path: [{ owner: 'method', slot: 'name' }] };
		expect(plans([a, c]).get('static')).toEqual({ op: 'or', of: [{ op: 'present', fields: [], kinds: ['static'] }, { op: 'is', types: [41], fields: ['name'], kinds: [] }] });
	});

	it('leaves data members out', () => {
		const name: MemberRoute = { route: 'slot', name: 'name', slot: { name: 'name' } as never, path: [{ owner: 'method', slot: 'name' }] };
		expect(plans([name]).size).toBe(0);
	});

	it('marks a claim flag that depends on the node\'s context, and lowers a node-local one', () => {
		const local: PortableCondition = { up: 0, via: [{ fields: [], kinds: ['mods'] }], plan: { op: 'present', fields: [], kinds: ['async'] } };
		expect(plans([], [['static', [local], false]]).get('static')).toEqual({ op: 'child', fields: [], kinds: ['mods'], of: { op: 'present', fields: [], kinds: ['async'] } });
		expect(plans([], [['static', [local], true]]).get('static')).toBeNull();
		expect(plans([], [['static', [{ ...local, up: 1 }], false]]).get('static')).toBeNull();
		expect(plans([], [['static', [{ up: 0, via: [], plan: { op: 'eq', text: 'x', self: true } }], false]]).get('static')).toBeNull();
	});
});
