import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../../../python/src/index.ts';
import rust from '../../../rust/src/index.ts';
import typescript from '../../../typescript/src/index.ts';

type Node = { readonly $type: number; readonly $text?: string; readonly $render?: () => string };
type Item = Node | number;
type Guard = ((node: unknown, context?: readonly Node[]) => boolean) & Record<string, unknown>;
type Located = readonly [node: Item, context: readonly Node[]];

const kindOf = (item: Item): number => (typeof item === 'number' ? item : item.$type);

const languages = { python, rust, typescript } as const;

async function surfaces(name: keyof typeof languages) {
	const language = languages[name] as typeof rust;
	const engine = await createEngine(language);
	const portable = (await createEngine(language, { api: 'portable' })) as unknown as { kinds: Record<string, unknown>; is: Record<string, unknown> };
	const kindName = (item: Item) => engine.trivia.kindName(kindOf(item));
	const located = (source: string): Located[] => {
		const out: Located[] = [];
		const walk = (node: Node, context: readonly Node[]): void => {
			out.push([node, context]);
			const facet = (engine.query as unknown as (n: Node) => { readonly $children: Iterable<Item> })(node);
			for (const child of facet.$children) {
				if (typeof child === 'number') out.push([child, [...context, node]]);
				else walk(child, [...context, node]);
			}
		};
		walk(engine.parse(source) as unknown as Node, []);
		return out;
	};
	const at = (path: string): Guard => path.split('.').reduce<unknown>((g, s) => (g as Record<string, unknown>)[s], portable.is) as Guard;
	const kindsAt = (path: string) => path.split('.').reduce<unknown>((k, s) => (k as Record<string, unknown>)[s], portable.kinds) as { $ids: readonly number[] };
	const paths = (node: unknown = portable.kinds, under = ''): string[] =>
		Object.keys(node as object)
			.filter((key) => key !== '$ids')
			.flatMap((key) => {
				const path = under === '' ? key : `${under}.${key}`;
				return [path, ...paths((node as Record<string, unknown>)[key], path)];
			});
	const find = (source: string, kind: string, text?: string, nth = 0): Located => {
		const hit = located(source).filter(([n]) => kindName(n) === kind && (text === undefined || (typeof n !== 'number' && (n.$text ?? n.$render?.()) === text)))[nth];
		if (hit === undefined) throw new Error(`no ${kind}${text === undefined ? '' : ` '${text}'`} in ${JSON.stringify(source)}`);
		return hit;
	};
	return { engine, portable, located, at, kindsAt, paths, find, kindName };
}

describe('portable is: python', async () => {
	const { at, find } = await surfaces('python');
	const SOURCE = 'class A:\n    @staticmethod\n    def s(): pass\n    @classmethod\n    def c(cls): pass\n    def __init__(self): pass\n    def m(self): pass\n';

	it('reads a method in its enclosing class, given the context', () => {
		const [c, classContext] = find(SOURCE, 'function_definition', undefined, 1);
		expect(at('declaration.method')(c, classContext)).toBe(true);
	});

	it.skip('reads a decorated method as static by the decorator in its enclosing node, given the context (pending: `static` is a flag of declaration.method, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const [s, context] = find(SOURCE, 'function_definition');
		const [c, classContext] = find(SOURCE, 'function_definition', undefined, 1);
		expect(at('declaration.method.static')(s, context)).toBe(true);
		expect(at('declaration.method.static')(c, classContext)).toBe(false);
	});

	it('falls to the next entry without the context', () => {
		const [s] = find(SOURCE, 'function_definition');
		expect(at('declaration.function')(s)).toBe(true);
	});

	it.skip('reads no static method without the context (pending: `static` is a flag of declaration.method, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const [s] = find(SOURCE, 'function_definition');
		expect(at('declaration.method.static')(s)).toBe(false);
	});

	it('tests a string prefix through the hidden string_start capture', () => {
		const [f, fc] = find('f"x"\n', 'string');
		const [b, bc] = find('b"x"\n', 'string');
		expect(at('literal.string.f')(f, fc)).toBe(true);
		expect(at('literal.string.bytes')(f, fc)).toBe(false);
		expect(at('literal.string.bytes')(b, bc)).toBe(true);
	});

	it('reads each text piece of a string as its text, an f-string\'s included', () => {
		const SOURCE = 'x = "a\\nb"\ny = f"c{x}"\n';
		for (const text of ['a', 'b', 'c']) {
			const [fragment, context] = find(SOURCE, 'string_fragment', text);
			expect(at('literal.string.text')(fragment, context), text).toBe(true);
		}
		const [escape, escapeContext] = find(SOURCE, 'escape_sequence_simple');
		expect(at('literal.string.text')(escape, escapeContext)).toBe(false);
	});

	it('keeps the constructor and call paths though a function owns those names', () => {
		const [init, context] = find(SOURCE, 'function_definition', undefined, 2);
		expect(at('declaration.constructor')).not.toBe(Function.prototype.constructor);
		expect(at('declaration.constructor')(init, context)).toBe(true);
		expect(at('expression.call')).not.toBe(Function.prototype.call);
	});

	it('reads a comparison of one comparator by its operator, and of two or more as a chain, as tree-sitter matches the claims', () => {
		const COMPARISONS = 'a < b\na < b == c\na in b\n';
		const [less] = find(COMPARISONS, 'comparison_operator', 'a < b');
		const [chain] = find(COMPARISONS, 'comparison_operator', 'a < b == c');
		const [membership] = find(COMPARISONS, 'comparison_operator', 'a in b');
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.less')(n))).toEqual([true, false, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.equal')(n))).toEqual([false, false, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.chain')(n))).toEqual([false, true, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.membership.in')(n))).toEqual([false, false, true]);
	});
});

describe('portable is: rust', async () => {
	const { engine, at, find } = await surfaces('rust');

	it('compares a boolean literal\'s own text', () => {
		const [t, tc] = find('fn f() { let a = true; let b = false; }\n', 'true_keyword');
		const [f, fc] = find('fn f() { let a = true; let b = false; }\n', 'false_keyword');
		expect(at('literal.boolean.true')(t, tc)).toBe(true);
		expect(at('literal.boolean.false')(t, tc)).toBe(false);
		expect(at('literal.boolean.false')(f, fc)).toBe(true);
	});

	it('reads a string literal\'s content as its text', () => {
		const SOURCE = 'fn f() { let a = "x\\ny"; }\n';
		for (const text of ['x', 'y']) {
			const [content, context] = find(SOURCE, 'string_content', text);
			expect(at('literal.string.text')(content, context), text).toBe(true);
		}
	});

	it('reads a kind-id leaf in the asking engine\'s language, on the low-level surface too', () => {
		const [wildcard] = find('fn f(x: u8) { match x { _ => 1 } }\n', 'wildcard_pattern');
		expect(typeof wildcard).toBe('number');
		expect((engine.is as unknown as Record<string, (v: unknown) => boolean>).pattern!(wildcard)).toBe(true);
	});

	it('pins an operator on a parsed node and on a built one alike', () => {
		const [add, context] = find('fn f() { a + b; }\n', 'binary_expression');
		expect(at('expression.binary.arithmetic.add')(add, context)).toBe(true);
		expect(at('expression.binary.arithmetic.subtract')(add, context)).toBe(false);
		const b = engine.build as unknown as Record<string, (...args: unknown[]) => Node>;
		const built = b.binaryExpression!({ left: b.identifier!('a'), operator: '-', right: b.identifier!('b') });
		expect(at('expression.binary.arithmetic.subtract')(built)).toBe(true);
		expect(at('expression.binary.arithmetic.add')(built)).toBe(false);
	});

	it('tells identifier from type_identifier, and a prelude type from another', () => {
		const SOURCE = 'fn f() { let x: Foo = y; let o: Option<u8> = z; }\n';
		const [x, xc] = find(SOURCE, 'identifier', 'x');
		const [foo, fooc] = find(SOURCE, 'type_identifier', 'Foo');
		const [option, optionc] = find(SOURCE, 'type_identifier', 'Option');
		expect(at('identifier.type')(foo, fooc)).toBe(true);
		expect(at('identifier.type')(x, xc)).toBe(false);
		expect(at('type.named.prelude')(option, optionc)).toBe(true);
		expect(at('identifier.type')(option, optionc)).toBe(false);
	});

	it('reads a method with a receiver as a method, whatever order the impl lists them in', () => {
		const SOURCE = 'struct S;\nimpl S {\n    fn a(x: u8) {}\n    fn m(&self) {}\n    fn z() {}\n    fn n(&mut self, x: u8) {}\n}\n';
		const [m, n] = [1, 3].map((nth) => find(SOURCE, 'function_item', undefined, nth));
		for (const [fn, context] of [m!, n!]) expect(at('declaration.method')(fn, context)).toBe(true);
	});

	it.skip('tells a method with a receiver from an associated function, whatever order the impl lists them in (pending: `static` is a flag of declaration.method, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'struct S;\nimpl S {\n    fn a(x: u8) {}\n    fn m(&self) {}\n    fn z() {}\n    fn n(&mut self, x: u8) {}\n}\n';
		const [a, m, z, n] = [0, 1, 2, 3].map((nth) => find(SOURCE, 'function_item', undefined, nth));
		for (const [fn, context] of [m!, n!]) expect(at('declaration.method.static')(fn, context)).toBe(false);
		for (const [fn, context] of [a!, z!]) expect(at('declaration.method.static')(fn, context)).toBe(true);
	});

	it('reads a static item as a variable, and a visible one by its crossing', () => {
		const SOURCE = 'static A: u8 = 1;\npub static B: u8 = 2;\npub(crate) static C: u8 = 3;\nfn f() { let d = 4; }\n';
		const statics = [0, 1, 2].map((nth) => find(SOURCE, 'static_item', undefined, nth));
		const [local, lc] = find(SOURCE, 'let_declaration');
		expect(statics.map(([n, c]) => at('declaration.variable')(n, c))).toEqual([true, true, true]);
		expect(statics.map(([n, c]) => at('declaration.variable.public')(n, c))).toEqual([false, true, true]);
		expect(statics.map(([n, c]) => at('declaration.variable.public.internal')(n, c))).toEqual([false, false, true]);
		expect(at('declaration.variable')(local, lc)).toBe(true);
		expect(at('declaration.variable.public')(local, lc)).toBe(false);
	});

	it.skip('reads a static item\'s `mut` and `ref` as its flags (pending: `mutable` and `byReference` are flags of declaration.variable, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'static A: u8 = 1;\nstatic mut B: u8 = 2;\nstatic ref C: u8 = 3;\n';
		const statics = [0, 1, 2].map((nth) => find(SOURCE, 'static_item', undefined, nth));
		expect(statics.map(([n, c]) => at('declaration.variable.mutable')(n, c))).toEqual([false, true, false]);
		expect(statics.map(([n, c]) => at('declaration.variable.byReference')(n, c))).toEqual([false, false, true]);
	});

	it('reads every kind a closure\'s parameters admit as a parameter, through the wildcard claim', () => {
		const SOURCE = 'fn f() { let g = |a, mut b| a; }\n';
		const [a, ac] = find(SOURCE, 'identifier', 'a');
		const [b, bc] = find(SOURCE, 'mut_pattern');
		expect(at('declaration.parameter')(a, ac)).toBe(true);
		expect(at('declaration.parameter')(b, bc)).toBe(true);
	});

	it('reads a tuple struct and a unit struct by their forms, and a tuple struct\'s fields as fields', () => {
		const SOURCE = 'struct T(u8, pub u16);\nstruct U;\n';
		const [tuple, tc] = find(SOURCE, 'struct_item_tuple');
		const [unit, uc] = find(SOURCE, 'struct_item_unit');
		expect(at('declaration.struct.tuple')(tuple, tc)).toBe(true);
		expect(at('declaration.struct.unit')(tuple, tc)).toBe(false);
		expect(at('declaration.struct.unit')(unit, uc)).toBe(true);
		expect(at('declaration.struct')(unit, uc)).toBe(true);
		const [field, fc] = find(SOURCE, 'attributed_ordered_field', 'pub u16');
		expect(at('declaration.field')(field, fc)).toBe(true);
	});

	it('reads an array repeat expression by its form', () => {
		const SOURCE = 'fn f() { let a = [0; 3]; let b = [1, 2]; }\n';
		const [repeat, rc] = find(SOURCE, 'array_expression_semi');
		const [list, lc] = find(SOURCE, 'array_expression_list');
		expect(at('expression.collection.list.repeat')(repeat, rc)).toBe(true);
		expect(at('expression.collection.list.repeat')(list, lc)).toBe(false);
	});

	it('pins a prefix range pattern by its operator, and never reads a range with a left bound as exclusive by default', () => {
		const SOURCE = 'fn f(x: u8) { match x { ..=5 => 0, ..9 => 1, 1..=5 => 2, _ => 3 } }\n';
		const [inclusive, ic] = find(SOURCE, 'range_pattern_prefix', '..=5');
		const [exclusive, ec] = find(SOURCE, 'range_pattern_prefix', '..9');
		const [left, lc] = find(SOURCE, 'range_pattern_with_left', '1..=5');
		expect(at('pattern.range.inclusive')(inclusive, ic)).toBe(true);
		expect(at('pattern.range.exclusive')(inclusive, ic)).toBe(false);
		expect(at('pattern.range.exclusive')(exclusive, ec)).toBe(true);
		expect(at('pattern.range.inclusive')(exclusive, ec)).toBe(false);
		expect(at('pattern.range')(left, lc)).toBe(true);
		expect(at('pattern.range.exclusive')(left, lc)).toBe(false);
	});

	it('reads a range with a left bound by its operator, as tree-sitter matches the claims', () => {
		const SOURCE = 'fn f() { match x { 1..=5 => {}, 1...5 => {}, 1..5 => {}, 1.. => {}, _ => {} } }\n';
		const ranges = ['1..=5', '1...5', '1..5', '1..'].map((text) => find(SOURCE, 'range_pattern_with_left', text));
		expect(ranges.map(([n, c]) => at('pattern.range.inclusive')(n, c))).toEqual([true, true, false, false]);
		expect(ranges.map(([n, c]) => at('pattern.range.exclusive')(n, c))).toEqual([false, false, true, true]);
		expect(ranges.map(([n, c]) => at('pattern.range')(n, c))).toEqual([true, true, true, true]);
	});

	it('pins a range expression by its operator, and reads a range open at either end as exclusive', () => {
		const SOURCE = 'fn f() { let a = 1..=2; let b = 1...2; let c = 1..2; let d = 1..; let e = ..2; let g = ..; }\n';
		for (const text of ['1..=2', '1...2']) {
			const [range, context] = find(SOURCE, 'range_expression_binary', text);
			expect(at('expression.range.inclusive')(range, context), text).toBe(true);
			expect(at('expression.range.exclusive')(range, context), text).toBe(false);
		}
		for (const [kind, text] of [
			['range_expression_binary', '1..2'],
			['range_expression_postfix', '1..'],
			['range_expression_prefix', '..2'],
			['range_expression_bare', undefined]
		] as const) {
			const [range, context] = find(SOURCE, kind, text);
			expect(at('expression.range.exclusive')(range, context), kind).toBe(true);
			expect(at('expression.range.inclusive')(range, context), kind).toBe(false);
		}
	});
});

describe('portable is: typescript', async () => {
	const { engine, at, find } = await surfaces('typescript');

	it('compares a comment\'s own text', () => {
		const root = engine.parse('/** doc */\n/* block */\nlet x = 1;\n') as unknown as { statements(): readonly { $trivia: { leading(): readonly Node[] } }[] };
		const { CommentBlock } = engine.kinds as unknown as Readonly<Record<string, number>>;
		const [doc, block] = root.statements()[0]!.$trivia.leading().filter((item) => item.$type === CommentBlock);
		expect(at('comment.block.doc')(doc)).toBe(true);
		expect(at('comment.block.doc')(block)).toBe(false);
		expect(at('comment.block')(block)).toBe(true);
	});

	it('reads a double-quoted string\'s fragment as its text', () => {
		const [fragment, context] = find('let a = "x";\n', 'unescaped_double_string_fragment');
		expect(at('literal.string.text')(fragment, context)).toBe(true);
	});

	it('keeps each path whose last segment a function owns', () => {
		for (const [path, owned] of [
			['expression.call', Function.prototype.call],
			['declaration.signature.call', Function.prototype.call],
			['attribute.content.call', Function.prototype.call],
			['declaration.constructor', Function.prototype.constructor],
			['type.function.constructor', Function.prototype.constructor]
		] as const) {
			expect(typeof at(path), path).toBe('function');
			expect(at(path), path).not.toBe(owned);
		}
	});

	it('reads an enum member through the wildcard claim under the enum body\'s elements', () => {
		const [member, context] = find('enum E { A, B = 1 }\n', 'enum_assignment');
		expect(at('declaration.enum_member')(member, context)).toBe(true);
	});

	it('holds a supertype\'s path for a variant that reads by a claim of its own', () => {
		const [hex, context] = find('let x = 0x1F;\n', 'number_hex');
		expect(at('literal.number.integer.hex')(hex, context)).toBe(true);
		expect(at('literal.number')(hex, context)).toBe(true);
	});

	it('reads a method by its visibility keyword, which the reader holds as the modifier\'s member kind', () => {
		const SOURCE = 'class C { private a() {} protected b() {} public c() {} d() {} }\n';
		const methods = [0, 1, 2, 3].map((n) => find(SOURCE, 'method_definition', undefined, n));
		expect(methods.map(([n, c]) => at('declaration.method.private')(n, c))).toEqual([true, false, false, false]);
		expect(methods.map(([n, c]) => at('declaration.method.protected')(n, c))).toEqual([false, true, false, false]);
		expect(methods.map(([n, c]) => at('declaration.method.public')(n, c))).toEqual([false, false, true, false]);
		expect(methods.map(([n, c]) => at('declaration.method')(n, c))).toEqual([true, true, true, true]);
	});

	it('reads a mapped index signature by its form', () => {
		const SOURCE = 'type M = { [K in keyof T]: T[K] };\ninterface I { [k: string]: number }\n';
		const [mapped, mc] = find(SOURCE, 'index_signature_mapped_type_clause');
		const [colon, cc] = find(SOURCE, 'index_signature_colon');
		expect(at('declaration.signature.index.mapped')(mapped, mc)).toBe(true);
		expect(at('declaration.signature.index.mapped')(colon, cc)).toBe(false);
	});

	it('pins a typeof import by its keyword, and reads a type-only import as an import', () => {
		const SOURCE = 'import type { A } from "a";\nimport typeof B from "b";\nimport { C } from "c";\n';
		const [type, tc] = find(SOURCE, 'import_statement');
		const [typeOf, oc] = find(SOURCE, 'import_statement', undefined, 1);
		const [plain, pc] = find(SOURCE, 'import_statement', undefined, 2);
		expect(at('statement.import.typeof')(type, tc)).toBe(false);
		expect(at('statement.import.typeof')(typeOf, oc)).toBe(true);
		expect(at('statement.import')(type, tc)).toBe(true);
		expect(at('statement.import')(plain, pc)).toBe(true);
	});

	it.skip('reads a type-only import by its keyword (pending: `typeOnly` is a flag of statement.import, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'import type { A } from "a";\nimport { C } from "c";\n';
		const [type, tc] = find(SOURCE, 'import_statement');
		const [plain, pc] = find(SOURCE, 'import_statement', undefined, 1);
		expect(at('statement.import.typeOnly')(type, tc)).toBe(true);
		expect(at('statement.import.typeOnly')(plain, pc)).toBe(false);
	});

	it('reads a type-only export as an export, an export of all one included', () => {
		const SOURCE = 'export type { A } from "a";\nexport type * from "b";\nexport { C } from "c";\n';
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(froms.map(([n, c]) => at('statement.export')(n, c))).toEqual([true, true, true]);
		expect(froms.map(([n, c]) => at('statement.export.all')(n, c))).toEqual([false, true, false]);
	});

	it.skip('reads a type-only export by its keyword (pending: `typeOnly` is a flag of statement.export, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'export type { A } from "a";\nexport type * from "b";\nexport { C } from "c";\n';
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(froms.map(([n, c]) => at('statement.export.typeOnly')(n, c))).toEqual([true, true, false]);
	});

	it('pins a typeof specifier by its keyword, and reads a type-only specifier as a specifier', () => {
		const SOURCE = 'import { type A, typeof B, C, type D as E, typeof F as G, H as I } from "a";\nexport { type J, typeof K, L } from "b";\n';
		for (const form of ['import_specifier_name', 'import_specifier_as']) {
			const [type, tc] = find(SOURCE, form);
			const [typeOf, oc] = find(SOURCE, form, undefined, 1);
			const [plain, pc] = find(SOURCE, form, undefined, 2);
			expect(at('clause.import.specifier.typeof')(type, tc), form).toBe(false);
			expect(at('clause.import.specifier.typeof')(typeOf, oc), form).toBe(true);
			expect(at('clause.import.specifier')(type, tc), form).toBe(true);
			expect(at('clause.import.specifier')(plain, pc), form).toBe(true);
		}
		const [typeExport, te] = find(SOURCE, 'export_specifier');
		const [typeofExport, oe] = find(SOURCE, 'export_specifier', undefined, 1);
		const [plainExport, pe] = find(SOURCE, 'export_specifier', undefined, 2);
		expect(at('clause.export.specifier.typeof')(typeExport, te)).toBe(false);
		expect(at('clause.export.specifier.typeof')(typeofExport, oe)).toBe(true);
		expect(at('clause.export.specifier')(typeExport, te)).toBe(true);
		expect(at('clause.export.specifier')(plainExport, pe)).toBe(true);
	});

	it.skip('reads a type-only specifier by its keyword (pending: `typeOnly` is a flag of the specifiers, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'import { type A, C, type D as E, H as I } from "a";\nexport { type J, L } from "b";\n';
		for (const form of ['import_specifier_name', 'import_specifier_as']) {
			const [type, tc] = find(SOURCE, form);
			const [plain, pc] = find(SOURCE, form, undefined, 1);
			expect(at('clause.import.specifier.typeOnly')(type, tc), form).toBe(true);
			expect(at('clause.import.specifier.typeOnly')(plain, pc), form).toBe(false);
		}
		const [typeExport, te] = find(SOURCE, 'export_specifier');
		const [plainExport, pe] = find(SOURCE, 'export_specifier', undefined, 1);
		expect(at('clause.export.specifier.typeOnly')(typeExport, te)).toBe(true);
		expect(at('clause.export.specifier.typeOnly')(plainExport, pe)).toBe(false);
	});

	it('reads a default export and an export of all by their forms, as tree-sitter matches the claims', () => {
		const SOURCE = "export default x;\nexport * from 's';\nexport { a } from 's';\nexport * as n from 's';\nexport default function f() {}\nexport const c = 1;\n";
		const declarations = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_declaration', undefined, nth));
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(declarations.map(([n, c]) => at('statement.export.default')(n, c))).toEqual([true, true, false]);
		expect(declarations.map(([n, c]) => at('statement.export')(n, c))).toEqual([true, true, true]);
		expect(froms.map(([n, c]) => at('statement.export.all')(n, c))).toEqual([true, false, false]);
		expect(froms.map(([n, c]) => at('statement.export')(n, c))).toEqual([true, true, true]);
	});

	it('reads a negative literal type as a negative number', () => {
		const [negative, context] = find('let x: -1;\n', 'literal_type_negative_number');
		expect(at('literal.number.negative')(negative, context)).toBe(true);
	});

	it('reads a private name as a property identifier, where it is declared and where it is read', () => {
		const SOURCE = 'class C { #x = 1; m() { return this.#x; } }\n';
		const [declared, dc] = find(SOURCE, 'private_property_identifier');
		const [read, rc] = find(SOURCE, 'private_property_identifier', undefined, 1);
		expect(at('identifier.property')(declared, dc)).toBe(true);
		expect(at('identifier.property')(read, rc)).toBe(true);
	});
});

describe('portable is: the root of a file', () => {
	for (const [name, source, root] of [
		['python', 'import os\n', 'module'],
		['rust', 'mod m {}\n', 'source_file'],
		['typescript', 'module M {}\n', 'program']
	] as const) {
		it(`${name}: reads the root as a file`, async () => {
			const { at, find } = await surfaces(name);
			const [file] = find(source, root);
			expect(at('file')(file)).toBe(true);
		});
	}
	for (const [name, source, declared, root] of [
		['rust', 'mod m {}\n', 'mod_item_inline', 'source_file'],
		['typescript', 'module M {}\n', 'module', 'program']
	] as const) {
		it(`${name}: tells a module declared in a file from the file`, async () => {
			const { at, find } = await surfaces(name);
			const [module, context] = find(source, declared);
			const [file] = find(source, root);
			expect(at('declaration.module')(module, context)).toBe(true);
			expect(at('file')(module, context)).toBe(false);
			expect(at('declaration.module')(file)).toBe(false);
		});
	}
});

describe('portable is agrees with one classification', () => {
	const SOURCES = {
		python: 'import os\nclass A(B):\n    @staticmethod\n    def s(x: int = 1) -> str:\n        return f"{x}" + b"y".decode()\nwhile x > 0:\n    x -= 1\n',
		rust: 'use std::io;\npub static Z: u8 = 0;\nstruct S { a: u8 }\nfn f(x: &mut S) -> Option<u8> { let y = x.a + 1; if y > 2 { return Some(y); } let g = |a, mut b| a; None }\n',
		typescript: 'import { a } from "b";\nenum E { A, B = 1 }\nclass C extends D implements I { constructor() { super(); } m(): void { const x = a?.b ?? 1; } }\n// c\n'
	} as const;
	for (const name of Object.keys(SOURCES) as (keyof typeof SOURCES)[]) {
		it(`${name}: the paths a node is read as form one chain, and each admits the node's kind`, async () => {
			const { located, at, kindsAt, paths } = await surfaces(name);
			const canonical = new Map<Guard, string>();
			for (const path of paths()) {
				const known = canonical.get(at(path));
				if (known === undefined || path.split('.').length > known.split('.').length) canonical.set(at(path), path);
			}
			for (const [node, context] of located(SOURCES[name])) {
				const held = [...canonical].filter(([guard]) => guard(node, context)).map(([, path]) => path);
				const deepest = held.reduce((a, b) => (b.split('.').length > a.split('.').length ? b : a), held[0] ?? '');
				for (const path of held) {
					expect(deepest === path || deepest.startsWith(`${path}.`), `${path} beside ${deepest}`).toBe(true);
					expect(kindsAt(path).$ids).toContain(kindOf(node));
				}
			}
		});
	}
});
