import { describe, expect, it } from 'vitest';
import {
	Printed,
	printValue,
	printingFactoryMap,
	printFactorySource,
	type PrintContext
} from '../../src/emit/factory-source.ts';

const ctx: PrintContext = {
	grammar: 'test',
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
	it('prints a catalog kind id as a TSKindId member', () => {
		expect(printValue(4, ctx, 0)).toBe('TSKindId.Comma');
	});
	it('prints strings, booleans and arrays', () => {
		expect(printValue('a"b', ctx, 0)).toBe('"a\\"b"');
		expect(printValue(true, ctx, 0)).toBe('true');
		expect(printValue([4, 'x'], ctx, 0)).toBe('[TSKindId.Comma, "x"]');
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
		expect(printed.source).toBe('ir.functionItem.strict({\n\tname: ir.identifier("main"),\n})');
	});
	it('prints direct, spread and elements shapes', () => {
		const map = printingFactoryMap(
			{ wrapper: 'direct', bag: 'spread', arguments: 'elements', identifier: 'text' },
			(k) => ({ wrapper: 9, bag: 10, arguments: 5, identifier: 3 })[k],
			ctx
		);
		expect(map.wrapper!(map.identifier!('x')).source).toBe('ir.wrapper.strict(ir.identifier("x"))');
		expect(map.bag!(map.identifier!('x'), map.identifier!('y')).source).toBe(
			'ir.bag.strict(ir.identifier("x"), ir.identifier("y"))'
		);
		expect(map.arguments!({ delimiter: 8 }, map.identifier!('x')).source).toBe(
			'ir.arguments.strict({ delimiter: Delimiter.Trailing }, ir.identifier("x"))'
		);
		expect(map.arguments!(map.identifier!('x')).source).toBe('ir.arguments.strict(ir.identifier("x"))');
	});
	it('appends a node trivia call from the trivia the value carries', () => {
		const printed = new Printed(2, 'ir.functionItem.strict({})', 'function_item');
		printed.$triviaData = { leading: [{ $text: '// a' }] } as never;
		expect(printValue(printed, ctx, 0)).toBe('ir.functionItem.strict({}).$trivia({ leading: ["// a"] })');
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
