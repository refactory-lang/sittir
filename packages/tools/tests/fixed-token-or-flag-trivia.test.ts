// A comment the parse places beside a node its holder keeps as a fixed token
// or a flag, which has no cell: the source parses and renders as itself in
// both storages, and a rebuild of the holder renders what master's renders.
// The holder is the innermost node whose render holds the keyword.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

type Rebuilt = { $render(): unknown };
type Node = Rebuilt & { readonly $with: Record<string, (...values: unknown[]) => Rebuilt> } & Record<string, unknown>;
type Root = Rebuilt & { $query(): { readonly $descendants: Iterable<unknown> } };

const CASES = {
	rust: [
		['fn f() { let y = & /*c*/ mut x; }\n', 'mut', '&mut x'],
		['fn f() { let y = &mut /*c*/ x; }\n', 'mut', '&mut x'],
		['static /*d*/ mut X: u8 = 0;\n', 'mut', 'static mut X: u8 = 0;'],
		['fn f(&mut /*c*/ self) {}\n', 'mut', '&mut self'],
		['fn f() { let /*c*/ mut x = 1; }\n', 'mut', 'let mut x = 1;'],
		['fn f() { let mut /*c*/ x = 1; }\n', 'mut', 'let mut x = 1;'],
		['fn f(x: & /*c*/ mut u8) {}\n', 'mut', '&mut u8'],
		['fn f() { let &mut /*c*/ x = y; }\n', 'mut', '&mut x'],
		['fn f(x: *mut /*c*/ u8) {}\n', 'mut', '*mut u8'],
		['fn f() { let y = &raw mut /*c*/ x; }\n', 'mut', '&raw mut x'],
		['extern crate /*c*/ foo;\n', 'crate', 'extern crate foo;'],
		['pub(crate /*c*/) fn f() {}\n', 'crate', '(crate /*c*/)'],
		['pub(/*c*/ crate) fn f() {}\n', 'crate', '(/*c*/ crate)'],
		['fn f(& /*c*/ self) {}\n', 'self', '&self'],
		['fn f(/*c*/ self) {}\n', 'self', 'self'],
		['fn f(self /*c*/) {}\n', 'self', 'self'],
		['pub(self /*c*/) fn f() {}\n', 'self', '(self /*c*/)']
	],
	typescript: [
		["let x: typeof import /*c*/ ('a');\n", 'import', "import ('a')"],
		['function f(this /*c*/: T) {}\n', 'this', 'this: T'],
		['a?. /*c*/ [0];\n', '?.', 'a?.[0]'],
		['a /*c*/ ?.[0];\n', '?.', 'a /*c*/?.[0]'],
		['class C extends B { override /*c*/ m() {} }\n', 'override', 'override m() {}'],
		['class C extends B { /*c*/ override m() {} }\n', 'override', 'override m() {}'],
		['class C { constructor(override /*c*/ x: T) {} }\n', 'override', 'override x: T']
	]
} as const;

const STORAGES = ['arena', 'object'] as const;

async function parsersOf(storage: (typeof STORAGES)[number]): Promise<Record<keyof typeof CASES, (source: string) => unknown>> {
	const rs = await sharedEngine(() => createEngine(rust, { nodeStorage: storage }));
	const ts = await sharedEngine(() => createEngine(typescript, { nodeStorage: storage }));
	return { rust: (source) => rs.parse(source), typescript: (source) => ts.parse(source) };
}

const parsers = { arena: await parsersOf('arena'), object: await parsersOf('object') };

const isNode = (value: unknown): value is Node => value !== null && typeof value === 'object' && '$with' in value;

function holderOf(root: Root, keyword: string): Node {
	const holders = [root, ...root.$query().$descendants].filter(isNode).filter((node) => String(node.$render()).includes(keyword));
	const innermost = holders.reduce((best, node) => (String(node.$render()).length <= String(best.$render()).length ? node : best));
	return innermost;
}

function rebuilds(holder: Node): string[] {
	return Object.keys(holder.$with)
		.filter((slot) => typeof holder.$with[slot] === 'function' && typeof holder[slot] === 'function')
		.map((slot) => {
			const value = (holder[slot] as () => unknown)();
			return String((Array.isArray(value) ? holder.$with[slot]!(...value) : holder.$with[slot]!(value)).$render());
		});
}

describe.each(STORAGES)('a comment beside a node its holder keeps as a fixed token or a flag, in %s storage', (storage) => {
	for (const name of ['rust', 'typescript'] as const) {
		for (const [source, keyword, rebuilt] of CASES[name]) {
			it(`${name} ${JSON.stringify(source)} renders as its source, and its holder rebuilt renders ${JSON.stringify(rebuilt)}`, () => {
				const root = parsers[storage][name](source) as Root;
				expect(String(root.$render())).toBe(source);
				const all = rebuilds(holderOf(root, keyword));
				expect(all.length).toBeGreaterThan(0);
				expect(new Set(all)).toEqual(new Set([rebuilt]));
			});
		}
	}
});
