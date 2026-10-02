import { describe, expect, it } from 'vitest';
import {
	Printed,
	printValue,
	printingFactoryMap,
	printingIrSurface,
	printFactorySource,
	engineBinding,
	type PrintContext
} from '../../src/emit/factory-source.ts';
import { expectPrinted } from './expect-printed.ts';

const ctx: PrintContext = {
	grammar: 'test',
	engine: 'rs',
	surface: 'strict',
	facts: {
		modelTypes: {},
		subtypes: {},
		slotRequired: {},
		slotMultiple: {},
		slotDefaults: {},
		bareAccepts: {},
		textLeavesThrough: {},
		forwardsTo: {},
		listDefaults: {},
		listElementKinds: {},
		hoistedKinds: new Set(),
		oneSurfaceKinds: new Set<string>(),
		kindIdOfName: () => undefined
	},
	kindNameFromId: (id) =>
		({ 1: 'source_file', 2: 'function_item', 3: 'identifier', 4: 'comma', 5: 'arguments' })[id],
	memberNameOfId: (id) => ({ 1: 'SourceFile', 2: 'FunctionItem', 3: 'Identifier', 4: 'Comma', 5: 'Arguments' })[id],
	irPathOfKind: (kind) =>
		({ source_file: 'ir.sourceFile', function_item: 'ir.functionItem', identifier: 'ir.identifier', arguments: 'ir.arguments' })[
			kind
		] ?? `ir.${kind}`,
	delimiterArmOfId: (id) => ({ 8: 'Delimiter.Trailing' })[id]
};

describe('printValue', () => {
	it('prints a catalog kind id as a member of the engine kinds', () => {
		expect(printValue(4, ctx, 0)).toBe('rs.kinds.Comma');
	});
	it('prints strings, booleans and arrays', () => {
		expect(printValue('a"b', ctx, 0)).toBe('"a\\"b"');
		expect(printValue(true, ctx, 0)).toBe('true');
		expect(printValue([4, 'x'], ctx, 0)).toBe('[rs.kinds.Comma, "x"]');
	});
	it('prints a printed marker as its source', () => {
		expect(printValue(new Printed(3, 'ir.identifier("f")'), ctx, 0)).toBe('ir.identifier("f")');
	});
	it('prints a config as a strict call and omits undefined slots', () => {
		const map = printingFactoryMap(
			{ function_item: 'config', identifier: 'text' },
			(k) => ({ function_item: 2, identifier: 3 })[k],
			ctx
		);
		const printed = map.function_item!({ name: map.identifier!('main'), body: undefined });
		expect(expectPrinted(printed).source).toBe('ir.functionItem.strict({\n\tname: ir.identifier("main"),\n})');
	});
	it('prints direct, spread and elements shapes', () => {
		const map = printingFactoryMap(
			{ wrapper: 'direct', bag: 'spread', arguments: 'elements', identifier: 'text' },
			(k) => ({ wrapper: 9, bag: 10, arguments: 5, identifier: 3 })[k],
			ctx
		);
		expect(expectPrinted(map.wrapper!(map.identifier!('x'))).source).toBe('ir.wrapper.strict(ir.identifier("x"))');
		expect(expectPrinted(map.bag!(map.identifier!('x'), map.identifier!('y'))).source).toBe(
			'ir.bag.strict(ir.identifier("x"), ir.identifier("y"))'
		);
		expect(expectPrinted(map.arguments!({ delimiter: 8 }, map.identifier!('x'))).source).toBe(
			'ir.arguments.strict({ delimiter: Delimiter.Trailing }, ir.identifier("x"))'
		);
		expect(expectPrinted(map.arguments!(map.identifier!('x'))).source).toBe('ir.arguments.strict(ir.identifier("x"))');
	});
	it('prints a keyword kind as its kind id, and a text kind with its text', () => {
		const map = printingFactoryMap(
			{ pass_statement: 'text', identifier: 'text' },
			(k) => ({ pass_statement: 11, identifier: 3 })[k],
			{
				...ctx,
				memberNameOfId: (id) => (id === 11 ? 'PassStatement' : ctx.memberNameOfId(id)),
				keywordKinds: new Set(['pass_statement'])
			}
		);
		expect(expectPrinted(map.pass_statement!('pass')).source).toBe('rs.kinds.PassStatement');
		expect(expectPrinted(map.identifier!('x')).source).toBe('ir.identifier("x")');
	});
	it('prints a constant-shaped kind as its build entry, with no call', () => {
		const map = printingFactoryMap({ pass_statement: 'constant' }, (k) => ({ pass_statement: 11 })[k], ctx);
		expect(expectPrinted(map.pass_statement!()).source).toBe('ir.pass_statement');
	});
	it('prints a mounted form with its given arguments and no trailing undefined', () => {
		const map = printingFactoryMap(
			{ visibility_modifier: 'config', visibility_modifier_pub: 'direct', identifier: 'text' },
			(k) => ({ visibility_modifier: 6, visibility_modifier_pub: 7, identifier: 3 })[k],
			ctx
		);
		const surface = printingIrSurface(
			map,
			(k) => ({ visibility_modifier: 6, visibility_modifier_pub: 7, identifier: 3 })[k],
			{},
			{
				...ctx,
				irPathOfKind: (kind) => (kind === 'visibility_modifier' ? 'ir.visibilityModifier' : ctx.irPathOfKind(kind)),
				seats: {
					visibility_modifier: {
						modifier: { visibility_modifier_pub: { kind: 'visibility_modifier_pub', shape: 'arm', mount: 'pub' } }
					}
				}
			}
		);
		const pub = (surface.entries.visibility_modifier as unknown as Record<string, { strict: (...a: unknown[]) => Printed }>)
			.pub!;
		expect(pub.strict(undefined).source).toBe('ir.visibilityModifier.pub.strict()');
		expect(pub.strict().source).toBe('ir.visibilityModifier.pub.strict()');
		expect(pub.strict(map.identifier!('x')).source).toBe('ir.visibilityModifier.pub.strict(ir.identifier("x"))');
	});
	it('appends a node trivia call from the trivia the value carries', () => {
		const printed = new Printed(2, 'ir.functionItem.strict({})', 'function_item');
		printed.$_trivia = { leading: [new Printed(3, 'ir.lineComment(" a")', 'line_comment')] } as never;
		expect(printValue(printed, ctx, 0)).toBe('ir.functionItem.strict({}).$trivia.leading(ir.lineComment(" a"))');
	});
});

describe('printFactorySource', () => {
	it('prints a leaf root through the validator dispatcher', () => {
		const artifacts = {
			factoryMap: printingFactoryMap({ identifier: 'text' }, (k) => ({ identifier: 3 })[k], ctx),
			factoryShapes: { identifier: 'text' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {},
			polymorphVariants: {}
		};
		const source = printFactorySource(
			{ $type: 3, $text: 'main' },
			'identifier',
			artifacts,
			{ kindNameFromId: ctx.kindNameFromId },
			ctx
		);
		expect(source).toBe('ir.identifier("main")');
	});
});

describe('engineBinding', () => {
	it("names the engine after the grammar's first file type and keeps the grammar name for the descriptor", () => {
		expect(engineBinding('rust', ['rs'])).toEqual({ engine: 'rs', descriptor: 'rust' });
		expect(engineBinding('typescript', ['ts', 'tsx'])).toEqual({ engine: 'ts', descriptor: 'typescript' });
	});
	it('names the engine after the grammar when it declares no file type, and moves the descriptor aside', () => {
		expect(engineBinding('regex', [])).toEqual({ engine: 'regex', descriptor: 'regexLanguage' });
	});
	it('moves the descriptor aside when the file type is the grammar name', () => {
		expect(engineBinding('scm', ['scm'])).toEqual({ engine: 'scm', descriptor: 'scmLanguage' });
	});
});
