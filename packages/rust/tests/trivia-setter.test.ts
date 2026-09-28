import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';
import { TSKindId } from '../src/types.ts';
import { createEngine } from '../src/engine.ts';

type InnerSetter<N> = {
	inner(): readonly { $type: unknown }[];
	inner(...items: unknown[]): N;
	innerAt(gap: string, ...items: unknown[]): N | readonly unknown[];
};
const innerOf = <N extends { $trivia: object }>(node: N): InnerSetter<N> => node.$trivia as unknown as InnerSetter<N>;

describe('$trivia getters, inner and refusals', () => {
	it('reads back what each position was set to, [] where nothing was', () => {
		const a = ir.identifier('a').$trivia.leading(ir.comment(' lead')).$trivia.trailing(ir.comment(' tail'));
		expect(a.$trivia.leading().map((entry) => (typeof entry === 'number' ? entry : entry.$type))).toEqual([TSKindId.LineComment]);
		expect(a.$trivia.trailing()).toHaveLength(1);
		expect(ir.identifier('b').$trivia.leading()).toEqual([]);
	});

	it('holds an inner comment in an empty block and renders it inside the braces', () => {
		const block = innerOf(ir.block()).inner(ir.comment(' TODO'));
		expect(innerOf(block).inner()).toHaveLength(1);
		expect(block.$render()).toContain('// TODO');
	});

	it('refuses inner on a node that is not empty', () => {
		const block = ir.block({ statements: [ir.expressionStatement(ir.identifier('a'))] });
		expect(() => innerOf(block).inner(ir.comment(' x'))).toThrow(/not empty; attach to a child with leading\/trailing/);
	});

	it('refuses inner on a kind with no inner gap', () => {
		expect(() => innerOf(ir.identifier('a')).inner(ir.comment(' x'))).toThrow(/no inner gap/);
	});

	it('refuses a gap the kind does not have', () => {
		expect(() => innerOf(ir.block()).innerAt('nope', ir.comment(' x'))).toThrow(/no gap 'nope'/);
	});

	it('refuses adding a child to a node that holds inner comments', () => {
		const block = innerOf(ir.block()).inner(ir.comment(' TODO'));
		expect(() => block.$with.statements([ir.expressionStatement(ir.identifier('a'))])).toThrow(/leading\/trailing/);
	});

	it('detaches the coordinate of a read node that gains an inner comment', () => {
		const fn = createEngine().parse('fn f() {}').statements()[0] as unknown as {
			body(): { $trivia: object; $render(): string };
		};
		const body = innerOf(fn.body()).inner(ir.comment(' later'));
		expect(body.$render()).toContain('// later');
	});
});

describe('loose trivia strings build ir.comment', () => {
	it('takes the full spelling or the interior alike', () => {
		const spelled = ir.identifier('a').$trivia.leading('// hi');
		const interior = ir.identifier('a').$trivia.leading(' hi');
		expect(spelled.$trivia.leading()).toMatchObject([{ $type: TSKindId.LineComment }]);
		expect(JSON.stringify(spelled.$trivia.leading())).toBe(JSON.stringify(interior.$trivia.leading()));
		expect(spelled.$render()).toBe('// hi\na');
	});

	it('refuses whitespace text no whitespace kind spells exactly', () => {
		expect(() => ir.identifier('a').$trivia.leading('\n \n')).toThrow(/no whitespace kind is spelled/);
		expect(() => ir.identifier('a').$trivia.leading('\n\n\n\n')).toThrow(/no whitespace kind is spelled/);
	});

	it('builds a line comment from its full spelling, not a doubled marker', () => {
		expect(ir.lineComment('// TODO').$render()).toBe('// TODO');
		expect(ir.comment('// TODO').$render()).toBe('// TODO');
		expect(ir.comment(' TODO').$render()).toBe('// TODO');
	});

	it('refuses loose text a sibling arm would read back as, naming that arm', () => {
		const a = (): ReturnType<typeof ir.identifier> => ir.identifier('a');
		expect(() => a().$trivia.leading('/ doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(() => a().$trivia.leading('/// doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(() => a().$trivia.leading('//! doc')).toThrow(/ir\.lineCommentDocInner/);
		expect(() => a().$trivia.leading('//// x')).toThrow(/ir\.lineCommentExtraSlashes/);
		expect(() => ir.lineComment('/ doc')).toThrow(/ir\.lineCommentDocOuter/);
		expect(a().$trivia.leading('//x').$render()).toBe('//x\na');
	});

	it('refuses a node entry whose kind is not trivia', () => {
		expect(() => ir.identifier('a').$trivia.leading(ir.identifier('b') as never)).toThrow(/identifier is not an extra/);
		expect(ir.identifier('a').$trivia.leading(ir.blockComment(' b ')).$render()).toBe('/* b */\na');
	});

	it('takes an eligible whitespace kind, built or spelled exactly, as its kind id', () => {
		const built = ir.identifier('a').$trivia.leading(ir.whitespace.blankline());
		const spelled = ir.identifier('a').$trivia.leading('\n\n');
		expect(built.$trivia.leading()).toEqual([TSKindId.Blankline]);
		expect(spelled.$trivia.leading()).toEqual([TSKindId.Blankline]);
	});

	it('refuses whitespace kinds the extras do not match, for the one reason that they are not extras', () => {
		const a = (): ReturnType<typeof ir.identifier> => ir.identifier('a');
		// @ts-expect-error tight is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(ir.whitespace.tight())).toThrow(/_tight is not an extra/);
		// @ts-expect-error indent is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(ir.whitespace.indent())).toThrow(/_indent is not an extra/);
		// @ts-expect-error dedent is not an extra, so it is no trivia entry
		expect(() => a().$trivia.leading(ir.whitespace.dedent())).toThrow(/_dedent is not an extra/);
	});

	it('renders a whitespace entry in place of the spacing of the gap it sits in', () => {
		const stmt = (name: string): ReturnType<typeof ir.expressionStatement> =>
			ir.expressionStatement(ir.identifier(name));
		expect(ir.block({ statements: [stmt('a'), stmt('b')] }).$render()).toBe('{\n    a;\n    b;\n}');
		const spaced = ir.block({ statements: [stmt('a'), stmt('b').$trivia.leading(ir.whitespace.blankline())] });
		expect(spaced.$render()).toBe('{\n    a;\n\n    b;\n}');
		const joined = ir.block({ statements: [stmt('a'), stmt('b').$trivia.leading(ir.whitespace.space())] });
		expect(joined.$render()).toBe('{\n    a; b;\n}');
		const afterComment = ir.block({ statements: [stmt('a'), stmt('b').$trivia.leading('// c', ir.whitespace.blankline())] });
		expect(afterComment.$render()).toBe('{\n    a;\n    // c\n\n    b;\n}');
		const keepsBreak = ir.block({ statements: [stmt('a'), stmt('b').$trivia.leading('// c', ir.whitespace.space())] });
		expect(keepsBreak.$render()).toBe('{\n    a;\n    // c\n    b;\n}');
		expect(innerOf(ir.block()).inner(ir.whitespace.blankline()).$render()).toBe('{\n\n}');
	});
});
