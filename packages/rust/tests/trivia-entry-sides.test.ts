import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { useRecordConstruction } from '@sittir/common/engine';
import { treeOf } from '@sittir/common/utils';
import arena from '../src/arena.ts';
import { constructions, nestedComments, objects, records, type Engine, type Reported, type Route } from './side-nesting.mts';

type Side = 'leading' | 'trailing';
type Sided = { readonly $trivia: { leading(...items: never[]): unknown; trailing(...items: never[]): unknown } };

const withSide = <N extends Sided>(node: N, side: Side, entries: readonly unknown[]): N => {
	if (entries.length === 0) return node;
	if (side === 'leading') node.$trivia.leading(...(entries as never[]));
	else node.$trivia.trailing(...(entries as never[]));
	return node;
};

function helpers(rs: Engine) {
	const b = rs.build;
	const comment = () => b.blockComment(b.blockCommentRegular(' c '));
	const statement = (name: string) => b.expressionStatement(b.identifier(name));
	const sided = (before: readonly unknown[], after: readonly unknown[]) => withSide(withSide(comment(), 'leading', before), 'trailing', after);
	const rendered = (held: unknown) => b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body: b.block({ statements: [statement('a'), held as never, statement('z')] }) }).$render();
	return { L: b.layout, comment, statement, sided, rendered };
}

type Layout = ReturnType<typeof helpers>['L'];
const shapes: readonly [string, Side, (L: Layout) => readonly unknown[], (L: Layout) => readonly unknown[]][] = [
	['leading: space | comment | space', 'leading', (L) => [L.space], (L) => [L.space]],
	['leading: newline | comment | newline', 'leading', (L) => [L.newline], (L) => [L.newline]],
	['leading: comment | space', 'leading', () => [], (L) => [L.space]],
	['leading: space | comment', 'leading', (L) => [L.space], () => []],
	['leading: blankline | comment | tight', 'leading', (L) => [L.blankline], (L) => [L.tight]],
	['trailing: space | comment | space', 'trailing', (L) => [L.space], (L) => [L.space]],
	['trailing: newline | comment', 'trailing', (L) => [L.newline], () => []],
	['trailing: comment | newline', 'trailing', () => [], (L) => [L.newline]]
];

const nestedOf = (rs: Engine, side: Side, before: (L: Layout) => readonly unknown[], after: (L: Layout) => readonly unknown[]) => {
	const { L, statement, sided, rendered } = helpers(rs);
	return rendered(withSide(statement('x'), side, [sided(before(L), after(L))]));
};

describe.each(constructions)("an entry's own sides are its neighbours in the side that holds it (%s)", (_, rs) => {
	const { L, comment, statement, sided, rendered } = helpers(rs);

	it.each(shapes)('%s', (_, side, before, after) => {
		const flat = withSide(statement('x'), side, [...before(L), comment(), ...after(L)]);
		expect(nestedOf(rs, side, before, after)).toBe(rendered(flat));
	});

	it('leaves nothing on the line a trailing comment breaks from when its own leading side is the break', () => {
		expect(rendered(withSide(statement('x'), 'trailing', [sided([L.newline], [])]))).toBe('fn f() {\n    a;\n    x;\n    /* c */\n    z;\n}');
	});

	it("takes a parsed comment's own sides as its neighbours too, where it stays its coordinate", () => {
		const source = 'fn f() {\n    x; /* c */\n    z;\n}\n';
		const trailingOf = () => {
			const root = rs.parse(source);
			const item = root.statements()[0];
			if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function');
			const x = item.body().statements()[0] as unknown as Sided;
			const [held] = (x.$trivia as unknown as { trailing(): readonly Sided[] }).trailing();
			if (held === undefined) throw new Error('expected a trailing comment');
			return { root, x, held };
		};
		const nested = trailingOf();
		withSide(nested.held, 'leading', [L.newline]);
		const flat = trailingOf();
		withSide(flat.x, 'trailing', [L.newline, flat.held]);
		expect(nested.root.$render()).toBe(flat.root.$render());
		expect(nested.root.$render()).toBe('fn f() {\n    x;\n    /* c */\n    z;\n}\n');
	});
});

describe('a built record entry takes its own sides from the store that holds it', () => {
	it("renders a parsed holder's record with its tree's engine's sides when another engine renders the holder", async () => {
		const other = (await arena.createEngine()) as Engine;
		useRecordConstruction(other, await import('../src/factories/records.ts'));
		const { L, comment, sided } = helpers(records);
		const statementOf = () => {
			const item = records.parse('fn f() {\n    x;\n}\n').statements()[0];
			if (item === undefined || !records.is.functionItem(item)) throw new Error('expected a function');
			return item.body().statements()[0] as unknown as Sided;
		};
		const heldBy = (x: Sided) => other.build.functionItem({ name: other.build.identifier('g'), parameters: other.build.parameters(), body: other.build.block({ statements: [x as never] }) }).$render();
		const nested = withSide(statementOf(), 'trailing', [sided([L.newline], [])]);
		const flat = withSide(statementOf(), 'trailing', [L.newline, comment()]);
		expect(heldBy(nested)).toBe(heldBy(flat));
		expect(heldBy(nested)).toBe('fn g() {\n    x;\n    /* c */\n}');
	});

});

describe('a node that a side reaches from its own sides', () => {
	type Rendered = Sided & { $render(): string };
	const refusalOf = (label: string) => (label === 'records' ? /a side that reaches its own record/ : /a side that reaches its own node/);

	it.each(constructions)('refuses at the render, by name, and the engine renders on after it (%s)', (label, rs) => {
		const { comment, statement, rendered } = helpers(rs);
		const refusal = refusalOf(label);
		const held = (entry: unknown) => rendered(withSide(statement('x'), 'trailing', [entry]));
		const own = comment() as unknown as Rendered;
		withSide(own, 'leading', [own]);
		expect(() => own.$render()).toThrow(refusal);
		expect(() => held(own)).toThrow(refusal);
		const [a, b] = [comment(), comment()] as unknown as Rendered[];
		withSide(a!, 'leading', [b]);
		withSide(b!, 'trailing', [a]);
		expect(() => held(a)).toThrow(refusal);
		const content = rs.build.blockCommentRegular(' k ') as unknown as Sided;
		const holder = rs.build.blockComment(content as never);
		withSide(content, 'leading', [holder]);
		expect(() => (holder as unknown as Rendered).$render()).toThrow(refusal);
		expect(() => held(holder)).toThrow(refusal);
		expect((statement('y') as unknown as Rendered).$render()).toBe('y;');
	});

	it.each(constructions)("refuses the comment's snapshot once a parsed comment's side holds it, and renders on after it (%s)", (_, rs) => {
		const content = rs.build.blockCommentRegular(' k ') as unknown as Sided;
		const holder = rs.build.blockComment(content as never);
		withSide(content, 'leading', [holder]);
		const parsed = parsedComment(rs);
		expect(() => {
			withSide(parsed, 'leading', [holder]);
			parsed.$snapshot();
		}).toThrow(/a side that reaches its own node/);
		expect((rs.build.expressionStatement(rs.build.identifier('y')) as unknown as Rendered).$render()).toBe('y;');
	});
});

type Parsed = { statements(): unknown[] };
type ParsedSided = Sided & { $snapshot(): unknown };

const parsedComment = (rs: Engine) => {
	const root = rs.parse('fn f() {\n    x; /* parsed */\n}\n') as unknown as Parsed;
	const item = root.statements()[0] as { body(): Parsed };
	const x = item.body().statements()[0] as unknown as Sided;
	const [parsed] = (x.$trivia as unknown as { trailing(): ParsedSided[] }).trailing();
	if (parsed === undefined) throw new Error('expected a trailing comment');
	return parsed;
};

const brokenComment = (rs: Engine) => {
	const b = rs.build;
	const content = b.blockCommentRegular(' c ') as unknown as Sided;
	withSide(content, 'leading', [b.layout.newline]);
	return b.blockComment(content as never);
};

const inBody = (rs: Engine, held: unknown) => {
	const b = rs.build;
	return b.functionItem({ name: b.identifier('g'), parameters: b.parameters(), body: b.block({ statements: [held as never] }) }) as unknown as { $render(options?: unknown): string };
};

const entryCases: readonly [string, (rs: Engine) => string, string][] = [
	[
		"a built comment in a parsed comment's side, the parsed comment written into a built statement's side",
		(rs) => {
			const b = rs.build;
			const parsed = parsedComment(rs);
			withSide(parsed, 'leading', [b.blockComment(b.blockCommentRegular(' nested '))]);
			const y = b.expressionStatement(b.identifier('y')) as unknown as Sided & { $render(): string };
			withSide(y, 'trailing', [parsed]);
			return y.$render();
		},
		'y; /* nested */ /* parsed */'
	],
	[
		"a comment's content given a side after the comment was written into a side",
		(rs) => {
			const b = rs.build;
			const content = b.blockCommentRegular(' c ') as unknown as Sided;
			const z = b.expressionStatement(b.identifier('z')) as unknown as Sided & { $render(): string };
			withSide(z, 'trailing', [b.blockComment(content as never)]);
			withSide(content, 'leading', [b.layout.newline]);
			return z.$render();
		},
		'z; /*\n c */'
	],
	[
		"a comment whose content's side breaks the line, written into a nested statement's side",
		(rs) => {
			const z = rs.build.expressionStatement(rs.build.identifier('z')) as unknown as Sided;
			withSide(z, 'trailing', [brokenComment(rs)]);
			return inBody(rs, z).$render();
		},
		'fn g() {\n    z; /*\n     c */\n}'
	],
	[
		'the same comment rendered under per-call options',
		(rs) => {
			const z = rs.build.expressionStatement(rs.build.identifier('z')) as unknown as Sided;
			withSide(z, 'trailing', [brokenComment(rs)]);
			return rs.render(inBody(rs, z) as never, { layout: { indent: '\t' } } as never).toString();
		},
		'fn g() {\n\tz; /*\n\t c */\n}'
	],
	[
		"a parsed comment holding that comment, written into an indented holder's side, which takes it as its snapshot",
		(rs) => {
			const parsed = parsedComment(rs);
			withSide(parsed, 'leading', [brokenComment(rs)]);
			const z = rs.build.expressionStatement(rs.build.identifier('z')) as unknown as Sided;
			withSide(z, 'trailing', [parsed]);
			return inBody(rs, z).$render();
		},
		'fn g() {\n    z; /*\n     c */ /* parsed */\n}'
	]
];

describe('a record in a side renders as objects render it', () => {
	it.each(entryCases)('%s', (_, render, expected) => {
		expect(render(objects)).toBe(expected);
		for (const [, rs] of constructions) expect(render(rs)).toBe(expected);
	});
});

describe('every construction renders each shape as objects do', () => {
	it.each(shapes)('%s', (_, side, before, after) => {
		const expected = nestedOf(objects, side, before, after);
		for (const [, rs] of constructions) expect(nestedOf(rs, side, before, after)).toBe(expected);
	});

	const leafRoot = (rs: Engine) => {
		const b = rs.build;
		const x = withSide(withSide(b.identifier('x') as unknown as Sided, 'leading', [b.lineComment(' before')]), 'trailing', [b.blockComment(b.blockCommentRegular(' after '))]);
		return (x as unknown as { $render(): string }).$render();
	};

	it.each(constructions)('renders a built leaf root with the sides written on it (%s)', (_, rs) => {
		expect(leafRoot(rs)).toBe(leafRoot(objects));
		expect(leafRoot(rs)).toBe('// before\nx /* after */');
	});
});

describe('a built comment whose content another tree parsed', () => {
	type Parsed = { statements(): unknown[] } & { $render(): string };
	const holderOf = (rs: Engine) => {
		const root = rs.parse('fn h() {\n    y;\n}\n') as unknown as Parsed;
		const item = root.statements()[0] as { body(): { statements(): unknown[] }; $render(): string };
		const y = item.body().statements()[0] as unknown as Sided & { $render(): string };
		return { root, item, y };
	};
	const docContent = (rs: Engine) => {
		const root = rs.parse('fn f() {\n    x; /** doc */\n}\n') as unknown as Parsed;
		const x = (root.statements()[0] as { body(): { statements(): unknown[] } }).body().statements()[0] as unknown as Sided;
		const [doc] = (x.$trivia as unknown as { trailing(): { content(): unknown }[] }).trailing();
		if (doc === undefined) throw new Error('expected a doc comment');
		return doc.content();
	};

	it.each(constructions)("renders in the holder's tree, its statement and its function, as objects render it (%s)", (_, rs) => {
		const { root, item, y } = holderOf(rs);
		withSide(y, 'trailing', [rs.build.blockComment(docContent(rs) as never)]);
		expect(root.$render()).toBe('fn h() {\n    y; /** doc */\n}\n');
		expect(item.$render()).toBe('fn h() {\n    y; /** doc */\n}');
		expect(y.$render()).toBe('y; /** doc */');
	});

	it.each(constructions.filter(([label]) => label !== 'objects'))("renders as the holder tree's record and its candidate (%s)", (_, rs) => {
		const { root, y } = holderOf(rs);
		withSide(y, 'trailing', [rs.build.blockComment(docContent(rs) as never)]);
		const table = treeOf(root as object)?.records;
		if (table === undefined) throw new Error('an arena tree reads records');
		const at = table.hydrate(0, Infinity);
		expect(table.render(at!, false, false)).toBe('fn h() {\n    y; /** doc */\n}\n');
		expect(table.renderCandidate(0)).toBe('fn h() {\n    y; /** doc */\n}\n');
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

	describe.each(routes)('a chain of comments, each in %s', (route) => {
		it('renders at the bound as objects render it, and refuses one past it with the addon\'s refusal, on every storage', () => {
			const expected = nestedComments(objects, route, bound, false);
			expect(expected.split('/*').length - 1).toBe(bound);
			for (const [, rs] of constructions) {
				expect(nestedComments(rs, route, bound, false)).toBe(expected);
				expect(() => nestedComments(rs, route, bound + 1, false)).toThrow(native.SIDE_NESTING_REFUSAL);
			}
		});

		it('refuses a ring at the bound and one past it with the same refusal, on every storage', () => {
			for (const [, rs] of constructions) {
				for (const length of [bound, bound + 1]) expect(() => nestedComments(rs, route, length, true)).toThrow(native.SIDE_NESTING_REFUSAL);
			}
		});

		it('refuses a ring of 12,000 by the bound in a process that runs on after it, on every storage', () => {
			for (const [label] of constructions) {
				const out = execFileSync(process.execPath, ['--import', 'tsx', helper, label, route, '12000', 'ring'], {
					cwd: fileURLToPath(new URL('..', import.meta.url)),
					encoding: 'utf8',
					env: { ...process.env, SITTIR_BACKEND: 'native' }
				});
				const reported = JSON.parse(out.trim().split('\n').at(-1) ?? '') as Reported;
				expect('refusal' in reported && reported.refusal).toContain(native.SIDE_NESTING_REFUSAL);
			}
		}, 120_000);

		it('renders at the bound in a Worker as it renders here, on every storage', async () => {
			for (const [label, rs] of constructions) {
				const reported = await new Promise<Reported>((resolve, reject) => {
					const worker = new Worker(helper, { workerData: { sideNesting: [label, route, bound, 'chain'] }, execArgv: ['--import', 'tsx'], env: { ...process.env, SITTIR_BACKEND: 'native' } });
					worker.once('message', resolve);
					worker.once('error', reject);
					worker.once('exit', (code) => reject(new Error(`the Worker exited with ${code} before it reported`)));
				});
				expect(reported).toEqual({ text: nestedComments(rs, route, bound, false) });
			}
		}, 120_000);
	});
});
