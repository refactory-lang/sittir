import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { nestedComments, objects as rs, type Reported, type Route } from './side-nesting.mts';

const b = rs.build;
const L = b.layout;

type Side = 'leading' | 'trailing';
type Sided = { readonly $trivia: { leading(...items: never[]): unknown; trailing(...items: never[]): unknown } };

const comment = () => b.blockComment(b.blockCommentRegular(' c '));
const statement = (name: string) => b.expressionStatement(b.identifier(name));
const withSide = <N extends Sided>(node: N, side: Side, entries: readonly unknown[]): N => {
	if (entries.length === 0) return node;
	if (side === 'leading') node.$trivia.leading(...(entries as never[]));
	else node.$trivia.trailing(...(entries as never[]));
	return node;
};
const sided = (before: readonly unknown[], after: readonly unknown[]) => withSide(withSide(comment(), 'leading', before), 'trailing', after);
const rendered = (held: unknown) => b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body: b.block({ statements: [statement('a'), held as never, statement('z')] }) }).$render();

const shapes: readonly [string, Side, readonly unknown[], readonly unknown[]][] = [
	['leading: space | comment | space', 'leading', [L.space], [L.space]],
	['leading: newline | comment | newline', 'leading', [L.newline], [L.newline]],
	['leading: comment | space', 'leading', [], [L.space]],
	['leading: space | comment', 'leading', [L.space], []],
	['leading: blankline | comment | tight', 'leading', [L.blankline], [L.tight]],
	['trailing: space | comment | space', 'trailing', [L.space], [L.space]],
	['trailing: newline | comment', 'trailing', [L.newline], []],
	['trailing: comment | newline', 'trailing', [], [L.newline]]
];

describe("an entry's own sides are its neighbours in the side that holds it", () => {
	it.each(shapes)('%s', (_, side, before, after) => {
		const nested = withSide(statement('x'), side, [sided(before, after)]);
		const flat = withSide(statement('x'), side, [...before, comment(), ...after]);
		expect(rendered(nested)).toBe(rendered(flat));
	});

	it('leaves nothing on the line a trailing comment breaks from when its own leading side is the break', () => {
		expect(rendered(withSide(statement('x'), 'trailing', [sided([L.newline], [])]))).toBe('fn f() {\n    a;\n    x;\n    /* c */\n    z;\n}');
	});

	it('takes a parsed comment\'s own sides as its neighbours too, where it stays its coordinate', () => {
		const source = 'fn f() {\n    x; /* c */\n    z;\n}\n';
		const trailingOf = () => {
			const root = rs.parse(source);
			const item = root.statements()[0];
			if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function');
			const x = item.body().statements()[0] as unknown as Sided;
			const [comment] = (x.$trivia as unknown as { trailing(): readonly Sided[] }).trailing();
			if (comment === undefined) throw new Error('expected a trailing comment');
			return { root, x, comment };
		};
		const nested = trailingOf();
		withSide(nested.comment, 'leading', [L.newline]);
		const flat = trailingOf();
		withSide(flat.x, 'trailing', [L.newline, flat.comment]);
		expect(nested.root.$render()).toBe(flat.root.$render());
		expect(nested.root.$render()).toBe('fn f() {\n    x;\n    /* c */\n    z;\n}\n');
	});
});

type Rendered = Sided & { $render(): string };
type ParsedSided = Sided & { $snapshot(): unknown; $render(): string };

const parsedComment = () => {
	const root = rs.parse('fn f() {\n    x; /* parsed */\n}\n');
	const item = root.statements()[0];
	if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function');
	const x = item.body().statements()[0] as unknown as Sided;
	const [parsed] = (x.$trivia as unknown as { trailing(): ParsedSided[] }).trailing();
	if (parsed === undefined) throw new Error('expected a trailing comment');
	return { root, parsed };
};

describe('a node that a side reaches from its own sides', () => {
	const refusal = /a side that reaches its own node/;

	it('refuses at the render, by name, and the engine renders on after it', () => {
		const held = (entry: unknown) => rendered(withSide(statement('x'), 'trailing', [entry]));
		const own = comment() as unknown as Rendered;
		withSide(own, 'leading', [own]);
		expect(() => own.$render()).toThrow(refusal);
		expect(() => held(own)).toThrow(refusal);
		const [first, second] = [comment(), comment()] as unknown as Rendered[];
		withSide(first!, 'leading', [second]);
		withSide(second!, 'trailing', [first]);
		expect(() => held(first)).toThrow(refusal);
		const content = b.blockCommentRegular(' k ') as unknown as Sided;
		const holder = b.blockComment(content as never);
		withSide(content, 'leading', [holder]);
		expect(() => (holder as unknown as Rendered).$render()).toThrow(refusal);
		expect(() => held(holder)).toThrow(refusal);
		expect((statement('y') as unknown as Rendered).$render()).toBe('y;');
	});

	it("refuses the comment's snapshot once a parsed comment's side holds it, and renders on after it", () => {
		const content = b.blockCommentRegular(' k ') as unknown as Sided;
		const holder = b.blockComment(content as never);
		withSide(content, 'leading', [holder]);
		const { parsed } = parsedComment();
		expect(() => {
			withSide(parsed, 'leading', [holder]);
			parsed.$snapshot();
		}).toThrow(refusal);
		expect((statement('y') as unknown as Rendered).$render()).toBe('y;');
	});
});

describe("a side nests at most as deep as the addon's bound", () => {
	const native = createRequire(import.meta.url)('../native/index.cjs') as { readonly SIDE_NESTING_BOUND: number; readonly SIDE_NESTING_REFUSAL: string };
	const bound = native.SIDE_NESTING_BOUND;
	const helper = fileURLToPath(new URL('./side-nesting.mts', import.meta.url));
	const routes: readonly [Route, string][] = [
		['own', 'its own leading side'],
		['content', "its content's leading side"]
	];

	it('is one bound with one refusal, which names it', () => {
		expect(bound).toBe(64);
		expect(native.SIDE_NESTING_REFUSAL).toBe(`sides nest more than ${bound} deep, the stack-safety bound on side nesting`);
	});

	it('renders a chain of comments, each in its own leading side, each before the one that holds it', () => {
		expect(nestedComments(rs, 'own', 3, false)).toBe('x; /* 2 */ /* 1 */ /* 0 */');
	});

	it("renders a chain of comments, each in its content's leading side, each inside the one that holds it", () => {
		expect(nestedComments(rs, 'content', 3, false)).toBe('x; /* /* /* 2 */  1 */  0 */');
	});

	describe.each(routes)('a chain of comments, each in %s', (route) => {
		it("renders at the bound, and refuses one past it with the addon's refusal", () => {
			expect(nestedComments(rs, route, bound, false).split('/*').length - 1).toBe(bound);
			expect(() => nestedComments(rs, route, bound + 1, false)).toThrow(native.SIDE_NESTING_REFUSAL);
		});

		it('refuses a ring shorter than the bound as a cycle, and a ring at the bound and one past it by the bound', () => {
			expect(() => nestedComments(rs, route, 2, true)).toThrow(/a side that reaches its own node/);
			for (const length of [bound, bound + 1]) expect(() => nestedComments(rs, route, length, true)).toThrow(native.SIDE_NESTING_REFUSAL);
		});

		it('refuses a ring of 12,000 by the bound in a process that runs on after it', () => {
			const out = execFileSync(process.execPath, ['--import', 'tsx', helper, 'objects', route, '12000', 'ring'], {
				cwd: fileURLToPath(new URL('..', import.meta.url)),
				encoding: 'utf8',
				env: { ...process.env, SITTIR_BACKEND: 'native' }
			});
			const reported = JSON.parse(out.trim().split('\n').at(-1) ?? '') as Reported;
			expect('refusal' in reported && reported.refusal).toContain(native.SIDE_NESTING_REFUSAL);
		}, 120_000);

		it('renders at the bound in a Worker as it renders here', async () => {
			const reported = await new Promise<Reported>((resolve, reject) => {
				const worker = new Worker(helper, { workerData: { sideNesting: ['objects', route, bound, 'chain'] }, execArgv: ['--import', 'tsx'], env: { ...process.env, SITTIR_BACKEND: 'native' } });
				worker.once('message', resolve);
				worker.once('error', reject);
				worker.once('exit', (code) => reject(new Error(`the Worker exited with ${code} before it reported`)));
			});
			expect(reported).toEqual({ text: nestedComments(rs, route, bound, false) });
		}, 120_000);
	});

	it("counts a chain written into a parsed comment's side from the side the comment sits in", () => {
		const chain = (length: number) => {
			const comments = Array.from({ length }, (_, at) => b.blockComment(b.blockCommentRegular(` ${at} `)) as unknown as Sided);
			for (let at = 0; at + 1 < length; at += 1) comments[at]!.$trivia.leading(comments[at + 1] as never);
			return comments[0]!;
		};
		const written = (length: number) => {
			const { root, parsed } = parsedComment();
			withSide(parsed, 'leading', [chain(length)]);
			return root;
		};
		expect(written(bound - 1).$render().split('/*').length - 1).toBe(bound);
		const past = written(bound);
		expect(() => past.$render()).toThrow(native.SIDE_NESTING_REFUSAL);
		expect(() => written(bound + 1)).toThrow(native.SIDE_NESTING_REFUSAL);
	});
});
