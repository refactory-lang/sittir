import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { constructions } from './side-nesting.mts';

const native = createRequire(import.meta.url)('../native/index.cjs') as { readonly SIDE_NESTING_BOUND: number; readonly SIDE_NESTING_REFUSAL: string; readonly SIDE_CYCLE_REFUSAL: string };

type Sided = { readonly $trivia: { leading(...items: unknown[]): readonly unknown[]; trailing(...items: unknown[]): readonly unknown[] } };
type Item = { body(): { statements(): readonly Sided[] } };

const commentJSON = (text: string) => ({ $type: 'block_comment', content: { $type: 'block_comment_regular', $text: text } });

describe.each(constructions)("a built comment in a parsed node's side is held by reference (%s)", (_, rs) => {
	const b = rs.build;
	const comment = (text: string) => b.blockComment(b.blockCommentRegular(` ${text} `)) as unknown as Sided;
	const rendered = (node: unknown) => rs.render(node as never).toString();
	const parsedG = () => {
		const root = rs.parse('fn f() {\n    g();\n}\n');
		return { root, g: (root.statements()[0] as unknown as Item).body().statements()[0]! };
	};
	const placed = () => {
		const { root, g } = parsedG();
		const c = comment('c');
		g.$trivia.trailing(c);
		c.$trivia.leading(comment('later'));
		return { root, g, c };
	};
	const withLater = 'fn f() {\n    g(); /* later */ /* c */\n}\n';

	it('renders a side written on the comment after it was placed, and reads back as itself', () => {
		const { root, g, c } = placed();
		expect(rendered(root)).toBe(withLater);
		expect(g.$trivia.trailing()[0]).toBe(c);
	});

	it('snapshots and serialises the comment as it is when they are taken', () => {
		const { root } = placed();
		expect(rendered(root.$snapshot())).toBe(withLater);
		expect(JSON.stringify(root)).toContain(JSON.stringify([{ ...commentJSON(' c '), leadingComments: [commentJSON(' later ')] }]));
	});

	it('renders as a comment written on before it was placed does', () => {
		const { root, g } = parsedG();
		const c = comment('c');
		c.$trivia.leading(comment('later'));
		g.$trivia.trailing(c);
		expect(rendered(root)).toBe(withLater);
	});

	const chain = (length: number): Sided => {
		const comments = Array.from({ length }, (_, at) => comment(String(at)));
		for (let at = 0; at + 1 < length; at += 1) comments[at]!.$trivia.leading(comments[at + 1]);
		return comments[0]!;
	};
	const parsedP = () => {
		const root = rs.parse('fn f() {\n    /* p */\n    g();\n}\n');
		const g = (root.statements()[0] as unknown as Item).body().statements()[0]!;
		return { root, p: g.$trivia.leading().find((entry) => typeof entry === 'object') as Sided & { $snapshot(): unknown } };
	};

	it('refuses a render by the bound, then renders and snapshots another tree that holds a side clean', () => {
		const refused = parsedG();
		refused.g.$trivia.trailing(chain(native.SIDE_NESTING_BOUND + 1));
		expect(() => rendered(refused.root)).toThrow(native.SIDE_NESTING_REFUSAL);
		const { root } = placed();
		expect(rendered(root)).toBe(withLater);
		expect(rendered(root.$snapshot())).toBe(withLater);
		refused.g.$trivia.trailing(comment('c'));
		expect(rendered(refused.root)).toBe('fn f() {\n    g(); /* c */\n}\n');
	});

	it('refuses a ring through a held side by the bound, at the render and the snapshot, and renders on', () => {
		const { root, p } = parsedP();
		const ring = comment('b');
		p.$trivia.leading(ring);
		ring.$trivia.leading(p);
		expect(() => rendered(root)).toThrow(native.SIDE_CYCLE_REFUSAL);
		expect(() => p.$snapshot()).toThrow(native.SIDE_NESTING_REFUSAL);
		expect(rendered(parsedG().root)).toBe('fn f() {\n    g();\n}\n');
	});

	const ring = (length: number): Sided => {
		const comments = Array.from({ length }, (_, at) => comment(String(at)));
		for (let at = 0; at < length; at += 1) comments[at]!.$trivia.leading(comments[(at + 1) % length]);
		return comments[0]!;
	};

	it('refuses a built ring held in a parsed side as a cycle, and one longer than the bound by the bound', () => {
		const short = parsedP();
		short.p.$trivia.leading(ring(2));
		expect(() => rendered(short.root)).toThrow(native.SIDE_CYCLE_REFUSAL);
		const long = parsedP();
		long.p.$trivia.leading(ring(native.SIDE_NESTING_BOUND + 1));
		expect(() => rendered(long.root)).toThrow(native.SIDE_NESTING_REFUSAL);
		expect(() => long.p.$snapshot()).toThrow(native.SIDE_NESTING_REFUSAL);
		expect(rendered(parsedG().root)).toBe('fn f() {\n    g();\n}\n');
	});

	it('renders and snapshots a held side that holds one comment twice', () => {
		const { root, p } = parsedP();
		const twice = comment('t');
		twice.$trivia.leading(comment('later'));
		p.$trivia.leading(twice, twice);
		const expected = 'fn f() {\n    /* later */ /* t */ /* later */ /* t */ /* p */\n    g();\n}\n';
		expect(rendered(root)).toBe(expected);
		expect(rendered(root.$snapshot())).toBe(expected);
	});

	it("gives the id a call's projection gives a held entry to no snapshot, JSON or side read", () => {
		const { root, p } = parsedP();
		const c = comment('c');
		c.$trivia.leading(comment('later'));
		p.$trivia.leading(c);
		expect(rendered(root)).toBe('fn f() {\n    /* later */ /* c */ /* p */\n    g();\n}\n');
		for (const held of [root.$snapshot(), JSON.parse(JSON.stringify(root)), p.$trivia.leading()]) expect(JSON.stringify(held)).not.toContain('"entry"');
	});

	it.each([
		['held', () => [comment('b')], '/* b */ /* p */'],
		['written natively', () => (rs.parse('/* q */\nfn x() {}\n').statements()[0] as unknown as Sided).$trivia.leading(), '/* q */\n    /* p */']
	] as const)("snapshots a placed comment's own side, %s, as it renders", (_, entries, sided) => {
		const { root, p } = parsedP();
		p.$trivia.leading(...entries());
		const expected = `fn f() {\n    ${sided}\n    g();\n}\n`;
		expect(rendered(root)).toBe(expected);
		const json = JSON.stringify(root.$snapshot());
		expect(json).not.toContain('$treeHandle');
		expect(rendered(JSON.parse(json))).toBe(expected);
	});

	it('snapshots a held comment that holds a parsed one as data that names no tree', () => {
		const { root, g } = parsedG();
		const { p } = parsedP();
		const c = comment('c');
		c.$trivia.leading(p);
		g.$trivia.trailing(c);
		const expected = 'fn f() {\n    g(); /* p */ /* c */\n}\n';
		expect(rendered(root)).toBe(expected);
		const json = JSON.stringify(root.$snapshot());
		expect(json).not.toContain('$treeHandle');
		expect(rendered(JSON.parse(json))).toBe(expected);
	});
});

describe('a tree that holds a side is released as a tree that holds none is', () => {
	it('frees the tree once nothing names it, and a render of another tree in the same addon runs before and after the release', () => {
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/held-side-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({
			before: 'fn r() {} /* r */\n',
			raced: 'fn r() {} /* r */\n',
			after: 'fn r() {} /* r */\n',
			released: true
		});
	}, 60_000);
});
