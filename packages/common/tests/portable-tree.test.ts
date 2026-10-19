import { describe, expect, it } from 'vitest';
import { portable } from '../src/portable/index.ts';
import { portableTrees } from '../src/portable/tree.ts';

const PATHS = [
	'declaration',
	'declaration.constructor',
	'declaration.function',
	'expression',
	'expression.call',
	'expression.call.member'
];

const trees = () => portableTrees(PATHS, (path) => (node): node is { readonly $type: number } => node === path);

type Tree = Record<string, unknown>;
const at = (root: unknown, path: string): Tree =>
	path.split('.').reduce<Tree>((node, segment) => node[segment] as Tree, root as Tree);

const ownKeys = (node: object): string[] => Object.keys(node).sort();

describe('portableTrees', () => {
	it('gives each kind node its path', () => {
		const { kinds } = trees();
		for (const path of PATHS) expect(at(kinds, path).$path).toBe(path);
	});

	it('gives each guard node the guard for its path', () => {
		const { is } = trees();
		for (const path of PATHS) {
			const guard = at(is, path) as unknown as (node: unknown) => boolean;
			expect(typeof guard).toBe('function');
			expect(guard(path)).toBe(true);
			expect(guard('expression')).toBe(path === 'expression');
		}
	});

	it('reads an unknown segment as undefined', () => {
		expect(at(trees().kinds, 'declaration').nope).toBeUndefined();
		expect(at(trees().is, 'declaration').nope).toBeUndefined();
	});

	it('freezes every node of both trees', () => {
		const { kinds, is } = trees();
		for (const root of [kinds, is]) {
			expect(Object.isFrozen(root)).toBe(true);
			for (const path of PATHS) expect(Object.isFrozen(at(root, path))).toBe(true);
		}
	});

	it('has the same keys in both trees at every level', () => {
		const { kinds, is } = trees();
		expect(ownKeys(kinds)).toEqual(ownKeys(is));
		for (const path of PATHS)
			expect(ownKeys(at(kinds, path)).filter((key) => key !== '$path')).toEqual(ownKeys(at(is, path)));
	});

	it('links a segment named like a Function.prototype member to its guard', () => {
		const { is } = trees();
		expect(at(is, 'expression.call')).not.toBe(Function.prototype.call);
		expect((at(is, 'expression.call') as unknown as (node: unknown) => boolean)('expression.call')).toBe(true);
		expect(
			(at(is, 'declaration.constructor') as unknown as (node: unknown) => boolean)('declaration.constructor')
		).toBe(true);
	});

	it('refuses a path whose parent is not listed', () => {
		expect(() => portableTrees(['a.b'], () => (_node): _node is { readonly $type: number } => false)).toThrow(/a\.b.*a/);
	});
});

describe('portable', () => {
	it('serves one kind node per vocabulary path', () => {
		expect(at(portable.kinds, 'declaration.function').$path).toBe('declaration.function');
		expect(at(portable.kinds, 'expression.call').$path).toBe('expression.call');
		expect(at(portable.kinds, 'declaration').nope).toBeUndefined();
	});

	it('serves one guard per vocabulary path beside the kinds, with the same keys', () => {
		expect(Object.keys(portable).sort()).toEqual(['is', 'kinds']);
		expect(typeof at(portable.is, 'declaration.function')).toBe('function');
		expect(at(portable.is, 'expression.call')).not.toBe(Function.prototype.call);
		expect(Object.isFrozen(portable)).toBe(true);
	});
});
