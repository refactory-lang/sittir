import { describe, expect, it } from 'vitest';
import {
	Printed,
	printingFactoryMap,
	printValue,
	type LooseFacts,
	type PrintContext
} from '../../src/emit/factory-source.ts';

const ids: Record<string, number> = {
	function_item: 2,
	identifier: 3,
	comma: 4,
	arguments: 5,
	wrapper: 9,
	other: 10,
	block: 11,
	call_expression: 12,
	elements: 13,
	holder: 14,
	choice: 15,
	pair: 16,
	args: 17,
	attributed: 18,
	field_identifier: 19,
	holder2: 20,
	sized: 21,
	size: 22
};
const names = Object.fromEntries(Object.entries(ids).map(([k, v]) => [v, k]));
const camel = (kind: string): string => kind.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
const pascal = (kind: string): string => camel(kind).replace(/^[a-z]/, (c) => c.toUpperCase());

const shapes = {
	function_item: 'config',
	identifier: 'text',
	arguments: 'elements',
	elements: 'elements',
	wrapper: 'forwarded',
	other: 'forwarded',
	block: 'config',
	call_expression: 'config',
	holder: 'config',
	choice: 'config',
	pair: 'config',
	args: 'elements',
	attributed: 'config',
	field_identifier: 'text',
	holder2: 'config',
	sized: 'config'
} as const;

const loose: LooseFacts = {
	nested: 'calls',
	modelTypes: {
		identifier: 'pattern',
		comma: 'punctuation',
		function_item: 'branch',
		block: 'branch',
		call_expression: 'branch',
		wrapper: 'envelope',
		other: 'envelope',
		arguments: 'list',
		elements: 'list',
		holder: 'branch',
		choice: 'branch',
		pair: 'branch',
		args: 'list',
		attributed: 'branch',
		field_identifier: 'pattern',
		holder2: 'branch',
		sized: 'branch',
		size: 'enum'
	},
	subtypes: {},
	slotRequired: { attributed: { attrs: false, expression: true } },
	slotMultiple: { block: { statements: true } },
	slotDefaults: { choice: { value: 'arguments' } },
	bareAccepts: {
		wrapper: ['identifier', 'comma'],
		other: ['identifier'],
		arguments: ['identifier'],
		args: ['attributed', 'identifier', 'field_identifier'],
		attributed: ['identifier', 'field_identifier']
	},
	forwardsTo: { wrapper: 'identifier', other: 'identifier' },
	listDefaults: { arguments: 'Delimiter.None', elements: 'Delimiter.None', args: 'Delimiter.None' },
	listElementKinds: { arguments: ['identifier'], elements: ['identifier'], args: ['attributed'] },
	hoistedKinds: new Set(),
	kindIdOfName: (kind) => ids[kind]
};

const ctx: PrintContext = {
	grammar: 'test',
	kindNameFromId: (id) => names[id],
	memberNameOfId: (id) => (names[id] === undefined ? undefined : pascal(names[id]!)),
	irPathOfKind: (kind) => `ir.${camel(kind)}`,
	delimiterArmOfId: (id) => ({ 7: 'Delimiter.None', 8: 'Delimiter.Trailing' })[id],
	slotKinds: {
		function_item: { name: ['identifier'], body: ['block'], params: ['arguments'] },
		call_expression: { function: ['identifier', 'call_expression'], arguments: ['arguments'] },
		block: { statements: ['call_expression', 'wrapper'] },
		wrapper: { inner: ['identifier'] },
		other: { inner: ['identifier'] },
		holder: { item: ['wrapper'] },
		choice: { value: ['arguments', 'elements'] },
		pair: { item: ['wrapper', 'other'] },
		attributed: { attrs: ['identifier'], expression: ['identifier'] },
		holder2: { args: ['args'] },
		sized: { item: ['wrapper', 'size'] }
	},
	textLeafKinds: new Set(['identifier', 'field_identifier']),
	leafPatterns: { identifier: /^[a-z]+$/, field_identifier: /^[a-z]+$/ },
	enumKinds: new Set(['size']),
	seats: { args: { '*': { attributed: { kind: 'attributed', shape: 'elements' } } } },
	loose
};

const mapFor = (context: PrintContext) => printingFactoryMap(shapes, (k) => ids[k], context);

describe('loose surface printing', () => {
	const map = mapFor(ctx);
	it('spells the bundle call, a text leaf bare at a one-pattern slot, and an empty config as a bare call', () => {
		expect(map.function_item!({ name: map.identifier!('main') }).source).toBe('ir.functionItem({\n\tname: "main",\n})');
		expect(map.call_expression!({ function: map.identifier!('foo') }).source).toBe(
			'ir.callExpression({\n\tfunction: "foo",\n})'
		);
		expect(map.block!({}).source).toBe('ir.block()');
	});
	it('spells a list envelope as its bare element or array when its options are the declared default, each element loosened at the element slot', () => {
		expect(map.function_item!({ params: map.arguments!(map.identifier!('x')) }).source).toBe(
			'ir.functionItem({\n\tparams: "x",\n})'
		);
		expect(map.function_item!({ params: map.arguments!({ delimiter: 7 }, map.identifier!('x')) }).source).toBe(
			'ir.functionItem({\n\tparams: "x",\n})'
		);
		expect(map.function_item!({ params: map.arguments!(map.identifier!('x'), map.identifier!('y')) }).source).toBe(
			'ir.functionItem({\n\tparams: ["x", "y"],\n})'
		);
		expect(map.function_item!({ params: map.arguments!({ delimiter: 8 }, map.identifier!('x')) }).source).toBe(
			'ir.functionItem({\n\tparams: ir.arguments({ delimiter: Delimiter.Trailing }, "x"),\n})'
		);
	});
	it('spells the declared default list bare at a two-list slot and names the other', () => {
		expect(map.choice!({ value: map.arguments!(map.identifier!('x')) }).source).toBe('ir.choice({\n\tvalue: "x",\n})');
		expect(map.choice!({ value: map.elements!(map.identifier!('x')) }).source).toBe(
			'ir.choice({\n\tvalue: ir.elements("x"),\n})'
		);
	});
	it('drops a single-slot wrapper the slot alone admits, down to the bare text it holds', () => {
		expect(map.holder!({ item: map.wrapper!(map.identifier!('x')) }).source).toBe('ir.holder({\n\titem: "x",\n})');
		expect(map.block!({ statements: [map.wrapper!(map.identifier!('x'))] }).source).toBe(
			'ir.block({\n\tstatements: [ir.identifier("x")],\n})'
		);
	});
	it('keeps a wrapper two arms would claim, loosening only its interior', () => {
		expect(map.pair!({ item: map.wrapper!(map.identifier!('x')) }).source).toBe(
			'ir.pair({\n\titem: ir.wrapper("x"),\n})'
		);
	});
	it('keeps the call of a node that carries trivia', () => {
		const leaf = map.identifier!('main') as Printed;
		leaf.$_trivia = { leading: [{ $text: '// a' }] } as never;
		expect(map.function_item!({ name: leaf }).source).toBe(
			'ir.functionItem({\n\tname: ir.identifier("main").$trivia.leading("// a"),\n})'
		);
	});
	it('keeps a wrapper whose inner kind an alias of the slot already admits by id', () => {
		const aliased = mapFor({
			...ctx,
			slotKinds: { ...ctx.slotKinds, holder: { item: ['wrapper', 'alias'] } },
			loose: {
				...loose,
				modelTypes: { ...loose.modelTypes, alias: 'pattern' },
				kindIdOfName: (k) => (k === 'alias' ? 3 : ids[k])
			}
		});
		expect(aliased.holder!({ item: map.wrapper!(map.identifier!('x')) }).source).toBe(
			'ir.holder({\n\titem: ir.wrapper("x"),\n})'
		);
	});
	it('drops a wrapper around a kind-id leaf when the wrapper alone takes it, and keeps it beside an enum the slot admits', () => {
		expect(map.holder!({ item: map.wrapper!(4) }).source).toBe('ir.holder({\n\titem: TSKindId.Comma,\n})');
		expect(map.sized!({ item: map.wrapper!(4) }).source).toBe('ir.sized({\n\titem: ir.wrapper(TSKindId.Comma),\n})');
	});
	it("loosens the elements of a bare array against the list's element slot", () => {
		expect(map.holder2!({ args: map.args!({ expression: map.identifier!('x') }) }).source).toBe(
			'ir.holder2({\n\targs: "x",\n})'
		);
		expect(
			map.holder2!({
				args: map.args!({ expression: map.identifier!('x') }, { expression: map.identifier!('y') })
			}).source
		).toBe('ir.holder2({\n\targs: ["x", "y"],\n})');
	});
	it("loosens the slots of a seat config that sets more than its required slot", () => {
		expect(
			map.holder2!({ args: map.args!({ attrs: map.identifier!('a'), expression: map.identifier!('x') }) }).source
		).toBe('ir.holder2({\n\targs: [{\n\t\tattrs: "a",\n\t\texpression: "x",\n\t}],\n})');
	});
	it("tests a text under a transparent wrapper against the wrapper's content slot before the transitive set", () => {
		// `field_identifier` collides with `identifier` transitively, but the
		// content slot admits `identifier` alone, which is where the runtime resolves.
		expect(map.holder2!({ args: map.args!({ delimiter: 8 }, { expression: map.identifier!('x') }) }).source).toBe(
			'ir.holder2({\n\targs: ir.args({ delimiter: Delimiter.Trailing }, "x"),\n})'
		);
	});
	it("drops a tuple seat's options bag when it restates the list default", () => {
		const seated = mapFor({
			...ctx,
			seats: { function_item: { params: { arguments: { kind: 'arguments', shape: 'tuple' } } } }
		});
		expect(seated.function_item!({ params: [{ delimiter: 7 }, map.identifier!('x')] }).source).toBe(
			'ir.functionItem({\n\tparams: [ir.identifier("x")],\n})'
		);
		expect(seated.function_item!({ params: [{ delimiter: 8 }, map.identifier!('x')] }).source).toBe(
			'ir.functionItem({\n\tparams: [{ delimiter: Delimiter.Trailing }, ir.identifier("x")],\n})'
		);
	});
	it("hoists a seated element that sets only the seat's required slot", () => {
		const seated = mapFor({
			...ctx,
			seats: { arguments: { '*': { holder: { kind: 'holder', shape: 'elements' } } } },
			loose: { ...loose, slotRequired: { holder: { item: true } } }
		});
		expect(seated.arguments!({ item: map.identifier!('x') }).source).toBe('ir.arguments(ir.identifier("x"))');
		expect(seated.arguments!({ item: map.identifier!('x'), other: true }).source).toBe(
			'ir.arguments({\n\titem: ir.identifier("x"),\n\tother: true,\n})'
		);
	});
	it("spells an absorbed spread child as the loose wrapper's array argument", () => {
		const absorbing = mapFor({ ...ctx, absorbedKinds: new Set(['elements']) });
		expect(absorbing.wrapper!(absorbing.elements!(map.identifier!('x'), map.identifier!('y'))).source).toBe(
			'ir.wrapper(["x", "y"])'
		);
	});
	it('prints a read leaf bare where the slot admits one pattern kind', () => {
		expect(printValue(map.function_item!({ name: { $type: 3, $text: 'main' } }), ctx, 0)).toBe(
			'ir.functionItem({\n\tname: "main",\n})'
		);
	});
});

describe('loose surface printing with nested configs', () => {
	const map = mapFor({ ...ctx, loose: { ...loose, nested: 'configs' } });
	it('prints a nested compound as a keyless config at a one-kind slot and a keyed one elsewhere', () => {
		expect(map.function_item!({ body: map.block!({ statements: [map.identifier!('x')] }) }).source).toBe(
			'ir.functionItem({\n\tbody: {\n\t\tstatements: [ir.identifier("x")],\n\t},\n})'
		);
		// One branch kind beside a leaf kind still names the config's kind on its own.
		expect(map.call_expression!({ function: map.call_expression!({ function: map.identifier!('f') }) }).source).toBe(
			'ir.callExpression({\n\tfunction: {\n\t\tfunction: "f",\n\t},\n})'
		);
		expect(map.block!({ statements: [map.call_expression!({ function: map.identifier!('f') })] }).source).toBe(
			'ir.block({\n\tstatements: [{\n\t\tkind: TSKindId.CallExpression,\n\t\tfunction: "f",\n\t}],\n})'
		);
		expect(map.function_item!({ body: map.block!({}) }).source).toBe('ir.functionItem({\n\tbody: {},\n})');
	});
});
