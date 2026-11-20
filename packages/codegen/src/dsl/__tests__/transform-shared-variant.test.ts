import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

type Node = { type: string; name?: string; value?: string | number; content?: Node; members?: Node[]; annotations?: { variant?: string; default?: boolean } };

const sym = (name: string) => ({ type: 'SYMBOL', name }) as never;
const str = (value: string) => ({ type: 'STRING', value }) as never;
const texts = (node: Node): string[] =>
	node.type === 'STRING' || node.type === 'SYMBOL' ? [String(node.value ?? node.name)] : [...(node.members ?? []), ...(node.content ? [node.content] : [])].flatMap(texts);
const unwrapped = (node: Node): Node => (node.type.startsWith('PREC') ? unwrapped(node.content!) : node);

describe('variant() with one name on several arms of a choice', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('mints one kind holding those arms in order, and the parent holds it once', () => {
		const { result, ctx } = withWireContext('update', () => {
			const g = globalThis as any;
			const original = g.prec.left(15, g.choice(g.seq(sym('x'), str('++')), g.seq(sym('x'), str('--')), g.seq(str('++'), sym('x')), g.seq(str('--'), sym('x'))));
			return transform(original, { 0: variant('postfix', { default: true }), 1: variant('postfix'), 2: variant('prefix'), 3: variant('prefix') }) as unknown as Node;
		});
		const arms = unwrapped(result).members!;
		expect(arms.map((arm) => [arm.name, arm.annotations?.variant, arm.annotations?.default === true])).toEqual([
			['update_postfix', 'postfix', true],
			['update_prefix', 'prefix', false]
		]);
		expect([...ctx.deposits.keys()].sort()).toEqual(['update_postfix', 'update_prefix']);
		const postfix = unwrapped(ctx.deposits.get('update_postfix') as unknown as Node);
		expect(postfix.type).toBe('CHOICE');
		expect(postfix.members!.map(texts)).toEqual([
			['x', '++'],
			['x', '--']
		]);
		expect(unwrapped(ctx.deposits.get('update_prefix') as unknown as Node).members!.map(texts)).toEqual([
			['++', 'x'],
			['--', 'x']
		]);
	});

	it('keeps the arms between them where they stand when the named arms are not adjacent', () => {
		const { result, ctx } = withWireContext('pick', () => {
			const g = globalThis as any;
			return transform(g.choice(g.seq(str('a'), sym('x')), g.seq(str('b'), sym('y')), g.seq(str('c'), sym('x'))), {
				0: variant('one'),
				1: variant('two'),
				2: variant('one')
			}) as unknown as Node;
		});
		expect(unwrapped(result).members!.map((arm) => arm.name)).toEqual(['pick_one', 'pick_two']);
		expect(unwrapped(ctx.deposits.get('pick_one') as unknown as Node).members!.map(texts)).toEqual([
			['a', 'x'],
			['c', 'x']
		]);
	});

	it('hoists the scaffolding into one kind for the arms that share a name', () => {
		const { result, ctx } = withWireContext('group', () => {
			const g = globalThis as any;
			return transform(g.seq(str('('), g.choice(sym('x'), sym('y'), sym('z')), str(')')), {
				'1/0': variant('pair'),
				'1/1': variant('pair'),
				'1/2': variant('last')
			}) as unknown as Node;
		});
		expect(unwrapped(result).members!.map((arm) => arm.name)).toEqual(['group_pair', 'group_last']);
		expect(texts(ctx.deposits.get('group_pair') as unknown as Node)).toEqual(['(', 'x', 'y', ')']);
		expect(texts(ctx.deposits.get('group_last') as unknown as Node)).toEqual(['(', 'z', ')']);
	});
});
