import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { PortableRows } from '@sittir/types';
import python from '../../../python/src/index.ts';
import { rows as pythonRows } from '../../../python/src/portable.ts';
import rust from '../../../rust/src/index.ts';
import { rows as rustRows } from '../../../rust/src/portable.ts';
import typescript from '../../../typescript/src/index.ts';
import { rows as typescriptRows } from '../../../typescript/src/portable.ts';

type Node = { readonly $type: number; readonly $text?: string; readonly $render?: () => string };
type Item = Node | number;
type Guard = ((node: unknown) => boolean) & Record<string, unknown>;

const kindOf = (item: Item): number => (typeof item === 'number' ? item : item.$type);

const languages = {
	python: [python, pythonRows],
	rust: [rust, rustRows],
	typescript: [typescript, typescriptRows]
} as const satisfies Record<string, readonly [unknown, PortableRows]>;

async function surfaces(name: keyof typeof languages) {
	const [descriptor, rows] = languages[name];
	const language = descriptor as typeof rust;
	const engine = await createEngine(language);
	const portable = (await createEngine(language, { api: 'portable' })) as unknown as { is: Record<string, unknown> };
	const kindName = (item: Item) => engine.trivia.kindName(kindOf(item));
	const located = (source: string): Item[] => {
		const out: Item[] = [];
		const walk = (node: Node): void => {
			out.push(node);
			const facet = (engine.query as unknown as (n: Node) => { readonly $children: Iterable<Item> })(node);
			for (const child of facet.$children) {
				if (typeof child === 'number') out.push(child);
				else walk(child);
			}
		};
		walk(engine.parse(source) as unknown as Node);
		return out;
	};
	const at = (path: string): Guard => path.split('.').reduce<unknown>((g, s) => (g as Record<string, unknown>)[s], portable.is) as Guard;
	const idsAt = (path: string): readonly number[] => rows.table.paths[path]?.ids ?? [];
	const paths = (): string[] => Object.keys(rows.table.paths);
	const find = (source: string, kind: string, text?: string, nth = 0): Item => {
		const hit = located(source).filter((n) => kindName(n) === kind && (text === undefined || (typeof n !== 'number' && (n.$text ?? n.$render?.()) === text)))[nth];
		if (hit === undefined) throw new Error(`no ${kind}${text === undefined ? '' : ` '${text}'`} in ${JSON.stringify(source)}`);
		return hit;
	};
	return { engine, located, at, idsAt, paths, find, kindName };
}

describe('portable is: python', async () => {
	const { at, find } = await surfaces('python');
	const SOURCE = 'class A:\n    @staticmethod\n    def s(): pass\n    @classmethod\n    def c(cls): pass\n    def __init__(self): pass\n    def m(self): pass\n';

	it('reads no method in a class body yet: a placement-dependent reading answers false until it is restated as a kind of its own', () => {
		const c = find(SOURCE, 'function_definition', undefined, 1);
		expect(at('declaration.method')(c)).toBe(false);
	});

	it.skip('reads a decorated method as static by its decorator (pending: `static` is a flag of declaration.method, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const s = find(SOURCE, 'function_definition');
		const c = find(SOURCE, 'function_definition', undefined, 1);
		expect(at('declaration.method.static')(s)).toBe(true);
		expect(at('declaration.method.static')(c)).toBe(false);
	});

	it('reads a decorated method in a class body as a function, the reading that needs no placement', () => {
		const s = find(SOURCE, 'function_definition');
		expect(at('declaration.function')(s)).toBe(true);
	});

	it('tests a string prefix through the hidden string_start capture', () => {
		const f = find('f"x"\n', 'string');
		const b = find('b"x"\n', 'string');
		expect(at('literal.string.interpolated')(f)).toBe(true);
		expect(at('literal.string.bytes')(f)).toBe(false);
		expect(at('literal.string.bytes')(b)).toBe(true);
	});

	it('reads an except clause as the one catch kind, and its finally as finally', () => {
		const SOURCE = 'try:\n    pass\nexcept E as e:\n    pass\nfinally:\n    pass\n';
		const handler = find(SOURCE, 'except_clause');
		const finalizer = find(SOURCE, 'finally_clause');
		expect(at('clause.catch')(handler)).toBe(true);
		expect(at('clause.finally')(finalizer)).toBe(true);
	});

	it('reads each text piece of a string as its text, an f-string\'s included', () => {
		const SOURCE = 'x = "a\\nb"\ny = f"c{x}"\n';
		for (const text of ['a', 'b', 'c']) {
			const fragment = find(SOURCE, 'string_fragment', text);
			expect(at('literal.string.text')(fragment), text).toBe(true);
		}
		const escape = find(SOURCE, 'escape_sequence_simple');
		expect(at('literal.string.text')(escape)).toBe(false);
	});

	it('keeps the constructor and call paths though a function owns those names', () => {
		const init = find(SOURCE, 'function_definition', undefined, 2);
		expect(at('declaration.constructor')).not.toBe(Function.prototype.constructor);
		expect(at('declaration.constructor')(init)).toBe(true);
		expect(at('expression.call')).not.toBe(Function.prototype.call);
	});

	it('reads a prefix letter wherever it stands, and a template string as interpolated', () => {
		const STRINGS = 'a = rf"{x}"\nb = Fr"{x}"\nc = t"{x}"\nd = Rb"x"\ne = R"x"\n';
		const strings = [0, 1, 2, 3, 4].map((nth) => find(STRINGS, 'string', undefined, nth));
		expect(strings.map((node) => at('literal.string.interpolated')(node))).toEqual([true, true, true, false, false]);
		const rb = find(STRINGS, 'string', undefined, 3);
		const r = find(STRINGS, 'string', undefined, 4);
		expect(at('literal.string.bytes')(rb)).toBe(true);
		expect(at('literal.string.raw')(r)).toBe(true);
	});

	it('reads a string whose prefix and quotes state several facts by their crossing', () => {
		const STRINGS = 'a = rf"{x}"\nb = Rb"x"\nc = f"""x"""\nd = br"""x"""\ne = r"""x"""\nf = tR"""{x}"""\ng = b"""x"""\n';
		const crossings = [
			'literal.string.interpolated.raw',
			'literal.string.bytes.raw',
			'literal.string.interpolated.multiline',
			'literal.string.bytes.raw.multiline',
			'literal.string.raw.multiline',
			'literal.string.interpolated.raw.multiline',
			'literal.string.bytes.multiline'
		];
		crossings.forEach((path, nth) => {
			const node = find(STRINGS, 'string', undefined, nth);
			expect(at(path)(node), path).toBe(true);
		});
		const rf = find(STRINGS, 'string');
		expect(at('literal.string.interpolated')(rf)).toBe(true);
	});

	it('reads each fact of a crossing by its own guard', () => {
		const cases: readonly (readonly [string, readonly string[]])[] = [
			['rf"{x}"', ['interpolated', 'raw']],
			['Rb"x"', ['bytes', 'raw']],
			['f"""x"""', ['interpolated', 'multiline']],
			['br"""x"""', ['bytes', 'raw', 'multiline']],
			['r"""x"""', ['raw', 'multiline']],
			['tR"""{x}"""', ['interpolated', 'raw', 'multiline']],
			['b"""x"""', ['bytes', 'multiline']],
			['"x"', []]
		];
		for (const [text, facts] of cases) {
			const node = find(`a = ${text}\n`, 'string');
			for (const fact of ['interpolated', 'bytes', 'raw', 'multiline'])
				expect(at(`literal.string.${fact}`)(node), `${text}: ${fact}`).toBe(facts.includes(fact));
			expect(at('literal.number')(node), text).toBe(false);
		}
	});

	it('reads a splat as a rest pattern or type, and a double splat as its map refinement', () => {
		const SOURCE = 'def f(*a, **k): pass\ndef g(a: *Ts, b: **P): pass\n';
		const rest = find(SOURCE, 'list_splat_pattern');
		const map = find(SOURCE, 'dictionary_splat_pattern');
		const restType = find(SOURCE, 'splat_type');
		const mapType = find(SOURCE, 'splat_type', undefined, 1);
		expect(at('pattern.rest')(rest)).toBe(true);
		expect(at('pattern.rest.map')(rest)).toBe(false);
		expect(at('pattern.rest.map')(map)).toBe(true);
		expect(at('type.rest')(restType)).toBe(true);
		expect(at('type.rest.map')(restType)).toBe(false);
		expect(at('type.rest.map')(mapType)).toBe(true);
	});

	it('reads a renamed import as the import alias', () => {
		const alias = find('import a.b as c\n', 'aliased_import');
		expect(at('clause.import.alias')(alias)).toBe(true);
	});

	it('reads a case as-pattern as the as-pattern, and a with item\'s as as no pattern', () => {
		const SOURCE = 'match x:\n    case [1] as y: pass\nwith open(p) as h: pass\n';
		const caseAs = find(SOURCE, 'case_as_pattern');
		const withAs = find(SOURCE, 'as_pattern');
		expect(at('pattern.as')(caseAs)).toBe(true);
		expect(at('pattern')(withAs)).toBe(false);
	});

	it('reads a comparison of one comparator by its operator, and of two or more as a chain, as tree-sitter matches the claims', () => {
		const COMPARISONS = 'a < b\na < b == c\na in b\n';
		const less = find(COMPARISONS, 'comparison_operator', 'a < b');
		const chain = find(COMPARISONS, 'comparison_operator', 'a < b == c');
		const membership = find(COMPARISONS, 'comparison_operator', 'a in b');
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.less')(n))).toEqual([true, false, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.equal')(n))).toEqual([false, false, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.comparison.chain')(n))).toEqual([false, true, false]);
		expect([less, chain, membership].map((n) => at('expression.binary.membership.in')(n))).toEqual([false, false, true]);
	});
});

describe('portable is: rust', async () => {
	const { engine, at, find } = await surfaces('rust');

	it('reads no boolean literal yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const t = find('fn f() { let a = true; let b = false; }\n', 'true_keyword');
		const f = find('fn f() { let a = true; let b = false; }\n', 'false_keyword');
		expect(typeof t).toBe('number');
		expect(at('literal.boolean.true')(t)).toBe(false);
		expect(at('literal.boolean.false')(f)).toBe(false);
	});

	it('reads a string literal\'s content as its text', () => {
		const SOURCE = 'fn f() { let a = "x\\ny"; }\n';
		for (const text of ['x', 'y']) {
			const content = find(SOURCE, 'string_content', text);
			expect(at('literal.string.text')(content), text).toBe(true);
		}
	});

	it('reads a string literal opening with b" as a byte string, and a plain or C string as none', () => {
		const SOURCE = 'fn f() { let a = b"ab"; let b = "cd"; let c = c"ef"; }\n';
		const strings = [0, 1, 2].map((nth) => find(SOURCE, 'string_literal', undefined, nth));
		expect(strings.map((node) => at('literal.string.bytes')(node))).toEqual([true, false, false]);
		expect(strings.map((node) => at('literal.string')(node))).toEqual([true, true, true]);
	});

	it('reads a self parameter by the receiver kind, and the self it names not yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const SOURCE = 'impl A { fn f(&self) -> u8 { self.x } }\n';
		const parameter = find(SOURCE, 'self_parameter');
		const receiver = find(SOURCE, 'self', undefined, 1);
		expect(at('declaration.parameter.receiver')(parameter)).toBe(true);
		expect(at('identifier.receiver')(receiver)).toBe(false);
	});

	it('reads a captured pattern as the as-pattern and a slice pattern as the list pattern', () => {
		const SOURCE = 'fn f(x: [u8; 2]) { match x { [n @ 1, _] => 1, _ => 0 }; }\n';
		const captured = find(SOURCE, 'captured_pattern');
		const slice = find(SOURCE, 'slice_pattern');
		expect(at('pattern.as')(captured)).toBe(true);
		expect(at('pattern.list')(slice)).toBe(true);
	});

	it('reads a numeric cast as the conversion and a renamed use as the import alias', () => {
		const SOURCE = 'use a::b as c;\nfn f() -> u8 { 1 as u8 }\n';
		const alias = find(SOURCE, 'use_as_clause');
		const cast = find(SOURCE, 'type_cast_expression');
		expect(at('clause.import.alias')(alias)).toBe(true);
		expect(at('expression.cast.conversion')(cast)).toBe(true);
	});

	it('reads trait bounds as the bounds clause', () => {
		const bounds = find('fn f<T: A + B>() {}\n', 'trait_bounds');
		expect(at('clause.bounds')(bounds)).toBe(true);
	});

	it('reads a kind-id leaf in the asking engine\'s language, on the low-level surface too', () => {
		const wildcard = find('fn f(x: u8) { match x { _ => 1 } }\n', 'wildcard_pattern');
		expect(typeof wildcard).toBe('number');
		expect((engine.is as unknown as Record<string, (v: unknown) => boolean>).pattern!(wildcard)).toBe(true);
	});

	it('pins an operator on a parsed node and on a built one alike', () => {
		const add = find('fn f() { a + b; }\n', 'binary_expression');
		expect(at('expression.binary.arithmetic.add')(add)).toBe(true);
		expect(at('expression.binary.arithmetic.subtract')(add)).toBe(false);
		const b = engine.build as unknown as Record<string, (...args: unknown[]) => Node>;
		const built = b.binaryExpression!({ left: b.identifier!('a'), operator: '-', right: b.identifier!('b') });
		expect(at('expression.binary.arithmetic.subtract')(built)).toBe(true);
		expect(at('expression.binary.arithmetic.add')(built)).toBe(false);
	});

	it('tells identifier from type_identifier, and a prelude type from another', () => {
		const SOURCE = 'fn f() { let x: Foo = y; let o: Option<u8> = z; }\n';
		const x = find(SOURCE, 'identifier', 'x');
		const foo = find(SOURCE, 'type_identifier', 'Foo');
		const option = find(SOURCE, 'type_identifier', 'Option');
		expect(at('identifier.type')(foo)).toBe(true);
		expect(at('identifier.type')(x)).toBe(false);
		expect(at('type.named.prelude')(option)).toBe(true);
		expect(at('identifier.type')(option)).toBe(false);
	});

	it('reads no method in an impl yet: a placement-dependent reading answers false until it is restated as a kind of its own', () => {
		const SOURCE = 'struct S;\nimpl S {\n    fn a(x: u8) {}\n    fn m(&self) {}\n    fn z() {}\n    fn n(&mut self, x: u8) {}\n}\n';
		const [m, n] = [1, 3].map((nth) => find(SOURCE, 'function_item', undefined, nth));
		for (const fn of [m!, n!]) expect(at('declaration.method')(fn)).toBe(false);
	});

	it.skip('tells a method with a receiver from an associated function, whatever order the impl lists them in (pending: `static` is a flag of declaration.method, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'struct S;\nimpl S {\n    fn a(x: u8) {}\n    fn m(&self) {}\n    fn z() {}\n    fn n(&mut self, x: u8) {}\n}\n';
		const [a, m, z, n] = [0, 1, 2, 3].map((nth) => find(SOURCE, 'function_item', undefined, nth));
		for (const fn of [m!, n!]) expect(at('declaration.method.static')(fn)).toBe(false);
		for (const fn of [a!, z!]) expect(at('declaration.method.static')(fn)).toBe(true);
	});

	it('reads a static item as a variable, and a visible one by its crossing', () => {
		const SOURCE = 'static A: u8 = 1;\npub static B: u8 = 2;\npub(crate) static C: u8 = 3;\nfn f() { let d = 4; }\n';
		const statics = [0, 1, 2].map((nth) => find(SOURCE, 'static_item', undefined, nth));
		const local = find(SOURCE, 'let_declaration');
		expect(statics.map((n) => at('declaration.variable')(n))).toEqual([true, true, true]);
		expect(statics.map((n) => at('declaration.variable.public')(n))).toEqual([false, true, true]);
		expect(statics.map((n) => at('declaration.variable.public.internal')(n))).toEqual([false, false, true]);
		expect(at('declaration.variable')(local)).toBe(true);
		expect(at('declaration.variable.public')(local)).toBe(false);
	});

	it.skip('reads a static item\'s `mut` and `ref` as its flags (pending: `mutable` and `byReference` are flags of declaration.variable, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'static A: u8 = 1;\nstatic mut B: u8 = 2;\nstatic ref C: u8 = 3;\n';
		const statics = [0, 1, 2].map((nth) => find(SOURCE, 'static_item', undefined, nth));
		expect(statics.map((n) => at('declaration.variable.mutable')(n))).toEqual([false, true, false]);
		expect(statics.map((n) => at('declaration.variable.byReference')(n))).toEqual([false, false, true]);
	});

	it('reads no closure parameter yet: a placement-dependent reading answers false until it is restated as a kind of its own', () => {
		const SOURCE = 'fn f() { let g = |a, mut b| a; }\n';
		const a = find(SOURCE, 'identifier', 'a');
		const b = find(SOURCE, 'mut_pattern');
		expect(at('declaration.parameter')(a)).toBe(false);
		expect(at('declaration.parameter')(b)).toBe(false);
	});

	it('reads a tuple struct and a unit struct by their forms, and a tuple struct\'s fields as fields', () => {
		const SOURCE = 'struct T(u8, pub u16);\nstruct U;\n';
		const tuple = find(SOURCE, 'struct_item_tuple');
		const unit = find(SOURCE, 'struct_item_unit');
		expect(at('declaration.struct.tuple')(tuple)).toBe(true);
		expect(at('declaration.struct.unit')(tuple)).toBe(false);
		expect(at('declaration.struct.unit')(unit)).toBe(true);
		expect(at('declaration.struct')(unit)).toBe(true);
		const field = find(SOURCE, 'attributed_ordered_field', 'pub u16');
		expect(at('declaration.field')(field)).toBe(true);
	});

	it('reads an array repeat expression by its form', () => {
		const SOURCE = 'fn f() { let a = [0; 3]; let b = [1, 2]; }\n';
		const repeat = find(SOURCE, 'array_expression_semi');
		const list = find(SOURCE, 'array_expression_list');
		expect(at('expression.collection.list.repeat')(repeat)).toBe(true);
		expect(at('expression.collection.list.repeat')(list)).toBe(false);
	});

	it('pins a prefix range pattern by its operator, and never reads a range with a left bound as exclusive by default', () => {
		const SOURCE = 'fn f(x: u8) { match x { ..=5 => 0, ..9 => 1, 1..=5 => 2, _ => 3 } }\n';
		const inclusive = find(SOURCE, 'range_pattern_prefix', '..=5');
		const exclusive = find(SOURCE, 'range_pattern_prefix', '..9');
		const left = find(SOURCE, 'range_pattern_with_left', '1..=5');
		expect(at('pattern.range.inclusive')(inclusive)).toBe(true);
		expect(at('pattern.range.exclusive')(inclusive)).toBe(false);
		expect(at('pattern.range.exclusive')(exclusive)).toBe(true);
		expect(at('pattern.range.inclusive')(exclusive)).toBe(false);
		expect(at('pattern.range')(left)).toBe(true);
		expect(at('pattern.range.exclusive')(left)).toBe(false);
	});

	it('reads a range with a left bound by its operator, as tree-sitter matches the claims', () => {
		const SOURCE = 'fn f() { match x { 1..=5 => {}, 1...5 => {}, 1..5 => {}, 1.. => {}, _ => {} } }\n';
		const ranges = ['1..=5', '1...5', '1..5', '1..'].map((text) => find(SOURCE, 'range_pattern_with_left', text));
		expect(ranges.map((n) => at('pattern.range.inclusive')(n))).toEqual([true, true, false, false]);
		expect(ranges.map((n) => at('pattern.range.exclusive')(n))).toEqual([false, false, true, true]);
		expect(ranges.map((n) => at('pattern.range')(n))).toEqual([true, true, true, true]);
	});

	it('pins a range expression by its operator, and reads a range open at either end as exclusive', () => {
		const SOURCE = 'fn f() { let a = 1..=2; let b = 1...2; let c = 1..2; let d = 1..; let e = ..2; let g = ..; }\n';
		for (const text of ['1..=2', '1...2']) {
			const range = find(SOURCE, 'range_expression_binary', text);
			expect(at('expression.range.inclusive')(range), text).toBe(true);
			expect(at('expression.range.exclusive')(range), text).toBe(false);
		}
		for (const [kind, text] of [
			['range_expression_binary', '1..2'],
			['range_expression_postfix', '1..'],
			['range_expression_prefix', '..2'],
			['range_expression_bare', undefined]
		] as const) {
			const range = find(SOURCE, kind, text);
			expect(at('expression.range.exclusive')(range), kind).toBe(true);
			expect(at('expression.range.inclusive')(range), kind).toBe(false);
		}
	});
	it('reads no primitive type yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const SOURCE = 'fn f(a: i8, b: u8, c: i128, d: isize, e: usize, g: f32, h: f64, i: bool, j: char, k: &str) -> ! { loop {} }\n';
		for (const [keyword, path] of [
			['i8_keyword', 'type.primitive.integral.int8'],
			['u8_keyword', 'type.primitive.integral.int8'],
			['i128_keyword', 'type.primitive.integral.int128'],
			['isize_keyword', 'type.primitive.integral.size'],
			['usize_keyword', 'type.primitive.integral.size'],
			['f32_keyword', 'type.primitive.floating.float32'],
			['f64_keyword', 'type.primitive.floating.float64'],
			['bool_keyword', 'type.primitive.boolean'],
			['char_keyword', 'type.primitive.character'],
			['str_keyword', 'type.primitive.string'],
			['never_type', 'type.primitive.never']
		] as const) {
			const node = find(SOURCE, keyword);
			expect(typeof node, keyword).toBe('number');
			expect(at(path)(node), keyword).toBe(false);
			expect(at('type.primitive')(node), keyword).toBe(false);
		}
	});

	it.skip('reads an unsigned width by its flag (pending: `unsigned` is a flag of type.primitive.integral, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'fn f(a: i8, b: u8) {}\n';
		const signed = find(SOURCE, 'i8_keyword');
		const unsigned = find(SOURCE, 'u8_keyword');
		expect(at('type.primitive.integral.int8.unsigned')(unsigned)).toBe(true);
		expect(at('type.primitive.integral.int8.unsigned')(signed)).toBe(false);
	});
});

describe('portable is: typescript', async () => {
	const { at, find } = await surfaces('typescript');

	it('reads each parser comment form directly and tests a documentation block by its own text', async () => {
		const commentEngine = await createEngine(typescript);
		const root = commentEngine.parse('/** doc */\n/* block */\n// line\n<!-- html -->\nlet x = 1;\n');
		const { CommentBlock, CommentLine, HtmlComment } = commentEngine.kinds;
		const statement = root.statements()[0];
		if (statement === undefined || typeof statement === 'number') throw new Error('expected the declaration after the leading comments');
		const leading = statement.$trivia.leading();
		const [doc, block] = leading.filter((item) => typeof item !== 'number' && item.$type === CommentBlock);
		const line = leading.find((item) => typeof item !== 'number' && item.$type === CommentLine);
		const html = leading.find((item) => typeof item !== 'number' && item.$type === HtmlComment);
		for (const comment of [doc, block, line, html]) {
			expect(comment).toBeDefined();
			expect(at('comment')(comment)).toBe(true);
		}
		expect(at('comment.block.doc')(doc)).toBe(true);
		expect(at('comment.block.doc')(block)).toBe(false);
		expect(at('comment.block')(doc)).toBe(true);
		expect(at('comment.block')(block)).toBe(true);
		expect(at('comment.line')(line)).toBe(true);
		expect(at('comment.line')(block)).toBe(false);
		expect(typeof at('comment.html')).toBe('function');
		expect(at('comment.html')(html)).toBe(true);
		expect(at('comment.html')(line)).toBe(false);
		expect(at('comment.block')(html)).toBe(false);
	});

	it('reads a double-quoted string\'s fragment as its text', () => {
		const fragment = find('let a = "x";\n', 'unescaped_double_string_fragment');
		expect(at('literal.string.text')(fragment)).toBe(true);
	});

	it('reads a template string as an interpolated string, whether or not it substitutes', () => {
		const SOURCE = 'let a = `x${y}`;\nlet b = `z`;\nlet c = "w";\n';
		const strings = [find(SOURCE, 'template_string'), find(SOURCE, 'template_string', undefined, 1), find(SOURCE, 'string_double')];
		expect(strings.map((node) => at('literal.string.interpolated')(node))).toEqual([true, true, false]);
		expect(strings.map((node) => at('literal.string')(node))).toEqual([true, true, true]);
	});

	it('reads a maybe type as a nullable type', () => {
		const maybe = find('let a: ?string;\n', 'flow_maybe_type');
		expect(at('type.nullable')(maybe)).toBe(true);
	});

	it('reads an array pattern as the list pattern, and its rest as the rest pattern', () => {
		const SOURCE = 'const [a, ...b] = c;\ntype T = [...U];\n';
		const list = find(SOURCE, 'array_pattern');
		const rest = find(SOURCE, 'rest_pattern');
		const restType = find(SOURCE, 'rest_type');
		expect(at('pattern.list')(list)).toBe(true);
		expect(at('pattern.rest')(rest)).toBe(true);
		expect(at('type.rest')(restType)).toBe(true);
	});

	it('reads both assertions as the assertion, the angle-bracket one by its refinement, and import-equals as the import alias statement', () => {
		const SOURCE = 'let a = x as T;\nlet b = <T>x;\nlet c = x satisfies T;\nimport A = N.B;\n';
		const as = find(SOURCE, 'as_expression');
		const angle = find(SOURCE, 'type_assertion');
		const satisfies = find(SOURCE, 'satisfies_expression');
		const alias = find(SOURCE, 'import_alias');
		expect(at('expression.cast.assertion')(as)).toBe(true);
		expect(at('expression.cast.assertion.angle_bracket')(as)).toBe(false);
		expect(at('expression.cast.assertion.angle_bracket')(angle)).toBe(true);
		expect(at('expression.cast.satisfies')(satisfies)).toBe(true);
		expect(at('statement.import.alias')(alias)).toBe(true);
	});

	it('reads a type parameter\'s constraint as the bounds clause', () => {
		const bounds = find('function f<T extends U>() {}\n', 'constraint');
		expect(at('clause.bounds')(bounds)).toBe(true);
	});

	it('reads no this yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const receiver = find('class A { f() { return this; } }\n', 'this');
		expect(at('identifier.receiver')(receiver)).toBe(false);
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

	it('reads a catch clause as the one catch kind, with or without its binding', () => {
		const SOURCE = 'try { a(); } catch (e: unknown) { b(); }\ntry { c(); } catch { d(); }\n';
		const bound = find(SOURCE, 'catch_clause');
		const bare = find(SOURCE, 'catch_clause', undefined, 1);
		expect(at('clause.catch')(bound)).toBe(true);
		expect(at('clause.catch')(bare)).toBe(true);
	});

	it('reads an enum member through the wildcard claim under the enum body\'s elements', () => {
		const member = find('enum E { A, B = 1 }\n', 'enum_assignment');
		expect(at('declaration.enum_member')(member)).toBe(true);
	});

	it('holds a supertype\'s path for a variant that reads by a claim of its own', () => {
		const hex = find('let x = 0x1F;\n', 'number_hex');
		expect(at('literal.number.integer.hex')(hex)).toBe(true);
		expect(at('literal.number')(hex)).toBe(true);
	});

	it('reads a method by its visibility keyword, which the reader holds as the modifier\'s member kind', () => {
		const SOURCE = 'class C { private a() {} protected b() {} public c() {} d() {} }\n';
		const methods = [0, 1, 2, 3].map((n) => find(SOURCE, 'method_definition', undefined, n));
		expect(methods.map((n) => at('declaration.method.private')(n))).toEqual([true, false, false, false]);
		expect(methods.map((n) => at('declaration.method.protected')(n))).toEqual([false, true, false, false]);
		expect(methods.map((n) => at('declaration.method.public')(n))).toEqual([false, false, true, false]);
		expect(methods.map((n) => at('declaration.method')(n))).toEqual([true, true, true, true]);
	});

	it('reads a mapped index signature by its form', () => {
		const SOURCE = 'type M = { [K in keyof T]: T[K] };\ninterface I { [k: string]: number }\n';
		const mapped = find(SOURCE, 'index_signature_mapped_type_clause');
		const colon = find(SOURCE, 'index_signature_colon');
		expect(at('declaration.signature.index.mapped')(mapped)).toBe(true);
		expect(at('declaration.signature.index.mapped')(colon)).toBe(false);
	});

	it('pins a typeof import by its keyword, and reads a type-only import as an import', () => {
		const SOURCE = 'import type { A } from "a";\nimport typeof B from "b";\nimport { C } from "c";\n';
		const type = find(SOURCE, 'import_statement');
		const typeOf = find(SOURCE, 'import_statement', undefined, 1);
		const plain = find(SOURCE, 'import_statement', undefined, 2);
		expect(at('statement.import.typeof')(type)).toBe(false);
		expect(at('statement.import.typeof')(typeOf)).toBe(true);
		expect(at('statement.import')(type)).toBe(true);
		expect(at('statement.import')(plain)).toBe(true);
	});

	it.skip('reads a type-only import by its keyword (pending: `typeOnly` is a flag of statement.import, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'import type { A } from "a";\nimport { C } from "c";\n';
		const type = find(SOURCE, 'import_statement');
		const plain = find(SOURCE, 'import_statement', undefined, 1);
		expect(at('statement.import.typeOnly')(type)).toBe(true);
		expect(at('statement.import.typeOnly')(plain)).toBe(false);
	});

	it('reads a type-only export as an export, an export of all one included', () => {
		const SOURCE = 'export type { A } from "a";\nexport type * from "b";\nexport { C } from "c";\n';
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(froms.map((n) => at('statement.export')(n))).toEqual([true, true, true]);
		expect(froms.map((n) => at('statement.export.all')(n))).toEqual([false, true, false]);
	});

	it.skip('reads a type-only export by its keyword (pending: `typeOnly` is a flag of statement.export, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'export type { A } from "a";\nexport type * from "b";\nexport { C } from "c";\n';
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(froms.map((n) => at('statement.export.typeOnly')(n))).toEqual([true, true, false]);
	});

	it('pins a typeof specifier by its keyword, and reads a type-only specifier as a specifier', () => {
		const SOURCE = 'import { type A, typeof B, C, type D as E, typeof F as G, H as I } from "a";\nexport { type J, typeof K, L } from "b";\n';
		for (const form of ['import_specifier_name', 'import_specifier_as']) {
			const type = find(SOURCE, form);
			const typeOf = find(SOURCE, form, undefined, 1);
			const plain = find(SOURCE, form, undefined, 2);
			expect(at('clause.import.specifier.typeof')(type), form).toBe(false);
			expect(at('clause.import.specifier.typeof')(typeOf), form).toBe(true);
			expect(at('clause.import.specifier')(type), form).toBe(true);
			expect(at('clause.import.specifier')(plain), form).toBe(true);
		}
		const typeExport = find(SOURCE, 'export_specifier');
		const typeofExport = find(SOURCE, 'export_specifier', undefined, 1);
		const plainExport = find(SOURCE, 'export_specifier', undefined, 2);
		expect(at('clause.export.specifier.typeof')(typeExport)).toBe(false);
		expect(at('clause.export.specifier.typeof')(typeofExport)).toBe(true);
		expect(at('clause.export.specifier')(typeExport)).toBe(true);
		expect(at('clause.export.specifier')(plainExport)).toBe(true);
	});

	it.skip('reads a type-only specifier by its keyword (pending: `typeOnly` is a flag of the specifiers, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const SOURCE = 'import { type A, C, type D as E, H as I } from "a";\nexport { type J, L } from "b";\n';
		for (const form of ['import_specifier_name', 'import_specifier_as']) {
			const type = find(SOURCE, form);
			const plain = find(SOURCE, form, undefined, 1);
			expect(at('clause.import.specifier.typeOnly')(type), form).toBe(true);
			expect(at('clause.import.specifier.typeOnly')(plain), form).toBe(false);
		}
		const typeExport = find(SOURCE, 'export_specifier');
		const plainExport = find(SOURCE, 'export_specifier', undefined, 1);
		expect(at('clause.export.specifier.typeOnly')(typeExport)).toBe(true);
		expect(at('clause.export.specifier.typeOnly')(plainExport)).toBe(false);
	});

	it('reads a default export and an export of all by their forms, as tree-sitter matches the claims', () => {
		const SOURCE = "export default x;\nexport * from 's';\nexport { a } from 's';\nexport * as n from 's';\nexport default function f() {}\nexport const c = 1;\n";
		const declarations = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_declaration', undefined, nth));
		const froms = [0, 1, 2].map((nth) => find(SOURCE, 'export_statement_default_from', undefined, nth));
		expect(declarations.map((n) => at('statement.export.default')(n))).toEqual([true, true, false]);
		expect(declarations.map((n) => at('statement.export')(n))).toEqual([true, true, true]);
		expect(froms.map((n) => at('statement.export.all')(n))).toEqual([true, false, false]);
		expect(froms.map((n) => at('statement.export')(n))).toEqual([true, true, true]);
	});

	it('reads a getter, a setter and an auto-accessor as properties, and a plain method or field as neither', () => {
		const SOURCE = 'class C { get g() { return 1; } set s(v) {} private get p() { return 2; } m() {} accessor a = 1; f = 2; }\n';
		const getter = find(SOURCE, 'method_definition');
		const setter = find(SOURCE, 'method_definition', undefined, 1);
		const privateGetter = find(SOURCE, 'method_definition', undefined, 2);
		const method = find(SOURCE, 'method_definition', undefined, 3);
		const auto = find(SOURCE, 'public_field_definition');
		const field = find(SOURCE, 'public_field_definition', undefined, 1);
		expect(at('declaration.property.getter')(getter)).toBe(true);
		expect(at('declaration.property')(getter)).toBe(true);
		expect(at('declaration.method')(getter)).toBe(false);
		expect(at('declaration.property.setter')(setter)).toBe(true);
		expect(at('declaration.property.getter')(setter)).toBe(false);
		expect(at('declaration.property.getter.private')(privateGetter)).toBe(true);
		expect(at('declaration.method.private')(privateGetter)).toBe(false);
		expect(at('declaration.method')(method)).toBe(true);
		expect(at('declaration.property')(method)).toBe(false);
		expect(at('declaration.property')(auto)).toBe(true);
		expect(at('declaration.field')(auto)).toBe(false);
		expect(at('declaration.field')(field)).toBe(true);
		expect(at('declaration.property')(field)).toBe(false);
	});

	it('reads an accessor signature as a property signature, abstract or not', () => {
		const SOURCE = 'interface I { get x(): number; m(): void; }\nabstract class A { abstract set y(v: number); abstract n(): void; }\n';
		const getter = find(SOURCE, 'method_signature');
		const method = find(SOURCE, 'method_signature', undefined, 1);
		const setter = find(SOURCE, 'abstract_method_signature');
		const abstractMethod = find(SOURCE, 'abstract_method_signature', undefined, 1);
		expect(at('declaration.property.signature.getter')(getter)).toBe(true);
		expect(at('declaration.method.signature')(getter)).toBe(false);
		expect(at('declaration.method.signature')(method)).toBe(true);
		expect(at('declaration.property.signature.abstract.setter')(setter)).toBe(true);
		expect(at('declaration.property.signature')(setter)).toBe(true);
		expect(at('declaration.method.signature.abstract')(setter)).toBe(false);
		expect(at('declaration.method.signature.abstract')(abstractMethod)).toBe(true);
	});

	it('reads a negative literal type as a negative number', () => {
		const negative = find('let x: -1;\n', 'literal_type_negative_number');
		expect(at('literal.number.negative')(negative)).toBe(true);
	});

	it('reads a private name as a property identifier, where it is declared and where it is read', () => {
		const SOURCE = 'class C { #x = 1; m() { return this.#x; } }\n';
		const declared = find(SOURCE, 'private_property_identifier');
		const read = find(SOURCE, 'private_property_identifier', undefined, 1);
		expect(at('identifier.property')(declared)).toBe(true);
		expect(at('identifier.property')(read)).toBe(true);
	});
	it('reads no predefined type yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const SOURCE = 'let a: any; let b: number; let c: boolean; let d: string; let e: symbol; let g: void; let h: unknown; let i: never; let j: object;\n';
		for (const [keyword, path] of [
			['any_keyword', 'type.primitive.unchecked'],
			['number_keyword', 'type.primitive.floating.float64'],
			['boolean_keyword', 'type.primitive.boolean'],
			['string_keyword', 'type.primitive.string'],
			['symbol_keyword', 'type.primitive.symbol'],
			['void_keyword', 'type.primitive.void'],
			['unknown_keyword', 'type.primitive.unknown'],
			['never_keyword', 'type.primitive.never'],
			['object_keyword', 'type.primitive.object']
		] as const) {
			const node = find(SOURCE, keyword);
			expect(typeof node, keyword).toBe('number');
			expect(at(path)(node), keyword).toBe(false);
			expect(at('type.primitive')(node), keyword).toBe(false);
		}
	});

	it('reads no unique symbol yet: a keyword leaf reads as a bare kind id, which names no engine until parsed units carry identity', () => {
		const unique = find('declare const s: unique symbol;\n', 'unique');
		expect(at('type.primitive.symbol')(unique)).toBe(false);
	});

	it.skip('reads a unique symbol by its flag (pending: `unique` is a flag of type.primitive.symbol, and the runtime flag is-guards come with the runtime-bindings stage)', () => {
		const unique = find('declare const s: unique symbol;\n', 'unique');
		const plain = find('let s: symbol;\n', 'symbol_keyword');
		expect(at('type.primitive.symbol.unique')(unique)).toBe(true);
		expect(at('type.primitive.symbol.unique')(plain)).toBe(false);
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
			const file = find(source, root);
			expect(at('file')(file)).toBe(true);
		});
	}
	for (const [name, source, declared, root] of [
		['rust', 'mod m {}\n', 'mod_item_inline', 'source_file'],
		['typescript', 'module M {}\n', 'module', 'program']
	] as const) {
		it(`${name}: tells a module declared in a file from the file`, async () => {
			const { at, find } = await surfaces(name);
			const module = find(source, declared);
			const file = find(source, root);
			expect(at('declaration.module')(module)).toBe(true);
			expect(at('file')(module)).toBe(false);
			expect(at('declaration.module')(file)).toBe(false);
		});
	}
});

describe('portable is agrees with one classification', () => {
	const SOURCES = {
		python: 'import os\nclass A(B):\n    @staticmethod\n    def s(x: int = 1) -> str:\n        return f"{x}" + b"y".decode()\nwhile x > 0:\n    x -= 1\n',
		rust: 'use std::io;\npub static Z: u8 = 0;\nstruct S { a: u8 }\nfn f(x: &mut S) -> Option<u8> { let y = x.a + 1; if y > 2 { return Some(y); } let g = |a, mut b| a; None }\n',
		typescript: 'import { a } from "b";\nenum E { A, B = 1 }\nclass C extends D implements I { constructor() { super(); } m(): void { const x = a?.b ?? 1; } get g() { return 1; } accessor p = 1; }\n// c\n'
	} as const;
	for (const name of Object.keys(SOURCES) as (keyof typeof SOURCES)[]) {
		it(`${name}: each guard names facts of one classification and admits the node's kind`, async () => {
			const { located, at, idsAt, paths } = await surfaces(name);
			const canonical = new Map<Guard, string>();
			for (const path of paths()) {
				const known = canonical.get(at(path));
				if (known === undefined || path.split('.').length > known.split('.').length) canonical.set(at(path), path);
			}
			for (const node of located(SOURCES[name])) {
				const held = [...canonical].filter(([guard]) => guard(node)).map(([, path]) => path);
				const deepest = held.reduce((a, b) => (b.split('.').length > a.split('.').length ? b : a), held[0] ?? '');
				for (const path of held) {
					const facts = path.split('.').map((fact) => fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:\\.[^.]+)*\\.');
					expect(deepest, path).toMatch(new RegExp(`^${facts}(?:\\.[^.]+)*$`));
					expect(idsAt(path)).toContain(kindOf(node));
				}
			}
		});
	}
});

describe('portable is: each kind under its neutral name', () => {
	const NEUTRAL = {
		python: [
			['f(*a)\n', 'list_splat', 'element.spread'],
			['f(**a)\n', 'dictionary_splat', 'element.spread.map'],
			['with a as b:\n    pass\n', 'with_statement', 'statement.resource'],
			['with a as b:\n    pass\n', 'with_clause_bare', 'clause.resource'],
			['with a as b:\n    pass\n', 'with_item', 'clause.resource.item'],
			['if a:\n    pass\nelif b:\n    pass\n', 'elif_clause', 'clause.else_if'],
			['f(k=1)\n', 'keyword_argument', 'argument.named'],
			['a @ b\n', 'binary_operator', 'expression.binary.matrix_multiply'],
			['a @= b\n', 'augmented_assignment', 'expression.assignment.compound.matrix_multiply'],
			['{k: v for k in x}\n', 'dictionary_comprehension', 'expression.comprehension.map'],
			['{1: 2}\n', 'dictionary', 'expression.collection.map'],
			['"""x"""\n', 'string', 'literal.string.multiline'],
			['for x in y:\n    pass\n', 'for_statement', 'statement.loop.for_each'],
			['class A:\n    def __add__(self, o): pass\n', 'function_definition', 'declaration.method.special']
		],
		rust: [
			['extern crate foo;\n', 'extern_crate_declaration', 'statement.import.package'],
			['fn f() { for x in y {} }\n', 'for_expression', 'statement.loop.for_each'],
			['fn f() { a::b(); }\n', 'call_expression', 'expression.call.qualified'],
			['fn f() -> Option<u8> { x?; None }\n', 'try_expression', 'expression.propagate'],
			["fn f() { let c = 'a'; }\n", 'char_literal_plain', 'literal.character'],
			['fn f() { let g = gen { yield 1; }; }\n', 'gen_block', 'expression.block.generator']
		],
		typescript: [
			['for (const x of y) {}\n', 'for_in_statement', 'statement.loop.for_each'],
			['f(...a);\n', 'spread_element', 'element.spread'],
			['new A();\n', 'new_expression', 'expression.call.construct'],
			['a ?? b;\n', 'binary_expression', 'expression.binary.coalesce'],
			['a ??= b;\n', 'augmented_assignment_expression', 'expression.assignment.compound.coalesce']
		]
	} as const;
	for (const name of Object.keys(NEUTRAL) as (keyof typeof NEUTRAL)[]) {
		it(`${name}: reads each renamed kind by its neutral path`, async () => {
			const { at, find } = await surfaces(name);
			for (const [source, kind, path] of NEUTRAL[name]) {
				const node = find(source, kind);
				expect(at(path)(node), `${kind} as ${path}`).toBe(true);
			}
		});
	}
});
