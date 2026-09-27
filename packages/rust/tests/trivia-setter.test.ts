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
		expect(a.$trivia.leading().map((entry) => entry.$type)).toEqual([TSKindId.LineComment]);
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
		expect(spelled.$trivia.leading()[0]!.$type).toBe(TSKindId.LineComment);
		expect(JSON.stringify(spelled.$trivia.leading())).toBe(JSON.stringify(interior.$trivia.leading()));
		expect(spelled.$render()).toBe('// hi\na');
	});

	it('refuses a string the default arm cannot hold', () => {
		expect(() => ir.identifier('a').$trivia.leading('\n\n')).toThrow();
	});

	it('builds a line comment from its full spelling, not a doubled marker', () => {
		expect(ir.lineComment('// TODO').$render()).toBe('// TODO');
		expect(ir.comment('// TODO').$render()).toBe('// TODO');
		expect(ir.comment(' TODO').$render()).toBe('// TODO');
	});
});
