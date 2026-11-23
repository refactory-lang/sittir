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

const guardOf = (path: string) => (node: unknown): node is { readonly $type: number } => node === path;

const trees = () => portableTrees(PATHS, [], [], guardOf);

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

	it('gives a namespace a node in each tree: its path as $namespace among the kinds, the guard for its path among the guards', () => {
		const { kinds, is } = portableTrees(['a', 'a.n.k', 'a.n.j'], ['a.n'], [], guardOf);
		expect(at(kinds, 'a.n').$path).toBeUndefined();
		expect(at(kinds, 'a.n').$namespace).toBe('a.n');
		expect(ownKeys(at(kinds, 'a.n'))).toEqual(['$namespace', 'j', 'k']);
		expect(at(kinds, 'a.n.k').$path).toBe('a.n.k');
		const guard = at(is, 'a.n') as unknown as (node: unknown) => boolean;
		expect(guard('a.n')).toBe(true);
		expect(guard('a.n.k')).toBe(false);
		expect(ownKeys(at(is, 'a.n'))).toEqual(['j', 'k']);
		for (const root of [kinds, is]) expect(Object.isFrozen(at(root, 'a.n'))).toBe(true);
	});

	it('gives a namespace at the root a node under no kind', () => {
		const { kinds, is } = portableTrees(['a.b'], ['a'], [], guardOf);
		expect(ownKeys(kinds)).toEqual(['a']);
		expect(at(kinds, 'a').$path).toBeUndefined();
		expect(at(kinds, 'a').$namespace).toBe('a');
		expect(at(kinds, 'a.b').$path).toBe('a.b');
		expect((at(is, 'a') as unknown as (node: unknown) => boolean)('a')).toBe(true);
	});

	it('gives an alias a node in each tree: its path as $namespace among the kinds, the guard for its path among the guards', () => {
		const { kinds, is } = portableTrees(['a', 'b', 'b.c'], [], ['a.c'], guardOf);
		expect(at(kinds, 'a.c').$path).toBeUndefined();
		expect(at(kinds, 'a.c').$namespace).toBe('a.c');
		expect((at(is, 'a.c') as unknown as (node: unknown) => boolean)('a.c')).toBe(true);
	});

	it('refuses a path whose parent is neither a listed path nor a namespace', () => {
		expect(() => portableTrees(['a.b'], [], [], guardOf)).toThrow(/a\.b.*a/);
		expect(() => portableTrees(['a', 'a.n.k'], [], [], guardOf)).toThrow(/a\.n\.k.*a\.n/);
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

	it('serves a node at each vocabulary namespace: its path as $namespace among the kinds, a guard among the guards', () => {
		expect(at(portable.kinds, 'declaration.member').$path).toBeUndefined();
		expect(at(portable.kinds, 'declaration.member').$namespace).toBe('declaration.member');
		expect(at(portable.kinds, 'declaration.member.method').$path).toBe('declaration.member.method');
		expect(typeof at(portable.is, 'declaration.member')).toBe('function');
		expect(typeof at(portable.is, 'expression.collection.list')).toBe('function');
	});
});
