import { describe, expect, it } from 'vitest';
import type { ir } from '../src/ir.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

type InnerSetter<N> = {
	inner(): readonly { $type: unknown }[];
	inner(...items: unknown[]): N;
	innerAt(gap: string, ...items: unknown[]): N | readonly unknown[];
};
const innerOf = <N extends { $trivia: object }>(node: N): InnerSetter<N> => node.$trivia as unknown as InnerSetter<N>;

describe('$trivia getters, inner and refusals', () => {
	it('reads back what each position was set to, [] where nothing was', () => {
		const a = rs.build.identifier('a').$trivia.leading(rs.build.comment(' lead')).$trivia.trailing(rs.build.comment(' tail'));
		expect(a.$trivia.leading().map((entry) => (typeof entry === 'number' ? entry : entry.$type))).toEqual([rs.kinds.LineComment]);
		expect(a.$trivia.trailing()).toHaveLength(1);
		expect(rs.build.identifier('b').$trivia.leading()).toEqual([]);
	});

	it('holds an inner comment in an empty block and renders it inside the braces', () => {
		const block = innerOf(rs.build.block()).inner(rs.build.comment(' TODO'));
		expect(innerOf(block).inner()).toHaveLength(1);
		expect(block.$render()).toContain('// TODO');
	});

	it('refuses inner on a node that is not empty', () => {
		const block = rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] });
		expect(() => innerOf(block).inner(rs.build.comment(' x'))).toThrow(/not empty; attach to a child with leading\/trailing/);
	});

	it('refuses inner on a kind with no inner gap', () => {
		expect(() => innerOf(rs.build.identifier('a')).inner(rs.build.comment(' x'))).toThrow(/no inner gap/);
	});

	it('refuses a gap the kind does not have', () => {
		expect(() => innerOf(rs.build.block()).innerAt('nope', rs.build.comment(' x'))).toThrow(/no gap 'nope'/);
	});

	it('refuses adding a child to a node that holds inner comments', () => {
		const block = innerOf(rs.build.block()).inner(rs.build.comment(' TODO'));
		expect(() => block.$with.statements([rs.build.expressionStatement(rs.build.identifier('a'))])).toThrow(/leading\/trailing/);
	});

	it('detaches the coordinate of a read node that gains an inner comment', () => {
		const fn = rs.parse('fn f() {}').statements()[0] as unknown as {
			body(): { $trivia: object; $render(): string };
		};
		const body = innerOf(fn.body()).inner(rs.build.comment(' later'));
		expect(body.$render()).toContain('// later');
	});
});

describe('loose trivia strings build ir.comment', () => {
	it('takes the full spelling or the interior alike', () => {
		const spelled = rs.build.identifier('a').$trivia.leading('// hi');
		const interior = rs.build.identifier('a').$trivia.leading(' hi');
		expect(spelled.$trivia.leading()).toMatchObject([{ $type: rs.kinds.LineComment }]);
		expect(JSON.stringify(spelled.$trivia.leading())).toBe(JSON.stringify(interior.$trivia.leading()));
		expect(spelled.$render()).toBe('// hi\na');
	});

	it('refuses whitespace text no whitespace kind spells exactly', () => {
		expect(() => rs.build.identifier('a').$trivia.leading('\n \n')).toThrow(/no whitespace kind is spelled/);
		expect(() => rs.build.identifier('a').$trivia.leading('\n\n\n\n')).toThrow(/no whitespace kind is spelled/);
	});

	it('builds a line comment from its full spelling, not a doubled marker', () => {
		expect(rs.build.lineComment('// TODO').$render()).toBe('// TODO\n');
		expect(rs.build.comment('// TODO').$render()).toBe('// TODO\n');
		expect(rs.build.comment(' TODO').$render()).toBe('// TODO\n');
	});

	it('refuses loose text a sibling arm would read back as, naming that arm', () => {
		const a = (): ReturnType<typeof ir.identifier> => rs.build.identifier('a');
		expect(() => a().$trivia.leading('/ doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(() => a().$trivia.leading('/// doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(() => a().$trivia.leading('//! doc')).toThrow(/ir\.lineCommentDocInner/);
		expect(() => a().$trivia.leading('//// x')).toThrow(/ir\.lineCommentExtraSlashes/);
		expect(() => rs.build.lineComment('/ doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(a().$trivia.leading('//x').$render()).toBe('//x\na');
	});

	it('refuses a node entry whose kind is not trivia', () => {
		expect(() => rs.build.identifier('a').$trivia.leading(rs.build.identifier('b') as never)).toThrow(/identifier is not an extra/);
		expect(rs.build.identifier('a').$trivia.leading(rs.build.blockComment(' b ')).$render()).toBe('/* b */\na');
	});

	it('takes an eligible whitespace kind, built or spelled exactly, as its kind id', () => {
		const built = rs.build.identifier('a').$trivia.leading(rs.build.whitespace.blankline);
		const spelled = rs.build.identifier('a').$trivia.leading('\n\n');
		expect(built.$trivia.leading()).toEqual([rs.kinds.Blankline]);
		expect(spelled.$trivia.leading()).toEqual([rs.kinds.Blankline]);
	});

	it('refuses whitespace kinds the extras do not match, for the one reason that they are not extras', () => {
		const a = (): ReturnType<typeof ir.identifier> => rs.build.identifier('a');
		// @ts-expect-error tight is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(rs.build.whitespace.tight)).toThrow(/_tight is not an extra/);
		// @ts-expect-error indent is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(rs.build.whitespace.indent)).toThrow(/_indent is not an extra/);
		// @ts-expect-error dedent is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(rs.build.whitespace.dedent)).toThrow(/_dedent is not an extra/);
	});

	it('renders a whitespace entry in place of the spacing of the gap it sits in', () => {
		const stmt = (name: string): ReturnType<typeof ir.expressionStatement> =>
			rs.build.expressionStatement(rs.build.identifier(name));
		expect(rs.build.block({ statements: [stmt('a'), stmt('b')] }).$render()).toBe('{\n    a;\n    b;\n}');
		const spaced = rs.build.block({ statements: [stmt('a'), stmt('b').$trivia.leading(rs.build.whitespace.blankline)] });
		expect(spaced.$render()).toBe('{\n    a;\n\n    b;\n}');
		const joined = rs.build.block({ statements: [stmt('a'), stmt('b').$trivia.leading(rs.build.whitespace.space)] });
		expect(joined.$render()).toBe('{\n    a; b;\n}');
		const afterComment = rs.build.block({ statements: [stmt('a'), stmt('b').$trivia.leading('// c', rs.build.whitespace.blankline)] });
		expect(afterComment.$render()).toBe('{\n    a;\n    // c\n\n    b;\n}');
		const keepsBreak = rs.build.block({ statements: [stmt('a'), stmt('b').$trivia.leading('// c', rs.build.whitespace.space)] });
		expect(keepsBreak.$render()).toBe('{\n    a;\n    // c\n    b;\n}');
		expect(innerOf(rs.build.block()).inner(rs.build.whitespace.blankline).$render()).toBe('{\n\n}');
	});
});
