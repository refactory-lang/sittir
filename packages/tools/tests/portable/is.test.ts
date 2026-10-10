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

	it('reads a decorated method by the decorator in its enclosing node, given the context', () => {
		const [s, context] = find(SOURCE, 'function_definition');
		const [c, classContext] = find(SOURCE, 'function_definition', undefined, 1);
		expect(at('declaration.method.static')(s, context)).toBe(true);
		expect(at('declaration.method.static')(c, classContext)).toBe(false);
		expect(at('declaration.method')(c, classContext)).toBe(true);
	});

	it('falls to the next entry without the context', () => {
		const [s] = find(SOURCE, 'function_definition');
		expect(at('declaration.method.static')(s)).toBe(false);
		expect(at('declaration.function')(s)).toBe(true);
	});

	it('tests a string prefix through the hidden string_start capture', () => {
		const [f, fc] = find('f"x"\n', 'string');
		const [b, bc] = find('b"x"\n', 'string');
		expect(at('literal.string.f')(f, fc)).toBe(true);
		expect(at('literal.string.bytes')(f, fc)).toBe(false);
		expect(at('literal.string.bytes')(b, bc)).toBe(true);
	});

	it('keeps the constructor and call paths though a function owns those names', () => {
		const [init, context] = find(SOURCE, 'function_definition', undefined, 2);
		expect(at('declaration.constructor')).not.toBe(Function.prototype.constructor);
		expect(at('declaration.constructor')(init, context)).toBe(true);
		expect(at('expression.call')).not.toBe(Function.prototype.call);
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

	it('tells a method with a receiver from an associated function, whatever order the impl lists them in', () => {
		const SOURCE = 'struct S;\nimpl S {\n    fn a(x: u8) {}\n    fn m(&self) {}\n    fn z() {}\n    fn n(&mut self, x: u8) {}\n}\n';
		const [a, m, z, n] = [0, 1, 2, 3].map((nth) => find(SOURCE, 'function_item', undefined, nth));
		for (const [fn, context] of [m!, n!]) {
			expect(at('declaration.method')(fn, context)).toBe(true);
			expect(at('declaration.method.static')(fn, context)).toBe(false);
		}
		for (const [fn, context] of [a!, z!]) expect(at('declaration.method.static')(fn, context)).toBe(true);
	});

	it('reads every kind a closure\'s parameters admit as a parameter, through the wildcard claim', () => {
		const SOURCE = 'fn f() { let g = |a, mut b| a; }\n';
		const [a, ac] = find(SOURCE, 'identifier', 'a');
		const [b, bc] = find(SOURCE, 'mut_pattern');
		expect(at('declaration.parameter')(a, ac)).toBe(true);
		expect(at('declaration.parameter')(b, bc)).toBe(true);
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
});

describe('portable is agrees with one classification', () => {
	const SOURCES = {
		python: 'import os\nclass A(B):\n    @staticmethod\n    def s(x: int = 1) -> str:\n        return f"{x}" + b"y".decode()\nwhile x > 0:\n    x -= 1\n',
		rust: 'use std::io;\nstruct S { a: u8 }\nfn f(x: &mut S) -> Option<u8> { let y = x.a + 1; if y > 2 { return Some(y); } let g = |a, mut b| a; None }\n',
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
