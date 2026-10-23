import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	classifyKey,
	compareWithCeilings,
	enumerateDeclarations,
	loweredCeilings,
	measure,
	run
} from '../src/validate/glossary-keys.ts';

const SOURCE = `
export class Box {
	constructor(public readonly width: number, private secret: string, plain: number) {}
	public open(): void {}
	protected tilt(): void {}
	private hidden(): void {}
	#sealed = 1;
	get size(): number { return 1; }
	label: { readonly short: string; readonly nested: { readonly deep: number } } = { short: '', nested: { deep: 0 } };
}
export interface Shape { readonly sides: number; area(): number; }
export type Config = { readonly mode: 'a' | 'b' } & { readonly extra?: { readonly flag: boolean } };
export enum Color { Red, Green }
export const TABLE = { alpha: { beta: 1 }, gamma: 2 } as const;
export function over(a: string): void;
export function over(a: number): void;
export function over(a: unknown): void {}
function local(): void {}
const unlisted = 1;
export { local };
export namespace Outer { export const inner = 1; const quiet = 2; export function act(): void {} }
export class Other { open(): void {} }
`;

const paths = (source: string, only?: boolean): string[] =>
	enumerateDeclarations('probe.ts', source)
		.filter((declaration) => only === undefined || declaration.exported === only)
		.map((declaration) => declaration.path.join('::'))
		.sort();

describe('enumerateDeclarations', () => {
	it('enumerates every level of owner, with constructor and parameter properties, and leaves out private members', () => {
		const all = paths(SOURCE);
		expect(all).toEqual(
			expect.arrayContaining([
				'Box',
				'Box::constructor',
				'Box::width',
				'Box::open',
				'Box::tilt',
				'Box::size',
				'Box::label',
				'Box::label::short',
				'Box::label::nested',
				'Box::label::nested::deep',
				'Shape::sides',
				'Shape::area',
				'Config::mode',
				'Config::extra',
				'Config::extra::flag',
				'Color::Red',
				'Color::Green',
				'TABLE::alpha',
				'TABLE::alpha::beta',
				'TABLE::gamma',
				'Outer::inner',
				'Outer::act',
				'Other::open'
			])
		);
		expect(all).not.toContain('Box::secret');
		expect(all).not.toContain('Box::plain');
		expect(all).not.toContain('Box::hidden');
		expect(all).not.toContain('Box::#sealed');
	});

	it('counts an overload set once', () => {
		expect(paths(SOURCE).filter((path) => path === 'over')).toHaveLength(1);
	});

	it('marks exported what is exported by modifier or by an export list, and nothing else', () => {
		const exported = paths(SOURCE, true);
		expect(exported).toContain('local');
		expect(exported).toContain('Outer::act');
		expect(exported).not.toContain('unlisted');
		expect(exported).not.toContain('Outer::quiet');
		expect(paths(SOURCE, false)).toEqual(expect.arrayContaining(['unlisted', 'Outer::quiet']));
	});

	it('reads the members of an owner that is not exported as unexported', () => {
		expect(paths('class Hidden { open(): void {} }', true)).toEqual([]);
	});
});

describe('classifyKey', () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'glossary-keys-'));
		writeSource(root, 'packages/common/src/probe.ts', SOURCE);
	});
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	const classOf = (key: string): string => {
		const declarations = new Map([['packages/common/src/probe.ts', enumerateDeclarations('probe.ts', SOURCE)]]);
		return classifyKey(key, root, declarations).class;
	};
	const FILE = 'packages/common/src/probe.ts';

	it('accepts a top-level name and a name declared by exactly one owner', () => {
		expect(classOf(`${FILE}::Box`)).toBe('ok-bare-unique');
		expect(classOf(`${FILE}::tilt`)).toBe('ok-bare-unique');
	});

	it('accepts an owner-qualified name along its full path', () => {
		expect(classOf(`${FILE}::Other::open`)).toBe('ok-owner-qualified');
		expect(classOf(`${FILE}::Box::label::nested::deep`)).toBe('ok-owner-qualified');
		expect(classOf(`${FILE}::TABLE::alpha::beta`)).toBe('ok-owner-qualified');
	});

	it('refuses a suffix of a longer path', () => {
		expect(classOf(`${FILE}::nested::deep`)).toBe('wrong-owner');
		expect(classOf(`${FILE}::Box::nested`)).toBe('wrong-owner');
	});

	it('accepts the file-level module key for an existing file', () => {
		expect(classOf(`${FILE}::module`)).toBe('ok-module');
		expect(classOf('packages/common/src/gone.ts::module')).toBe('file-missing');
	});

	it('names each way a key is broken', () => {
		expect(classOf(`${FILE}::open`)).toBe('ambiguous');
		expect(classOf(`${FILE}::vanished`)).toBe('no-declaration');
		expect(classOf(`${FILE}::Other::tilt`)).toBe('wrong-owner');
		expect(classOf(`${FILE}::Box.open`)).toBe('dot-separated');
		expect(classOf(`${FILE}::<unknown>`)).toBe('placeholder');
		expect(classOf('packages/cli/src/cli.ts::run')).toBe('out-of-scope-file');
		expect(classOf('packages/common/src/gone.ts::run')).toBe('file-missing');
	});
});

describe('ceilings', () => {
	const counts = {
		ambiguous: 1,
		'no-declaration': 2,
		'wrong-owner': 0,
		'dot-separated': 3,
		placeholder: 0,
		'out-of-scope-file': 0,
		'file-missing': 0,
		undocumented: 10
	};

	it('reports a count above its ceiling and a class with no ceiling', () => {
		expect(compareWithCeilings(counts, { ...counts, undocumented: 9 }).map((entry) => entry.name)).toEqual([
			'undocumented'
		]);
		const { ambiguous: _ambiguous, ...partial } = counts;
		expect(compareWithCeilings(counts, partial).map((entry) => entry.name)).toEqual(['ambiguous']);
	});

	it('lowers a ceiling to a smaller count and never raises one', () => {
		const lowered = loweredCeilings({ ...counts, undocumented: 4, ambiguous: 7 }, counts);
		expect(lowered.undocumented).toBe(4);
		expect(lowered.ambiguous).toBe(1);
	});
});

function writeSource(root: string, file: string, text: string): void {
	mkdirSync(dirname(join(root, file)), { recursive: true });
	writeFileSync(join(root, file), text, 'utf8');
}

describe('the ratchet on a planted tree', () => {
	let root: string;
	const FILE = 'packages/common/src/probe.ts';
	const CEILINGS = 'ceilings.json';
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'glossary-keys-'));
		writeSource(root, FILE, 'export function documented(): void {}\nexport function sibling(): void {}\n');
		writeSource(
			root,
			'docs/glossary/common.md',
			`### \`${FILE}::documented\`\n\n\`\`\`ts\n### \`${FILE}::fenced\`\n\`\`\`\n`
		);
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		rmSync(root, { recursive: true, force: true });
	});

	const check = (): Promise<number> => run({ root, ceilings: CEILINGS });
	const ceilings = (): Record<string, number> =>
		JSON.parse(readFileSync(join(root, CEILINGS), 'utf8')) as Record<string, number>;

	it('reads a heading as a key and skips one inside a code fence', () => {
		const result = measure(root);
		expect(result.headings).toBe(1);
		expect(result.valid['ok-bare-unique']).toBe(1);
	});

	it('refuses to run without ceilings', async () => {
		expect(await check()).toBe(1);
	});

	it('is green at the ceilings it created, red on a planted bad key, green once the key is repaired', async () => {
		expect(await run({ root, ceilings: CEILINGS, update: true })).toBe(0);
		expect(ceilings()).toMatchObject({ undocumented: 1, 'no-declaration': 0 });
		expect(await check()).toBe(0);

		const glossary = join(root, 'docs/glossary/common.md');
		const clean = readFileSync(glossary, 'utf8');
		writeFileSync(glossary, `${clean}\n### \`${FILE}::planted\`\n`, 'utf8');
		expect(await check()).toBe(1);
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('no-declaration 1 > ceiling 0'));

		writeFileSync(glossary, clean, 'utf8');
		expect(await check()).toBe(0);
	});

	it('is red on a planted undocumented export and green once it is keyed', async () => {
		await run({ root, ceilings: CEILINGS, update: true });
		const source = join(root, FILE);
		const clean = readFileSync(source, 'utf8');
		writeFileSync(source, `${clean}export function planted(): void {}\n`, 'utf8');
		expect(await check()).toBe(1);
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('undocumented 2 > ceiling 1'));

		const glossary = join(root, 'docs/glossary/common.md');
		writeFileSync(glossary, `${readFileSync(glossary, 'utf8')}\n### \`${FILE}::planted\`\n`, 'utf8');
		expect(await check()).toBe(0);
	});

	it('lowers a ceiling when a count falls, and keeps it when the count rises', async () => {
		await run({ root, ceilings: CEILINGS, update: true });
		const glossary = join(root, 'docs/glossary/common.md');
		writeFileSync(glossary, `${readFileSync(glossary, 'utf8')}\n### \`${FILE}::sibling\`\n`, 'utf8');
		expect(await run({ root, ceilings: CEILINGS, update: true })).toBe(0);
		expect(ceilings().undocumented).toBe(0);

		writeFileSync(
			join(root, FILE),
			'export function documented(): void {}\nexport function sibling(): void {}\nexport function extra(): void {}\n',
			'utf8'
		);
		expect(await run({ root, ceilings: CEILINGS, update: true })).toBe(1);
		expect(ceilings().undocumented).toBe(0);
	});
});

describe('enumeration edge cases', () => {
	it('enumerates the names a destructuring declaration binds', () => {
		expect(paths('export const { a, b: [c, ...d], ...e } = source;', true)).toEqual(['a', 'c', 'd', 'e']);
	});

	it('walks a dotted namespace to its members', () => {
		expect(paths('export namespace A.B { export const missing = 1; const quiet = 2; }', true)).toEqual([
			'A',
			'A::B',
			'A::B::missing'
		]);
		expect(paths('namespace A.B { export const missing = 1; }', true)).toEqual([]);
	});

	it('nests the type literal of a parameter property under it', () => {
		expect(paths('export class C { constructor(public config: { inner: number }) {} }')).toContain('C::config::inner');
	});

	it('keeps a static member and an instance member of one name apart', () => {
		const found = enumerateDeclarations('probe.ts', 'export class C { static f(): void {} f(): void {} }').filter(
			(declaration) => declaration.path.join('::') === 'C::f'
		);
		expect(found.map((declaration) => declaration.isStatic).sort()).toEqual([false, true]);
	});

	it('follows only as const, satisfies and parentheses into a const object', () => {
		expect(paths('export const DATA = { leaf: 1 } as {};')).toEqual(['DATA']);
		expect(paths('export const DATA = { leaf: 1 } as const;')).toEqual(['DATA', 'DATA::leaf']);
		expect(paths('export const DATA = ({ leaf: 1 }) satisfies object;')).toEqual(['DATA', 'DATA::leaf']);
	});
});

describe('the ratchet on edge-case trees', () => {
	let root: string;
	const FILE = 'packages/common/src/probe.ts';
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'glossary-keys-'));
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		rmSync(root, { recursive: true, force: true });
	});

	it('counts a static member undocumented until a key resolves to it, and refuses a key that names both', () => {
		writeSource(
			root,
			FILE,
			'export class Only { static make(): void {} }\nexport class Both { static f(): void {} f(): void {} }\n'
		);
		writeSource(root, 'docs/glossary/common.md', `### \`${FILE}::Only::make\`\n\n### \`${FILE}::Both::f\`\n`);
		const result = measure(root);
		expect(result.counts.ambiguous).toBe(1);
		expect(result.undocumented).toEqual(expect.arrayContaining([`${FILE}::Both::f (static)`, `${FILE}::Both::f`]));
		expect(result.undocumented).not.toContain(`${FILE}::Only::make (static)`);
	});

	it('counts exported declarations and their direct members as undocumented, and not the nested trees below', () => {
		writeSource(
			root,
			FILE,
			'export const TABLE = { alpha: { beta: { gamma: 1 } } };\nexport namespace N { export const inner = 1; }\n'
		);
		writeSource(root, 'docs/glossary/common.md', `### \`${FILE}::TABLE::alpha::beta\`\n`);
		const result = measure(root);
		expect([...result.undocumented].sort()).toEqual([
			`${FILE}::N`,
			`${FILE}::N::inner`,
			`${FILE}::TABLE`,
			`${FILE}::TABLE::alpha`
		]);
		expect(result.valid['ok-owner-qualified']).toBe(1);
	});

	it('does not let a line that merely starts with a fence marker close a fence', () => {
		writeSource(root, FILE, 'export function documented(): void {}\n');
		writeSource(
			root,
			'docs/glossary/common.md',
			['```md', '```ts still code', `### \`${FILE}::inside\``, '```', `### \`${FILE}::planted\``, ''].join('\n')
		);
		const result = measure(root);
		expect(result.keys.map((entry) => entry.key)).toEqual([`${FILE}::planted`]);
	});

	it('refuses a ceiling that is not a non-negative integer, whether checking or updating', async () => {
		writeSource(root, FILE, 'export function documented(): void {}\n');
		writeSource(root, 'ceilings.json', JSON.stringify({ undocumented: 'bad' }));
		expect(await run({ root, ceilings: 'ceilings.json' })).toBe(1);
		expect(await run({ root, ceilings: 'ceilings.json', update: true })).toBe(1);
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('not a non-negative integer: undocumented'));
	});
});
