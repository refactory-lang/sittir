import { describe, expect, it } from 'vitest';
import type { PortableTable } from '@sittir/types';
import { portableSurface } from '../src/portable.ts';

type Guard = (node: unknown) => boolean;
type Visibility = Guard & { readonly internal: Guard };
interface Guards {
	readonly declaration: {
		readonly method: Guard & {
			readonly public: Visibility;
			readonly getter: Guard & { readonly public: Visibility };
		};
	};
}

const TABLE: PortableTable = {
	paths: {
		declaration: { ids: [1], exact: false },
		'declaration.method': { ids: [1], exact: false },
		'declaration.method.public': { ids: [1], exact: false },
		'declaration.method.public.internal': { ids: [1], exact: false },
		'declaration.method.getter': { ids: [1], exact: false },
		'declaration.method.getter.public': { ids: [1], exact: false },
		'declaration.method.getter.public.internal': { ids: [1], exact: false }
	},
	fixedText: {},
	entries: {
		1: [
			{
				path: 'declaration.method.getter.public.internal',
				within: [],
				test: [{ up: 0, via: [], plan: { op: 'eq', text: 'internal getter', self: true } }]
			},
			{
				path: 'declaration.method.getter.public',
				within: [],
				test: [{ up: 0, via: [], plan: { op: 'eq', text: 'public getter', self: true } }]
			},
			{ path: 'declaration.method', within: [], test: [] }
		]
	}
};

const { is } = portableSurface<unknown, Guards>(TABLE, {});

describe('portable crossing guards', () => {
	it('reads each fact of a classified public getter', () => {
		const node = { $type: 1, $text: 'public getter' };
		expect(is.declaration.method.public(node)).toBe(true);
		expect(is.declaration.method.getter(node)).toBe(true);
		expect(is.declaration.method.public.internal(node)).toBe(false);
	});

	it('reads a nested visibility fact of a classified getter', () => {
		expect(is.declaration.method.public.internal({ $type: 1, $text: 'internal getter' })).toBe(true);
	});

	it('reads the same facts from a stamped portable path', () => {
		const node = { $type: 1, $subType: 'declaration.method.getter.public.internal' };
		expect(is.declaration.method.public(node)).toBe(true);
		expect(is.declaration.method.public.internal(node)).toBe(true);
		expect(is.declaration.method.getter(node)).toBe(true);
	});

	it('requires every fact, its whole segment, and its order within the namespace', () => {
		for (const path of [
			'declaration.method.getter',
			'declaration.method.getter.publicity',
			'modifier.declaration.method.getter.public',
			'expression.method.getter.public'
		])
			expect(is.declaration.method.public({ $type: 1, $subType: path }), path).toBe(false);
		expect(
			is.declaration.method.public.internal({ $type: 1, $subType: 'declaration.method.internal.getter.public' })
		).toBe(false);
	});

	it('retains kind admission and the predicates that classify an unstamped node', () => {
		expect(is.declaration.method.public({ $type: 2, $subType: 'declaration.method.getter.public' })).toBe(false);
		expect(is.declaration.method.public({ $type: 1, $text: 'plain method' })).toBe(false);
	});
});
