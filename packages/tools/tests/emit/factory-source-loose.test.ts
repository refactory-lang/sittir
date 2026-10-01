import { describe, expect, it } from 'vitest';
import {
	Printed,
	printingFactoryMap,
	printValue,
	type ModelFacts,
	type PrintContext
} from '../../src/emit/factory-source.ts';
import { withSeatKind } from '../../src/validate/common.ts';
import { expectPrinted } from './expect-printed.ts';

const attributed = <C extends Record<string, unknown>>(config: C): C => withSeatKind(config, 'attributed');
const holder = <C extends Record<string, unknown>>(config: C): C => withSeatKind(config, 'holder');

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

const facts: ModelFacts = {
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
	textLeavesThrough: {},
	forwardsTo: { wrapper: 'identifier', other: 'identifier' },
	listDefaults: { arguments: 'Delimiter.None', elements: 'Delimiter.None', args: 'Delimiter.None' },
	listElementKinds: { arguments: ['identifier'], elements: ['identifier'], args: ['attributed'] },
	hoistedKinds: new Set(),
	kindIdOfName: (kind) => ids[kind]
};

const ctx: PrintContext = {
	grammar: 'test',
	engine: 'rs',
	surface: 'loose',
	nested: 'calls',
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
	facts
};

const mapFor = (context: PrintContext) => printingFactoryMap(shapes, (k) => ids[k], context);

describe('loose surface printing', () => {
	const map = mapFor(ctx);
	it('spells the bundle call, a text leaf bare at a one-pattern slot, and an empty config as a bare call', () => {
		expect(expectPrinted(map.function_item!({ name: map.identifier!('main') })).source).toBe('ir.functionItem({\n\tname: "main",\n})');
		expect(expectPrinted(map.call_expression!({ function: map.identifier!('foo') })).source).toBe(
			'ir.callExpression({\n\tfunction: "foo",\n})'
		);
		expect(expectPrinted(map.block!({})).source).toBe('ir.block()');
	});
	it('spells a list envelope as its bare element or array when its options are the declared default, each element loosened at the element slot', () => {
		expect(expectPrinted(map.function_item!({ params: map.arguments!(map.identifier!('x')) })).source).toBe(
			'ir.functionItem({\n\tparams: "x",\n})'
		);
		expect(expectPrinted(map.function_item!({ params: map.arguments!({ delimiter: 7 }, map.identifier!('x')) })).source).toBe(
			'ir.functionItem({\n\tparams: "x",\n})'
		);
		expect(expectPrinted(map.function_item!({ params: map.arguments!(map.identifier!('x'), map.identifier!('y')) })).source).toBe(
			'ir.functionItem({\n\tparams: ["x", "y"],\n})'
		);
		expect(expectPrinted(map.function_item!({ params: map.arguments!({ delimiter: 8 }, map.identifier!('x')) })).source).toBe(
			'ir.functionItem({\n\tparams: ir.arguments({ delimiter: Delimiter.Trailing }, "x"),\n})'
		);
	});
	it('spells the declared default list bare at a two-list slot and names the other', () => {
		expect(expectPrinted(map.choice!({ value: map.arguments!(map.identifier!('x')) })).source).toBe('ir.choice({\n\tvalue: "x",\n})');
		expect(expectPrinted(map.choice!({ value: map.elements!(map.identifier!('x')) })).source).toBe(
			'ir.choice({\n\tvalue: ir.elements("x"),\n})'
		);
	});
	it('drops a single-slot wrapper the slot alone admits, down to the bare text it holds', () => {
		expect(expectPrinted(map.holder!({ item: map.wrapper!(map.identifier!('x')) })).source).toBe('ir.holder({\n\titem: "x",\n})');
		expect(expectPrinted(map.block!({ statements: [map.wrapper!(map.identifier!('x'))] })).source).toBe(
			'ir.block({\n\tstatements: [ir.identifier("x")],\n})'
		);
	});
	it('keeps a wrapper two arms would claim, loosening only its interior', () => {
		expect(expectPrinted(map.pair!({ item: map.wrapper!(map.identifier!('x')) })).source).toBe(
			'ir.pair({\n\titem: ir.wrapper("x"),\n})'
		);
	});
	it('keeps the call of a node that carries trivia', () => {
		const leaf = map.identifier!('main') as Printed;
		leaf.$_trivia = { leading: [new Printed(3, 'ir.lineComment(" a")', 'line_comment')] } as never;
		expect(expectPrinted(map.function_item!({ name: leaf })).source).toBe(
			'ir.functionItem({\n\tname: ir.identifier("main").$trivia.leading(ir.lineComment(" a")),\n})'
		);
	});
	it('keeps a wrapper whose inner kind an alias of the slot already admits by id', () => {
		const aliased = mapFor({
			...ctx,
			slotKinds: { ...ctx.slotKinds, holder: { item: ['wrapper', 'alias'] } },
			facts: {
				...facts,
				modelTypes: { ...facts.modelTypes, alias: 'pattern' },
				kindIdOfName: (k) => (k === 'alias' ? 3 : ids[k])
			}
		});
		expect(expectPrinted(aliased.holder!({ item: map.wrapper!(map.identifier!('x')) })).source).toBe(
			'ir.holder({\n\titem: ir.wrapper("x"),\n})'
		);
	});
	it('drops a wrapper around a kind-id leaf when the wrapper alone takes it, and keeps it beside an enum the slot admits', () => {
		expect(expectPrinted(map.holder!({ item: map.wrapper!(4) })).source).toBe('ir.holder({\n\titem: rs.kinds.Comma,\n})');
		expect(expectPrinted(map.sized!({ item: map.wrapper!(4) })).source).toBe('ir.sized({\n\titem: ir.wrapper(rs.kinds.Comma),\n})');
	});
	it("loosens the elements of a bare array against the list's element slot", () => {
		expect(expectPrinted(map.holder2!({ args: map.args!(attributed({ expression: map.identifier!('x') })) })).source).toBe(
			'ir.holder2({\n\targs: "x",\n})'
		);
		expect(
			expectPrinted(
				map.holder2!({
					args: map.args!(attributed({ expression: map.identifier!('x') }), attributed({ expression: map.identifier!('y') }))
				})
			).source
		).toBe('ir.holder2({\n\targs: ["x", "y"],\n})');
	});
	it("loosens the slots of a seat config that sets more than its required slot, and names its kind where the element slot also takes the hoisted value bare", () => {
		expect(
			expectPrinted(map.holder2!({ args: map.args!(attributed({ attrs: map.identifier!('a'), expression: map.identifier!('x') })) })).source
		).toBe('ir.holder2({\n\targs: [{\n\t\t$type: rs.kinds.Attributed,\n\t\tattrs: "a",\n\t\texpression: "x",\n\t}],\n})');
	});
	it("names the seat's kind on a config that sits beside a hoisted bare element", () => {
		expect(
			expectPrinted(
				map.holder2!({
					args: map.args!(attributed({ attrs: map.identifier!('a'), expression: map.identifier!('x') }), attributed({ expression: map.identifier!('y') }))
				})
			).source
		).toBe('ir.holder2({\n\targs: [{\n\t\t$type: rs.kinds.Attributed,\n\t\tattrs: "a",\n\t\texpression: "x",\n\t}, "y"],\n})');
	});
	it("leaves a seat config untagged where its seat has no required slot to hoist", () => {
		const unhoisted = mapFor({ ...ctx, facts: { ...facts, slotRequired: { attributed: { attrs: false, expression: false } } } });
		expect(
			expectPrinted(unhoisted.holder2!({ args: unhoisted.args!(attributed({ attrs: unhoisted.identifier!('a'), expression: unhoisted.identifier!('x') })) }))
				.source
		).toBe('ir.holder2({\n\targs: [{\n\t\tattrs: "a",\n\t\texpression: "x",\n\t}],\n})');
	});
	it("tests a text under a transparent wrapper against the wrapper's content slot before the transitive set", () => {
		// `field_identifier` collides with `identifier` transitively, but the
		// content slot admits `identifier` alone, which is where the runtime resolves.
		expect(expectPrinted(map.holder2!({ args: map.args!({ delimiter: 8 }, attributed({ expression: map.identifier!('x') })) })).source).toBe(
			'ir.holder2({\n\targs: ir.args({ delimiter: Delimiter.Trailing }, "x"),\n})'
		);
	});
	it("drops a tuple seat's options bag when it restates the list default", () => {
		const seated = mapFor({
			...ctx,
			seats: { function_item: { params: { arguments: { kind: 'arguments', shape: 'tuple' } } } }
		});
		expect(expectPrinted(seated.function_item!({ params: [{ delimiter: 7 }, map.identifier!('x')] })).source).toBe(
			'ir.functionItem({\n\tparams: [ir.identifier("x")],\n})'
		);
		expect(expectPrinted(seated.function_item!({ params: [{ delimiter: 8 }, map.identifier!('x')] })).source).toBe(
			'ir.functionItem({\n\tparams: [{ delimiter: Delimiter.Trailing }, ir.identifier("x")],\n})'
		);
	});
	it("hoists a seated element that sets only the seat's required slot", () => {
		const seated = mapFor({
			...ctx,
			seats: { arguments: { '*': { holder: { kind: 'holder', shape: 'elements' } } } },
			facts: { ...facts, slotRequired: { holder: { item: true } } }
		});
		expect(expectPrinted(seated.arguments!(holder({ item: map.identifier!('x') }))).source).toBe('ir.arguments(ir.identifier("x"))');
		expect(expectPrinted(seated.arguments!(holder({ item: map.identifier!('x'), other: true }))).source).toBe(
			'ir.arguments({\n\t$type: rs.kinds.Holder,\n\titem: "x",\n\tother: true,\n})'
		);
	});
	it("spells an absorbed spread child as the loose wrapper's array argument", () => {
		const absorbing = mapFor({ ...ctx, absorbedKinds: new Set(['elements']) });
		expect(expectPrinted(absorbing.wrapper!(absorbing.elements!(map.identifier!('x'), map.identifier!('y')))).source).toBe(
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
	const map = mapFor({ ...ctx, nested: 'configs' });
	it('prints a nested compound as a keyless config at a one-kind slot and a keyed one elsewhere', () => {
		expect(expectPrinted(map.function_item!({ body: map.block!({ statements: [map.identifier!('x')] }) })).source).toBe(
			'ir.functionItem({\n\tbody: {\n\t\tstatements: [ir.identifier("x")],\n\t},\n})'
		);
		// One branch kind beside a leaf kind still names the config's kind on its own.
		expect(expectPrinted(map.call_expression!({ function: map.call_expression!({ function: map.identifier!('f') }) })).source).toBe(
			'ir.callExpression({\n\tfunction: {\n\t\tfunction: "f",\n\t},\n})'
		);
		expect(expectPrinted(map.block!({ statements: [map.call_expression!({ function: map.identifier!('f') })] })).source).toBe(
			'ir.block({\n\tstatements: [{\n\t\t$type: rs.kinds.CallExpression,\n\t\tfunction: "f",\n\t}],\n})'
		);
		expect(expectPrinted(map.function_item!({ body: map.block!({}) })).source).toBe('ir.functionItem({\n\tbody: {},\n})');
	});
});

describe('hoisted routes, on both surfaces', () => {
	const owning = { ...facts, forwardsTo: { ...facts.forwardsTo, wrapper: 'elements' } };
	const strict = mapFor({ ...ctx, surface: 'strict', facts: owning });
	const loose = mapFor({ ...ctx, facts: owning });

	it('an owner takes the arguments of the list it forwards to', () => {
		expect(expectPrinted(strict.wrapper!(strict.elements!(strict.identifier!('x'), strict.identifier!('y')))).source).toBe(
			'ir.wrapper.strict(ir.identifier("x"), ir.identifier("y"))'
		);
		expect(expectPrinted(loose.wrapper!(loose.elements!(loose.identifier!('x'), loose.identifier!('y')))).source).toBe(
			'ir.wrapper("x", "y")'
		);
	});
	it("a list's options bag that restates its default delimiter is dropped", () => {
		expect(expectPrinted(strict.elements!({ delimiter: 7 }, strict.identifier!('x'))).source).toBe(
			'ir.elements.strict(ir.identifier("x"))'
		);
		expect(expectPrinted(strict.elements!({ delimiter: 8 }, strict.identifier!('x'))).source).toBe(
			'ir.elements.strict({ delimiter: Delimiter.Trailing }, ir.identifier("x"))'
		);
	});
	it("a seated element that sets only the seat's required slot is that slot's value, on the strict surface too", () => {
		const seated = mapFor({
			...ctx,
			surface: 'strict',
			seats: { arguments: { '*': { holder: { kind: 'holder', shape: 'elements' } } } },
			facts: { ...facts, slotRequired: { holder: { item: true } } }
		});
		expect(expectPrinted(seated.arguments!(holder({ item: seated.identifier!('x') }))).source).toBe(
			'ir.arguments.strict(ir.identifier("x"))'
		);
	});
	it('an owner keeps its list call when the list carries trivia of its own', () => {
		const list = expectPrinted(strict.elements!(strict.identifier!('x')));
		list.$_trivia = { leading: [{ $type: 3, $text: 'c' }] } as never;
		expect(expectPrinted(strict.wrapper!(list)).source).toMatch(/^ir\.wrapper\.strict\(ir\.elements\.strict\(/);
	});
	it('an owner keeps its list call when an element is a seat config, which the owner signature does not take', () => {
		const seated = mapFor({
			...ctx,
			surface: 'strict',
			seats: { elements: { '*': { attributed: { kind: 'attributed', shape: 'elements' } } } },
			facts: owning
		});
		const list = seated.elements!(attributed({ attrs: seated.identifier!('a'), expression: seated.identifier!('x') }));
		expect(expectPrinted(seated.wrapper!(list)).source).toMatch(/^ir\.wrapper\.strict\(ir\.elements\.strict\(\{/);
	});
	it('a loose owner keeps its list call when the list has options to pass, which the loose owner signature does not take', () => {
		expect(expectPrinted(loose.wrapper!(loose.elements!({ delimiter: 8 }, loose.identifier!('x')))).source).toBe(
			'ir.wrapper(ir.elements({ delimiter: Delimiter.Trailing }, "x"))'
		);
	});
	it('an empty list is never spelled as a bare array', () => {
		const built = loose.choice!({ value: loose.arguments!() });
		expect(expectPrinted(built).source).toBe('ir.choice({\n\tvalue: ir.arguments(),\n})');
	});
});

