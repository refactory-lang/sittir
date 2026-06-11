import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parsePath, applyPath } from '../transform/transform-path.ts';
import { transform } from '../transform/transform.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

// Helpers return `any` so tests can mix them freely with the
// transform path-helpers, which operate on the `RuntimeRule` supertype
// (narrower than sittir's `Rule`). Casting here avoids `as any`
// boilerplate at every call site.
const sym = (name: string): any => ({ type: 'symbol', name });
const str = (value: string): any => ({ type: 'string', value });
const seq = (...members: any[]): any => ({ type: 'seq', members });
const choice = (...members: any[]): any => ({ type: 'choice', members });
const optional = (content: any): any => ({ type: 'optional', content });
const fld = (name: string, content: any): any => ({
	type: 'field',
	name,
	content
});

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('parsePath()', () => {
	it('parses a single index', () => {
		expect(parsePath('0')).toEqual([{ kind: 'index', value: 0 }]);
		expect(parsePath('5')).toEqual([{ kind: 'index', value: 5 }]);
	});

	it('parses nested paths', () => {
		expect(parsePath('0/1/2')).toEqual([
			{ kind: 'index', value: 0 },
			{ kind: 'index', value: 1 },
			{ kind: 'index', value: 2 }
		]);
	});

	it('parses wildcard _ segments', () => {
		expect(parsePath('_')).toEqual([{ kind: 'wildcard' }]);
		expect(parsePath('0/_/1')).toEqual([
			{ kind: 'index', value: 0 },
			{ kind: 'wildcard' },
			{ kind: 'index', value: 1 }
		]);
	});

	it('parses kind-match segments (name in parentheses)', () => {
		expect(parsePath('(foo)')).toEqual([{ kind: 'kind-match', name: 'foo' }]);
		expect(parsePath('0/(_expression)/1')).toEqual([
			{ kind: 'index', value: 0 },
			{ kind: 'kind-match', name: '_expression' },
			{ kind: 'index', value: 1 }
		]);
	});

	it('parses field-traversal segments (name with colon suffix)', () => {
		expect(parsePath('foo:')).toEqual([{ kind: 'fieldName', name: 'foo' }]);
		expect(parsePath('0/elements:/1')).toEqual([
			{ kind: 'index', value: 0 },
			{ kind: 'fieldName', name: 'elements' },
			{ kind: 'index', value: 1 }
		]);
	});

	it('parses negative-index segments', () => {
		expect(parsePath('0/-1')).toEqual([
			{ kind: 'index', value: 0 },
			{ kind: 'index', value: -1 }
		]);
	});

	it('rejects empty path', () => {
		expect(() => parsePath('')).toThrow(/non-empty/);
	});

	it('rejects leading slash', () => {
		expect(() => parsePath('/0')).toThrow(/leading\/trailing slash/);
	});

	it('rejects trailing slash', () => {
		expect(() => parsePath('0/')).toThrow(/leading\/trailing slash/);
	});

	it('rejects * with migration error — use _ instead', () => {
		expect(() => parsePath('*')).toThrow(/path segment '\*' is no longer valid — use '_' for wildcard; see ADR-0010/);
		expect(() => parsePath('0/*/1')).toThrow(/path segment '\*' is no longer valid/);
	});

	it('rejects bare kind name with migration error — use (name) instead', () => {
		expect(() => parsePath('foo')).toThrow(
			/bare kind name 'foo' is no longer valid as a path segment — use '\(foo\)' instead; see ADR-0010/
		);
		expect(() => parsePath('0/_expression/1')).toThrow(/bare kind name '_expression' is no longer valid/);
	});

	it('rejects segments that match neither index/wildcard/kind-name/field-name', () => {
		expect(() => parsePath('0/1a/1')).toThrow(/invalid segment '1a'/);
	});
});

describe('applyPath()', () => {
	it('replaces at a single top-level index', () => {
		const rule = seq(str('('), sym('expr'), str(')'));
		const result = applyPath(rule, [{ kind: 'index', value: 1 }], fld('content', sym('expr')));
		expect((result as any).members[1]).toMatchObject({
			type: 'field',
			name: 'content'
		});
	});

	it('descends into nested seq via path', () => {
		const rule = seq(str('('), seq(sym('a'), sym('b'), sym('c')), str(')'));
		const result = applyPath(
			rule,
			[
				{ kind: 'index', value: 1 },
				{ kind: 'index', value: 1 }
			],
			fld('middle', sym('b'))
		);
		const inner = (result as any).members[1];
		expect(inner.members[1]).toMatchObject({ type: 'field', name: 'middle' });
		// Other positions untouched
		expect(inner.members[0]).toMatchObject({ type: 'symbol', name: 'a' });
		expect(inner.members[2]).toMatchObject({ type: 'symbol', name: 'c' });
	});

	it('descends into optional wrapper at index 0', () => {
		const rule = seq(optional(sym('inner')), sym('after'));
		const result = applyPath(
			rule,
			[
				{ kind: 'index', value: 0 },
				{ kind: 'index', value: 0 }
			],
			fld('opt', sym('inner'))
		);
		const opt = (result as any).members[0];
		expect(opt).toMatchObject({ type: 'optional' });
		expect(opt.content).toMatchObject({ type: 'field', name: 'opt' });
	});

	it('throws on out-of-bounds index', () => {
		const rule = seq(sym('a'), sym('b'));
		expect(() => applyPath(rule, [{ kind: 'index', value: 5 }], fld('x', sym('a')))).toThrow(
			/index 5 out of bounds in seq of length 2/
		);
	});

	it('throws on out-of-bounds in wrapper', () => {
		const rule = optional(sym('inner'));
		expect(() => applyPath(rule, [{ kind: 'index', value: 1 }], fld('x', sym('inner')))).toThrow(
			/index 1 out of bounds.*optional.*single content/
		);
	});

	describe('wildcards (_)', () => {
		it('applies to every member of a choice', () => {
			const rule = choice(seq(sym('a'), sym('b')), seq(sym('c'), sym('d')));
			const result = applyPath(rule, [{ kind: 'wildcard' }, { kind: 'index', value: 0 }], (m) => fld('first', m));
			const branches = (result as any).members;
			expect(branches[0].members[0]).toMatchObject({
				type: 'field',
				name: 'first'
			});
			expect(branches[1].members[0]).toMatchObject({
				type: 'field',
				name: 'first'
			});
			// Second position untouched in both branches
			expect(branches[0].members[1]).toMatchObject({
				type: 'symbol',
				name: 'b'
			});
			expect(branches[1].members[1]).toMatchObject({
				type: 'symbol',
				name: 'd'
			});
		});

		it('throws on zero-match wildcard', () => {
			const rule = seq(str('('), str(')'));
			// Wildcard at position 0 is fine, but trying to descend further
			// into string members will fail every time → zero applied → throw.
			expect(() => applyPath(rule, [{ kind: 'wildcard' }, { kind: 'index', value: 0 }], fld('x', sym('y')))).toThrow(
				/wildcard matched zero/
			);
		});
	});

	describe('field traversal (fieldName segment)', () => {
		it('descends through a field wrapper when name matches', () => {
			const rule = seq(fld('name', sym('identifier')), fld('body', sym('block')));
			const result = applyPath(
				rule,
				[
					{ kind: 'index', value: 1 },
					{ kind: 'fieldName', name: 'body' }
				],
				sym('new_block')
			);
			const bodyField = (result as any).members[1];
			expect(bodyField).toMatchObject({ type: 'field', name: 'body' });
			expect(bodyField.content).toMatchObject({
				type: 'symbol',
				name: 'new_block'
			});
		});

		it('throws when the rule at that position is not a field wrapper', () => {
			const rule = seq(sym('identifier'), sym('body'));
			expect(() =>
				applyPath(
					rule,
					[
						{ kind: 'index', value: 1 },
						{ kind: 'fieldName', name: 'body' }
					],
					sym('new_body')
				)
			).toThrow(/path segment 'body:' at this level expects a field\('body', \.\.\.\) wrapper; got type 'symbol'/);
		});

		it('throws when the field name at that position does not match', () => {
			const rule = fld('name', sym('identifier'));
			expect(() => applyPath(rule, [{ kind: 'fieldName', name: 'body' }], sym('new_identifier'))).toThrow(
				/path segment 'body:' doesn't match field name 'name' at this position/
			);
		});
	});
});

describe('transform() — object form with path keys', () => {
	it('applies a single path-addressed patch using _ wildcard', () => {
		const rule = seq(sym('a'), sym('b'));
		// The path key '_' marks this as path mode (not flat positional).
		// Use the wildcard to apply to all members for the smoke test.
		const flat = transform(rule, { _: fld('any', sym('a')) } as Record<string, Rule>);
		const r = flat as any;
		expect(r.members[0]).toMatchObject({
			type: 'field',
			name: 'any',
			source: 'override'
		});
		expect(r.members[1]).toMatchObject({
			type: 'field',
			name: 'any',
			source: 'override'
		});
	});

	it('reaches into nested structure via path', () => {
		const rule = seq(seq(sym('a'), sym('b')), sym('outer'));
		const result = transform(rule, {
			'0/1': fld('inner_b', sym('b'))
		} as Record<string, Rule>);
		const r = result as any;
		expect(r.members[0].members[1]).toMatchObject({
			type: 'field',
			name: 'inner_b'
		});
	});

	it('applies multiple patches', () => {
		const rule = seq(seq(sym('a'), sym('b')), sym('c'));
		const result = transform(rule, {
			'0/0': fld('first', sym('a')),
			'1': fld('outer', sym('c'))
		} as Record<string, Rule>);
		const r = result as any;
		expect(r.members[0].members[0]).toMatchObject({
			type: 'field',
			name: 'first'
		});
		expect(r.members[1]).toMatchObject({ type: 'field', name: 'outer' });
	});
});

describe('transform() — object form (flat positional, backward-compat)', () => {
	it('still works with the original Record<number, Rule> shape', () => {
		const rule = seq(sym('a'), sym('b'));
		const result = transform(rule, { 0: fld('first', sym('a')) });
		const r = result as any;
		expect(r.members[0]).toMatchObject({
			type: 'field',
			name: 'first',
			source: 'override'
		});
	});

	it('unwraps an enrich-inferred field on the original member before re-wrapping', async () => {
		// This is the explicit fix for enrich+override nested-field
		// bugs. When enrich has already wrapped a seq member as
		// `field('xxx', $.sym, source: 'inferred')` and the override's
		// transform patches that position with a one-arg `field('new')`
		// placeholder, resolvePatch must unwrap the inferred layer so
		// the result is `field('new', $.sym, source: 'override')`, NOT
		// `field('new', field('xxx', $.sym), source: 'override')`.
		const { field: oneArgField } = await import('../primitives/field.ts');
		const rule = seq(
			// Simulate enrich-inferred field wrapper on position 0.
			{
				type: 'field',
				name: 'inferred_name',
				content: sym('expr'),
				source: 'inferred'
			} as Rule,
			sym('rhs')
		);
		// One-arg field placeholder + flat positional transform.
		const result = transform(rule, { 0: oneArgField('override_name') as Rule });
		const r = result as any;
		expect(r.members[0]).toMatchObject({
			type: 'field',
			name: 'override_name',
			source: 'override',
			// Inner content is the original symbol, NOT a nested field.
			content: { type: 'symbol', name: 'expr' }
		});
		// Belt-and-suspenders: the inner content must not itself be a field.
		expect(r.members[0].content.type).not.toBe('field');
	});
});

describe('applyPath() — kind-match + negative index', () => {
	it('kind-match wraps every occurrence recursively (new (name) syntax)', async () => {
		const { field: oneArgField } = await import('../primitives/field.ts');
		// seq(expr, ',', seq(expr, ',', expr)) — three _expression refs.
		const rule = seq(sym('_expression'), str(','), seq(sym('_expression'), str(','), sym('_expression')));
		const result = transform(rule, {
			'(_expression)': oneArgField('elements') as Rule
		});
		const r = result as any;
		expect(r.members[0]).toMatchObject({ type: 'field', name: 'elements' });
		expect(r.members[2].members[0]).toMatchObject({
			type: 'field',
			name: 'elements'
		});
		expect(r.members[2].members[2]).toMatchObject({
			type: 'field',
			name: 'elements'
		});
		// The literal `,` tokens stay untouched.
		expect(r.members[1]).toMatchObject({ type: 'string', value: ',' });
	});

	it('kind-match skips occurrences already inside a named field (new (name) syntax)', async () => {
		const { field: oneArgField } = await import('../primitives/field.ts');
		// rust's array_expression `[x; N]` shape: first _expression is
		// bare, second is inside `field('length', _expression)`. A
		// kind-match on `_expression` must label the bare one as
		// `elements` but leave the pre-fielded `length` intact.
		const rule = seq(sym('_expression'), str(';'), {
			type: 'field',
			name: 'length',
			content: sym('_expression')
		} as Rule);
		// Kind-match from root: `(_expression)` finds all bare occurrences,
		// skips any already inside a named field wrapper.
		const result = transform(rule, {
			'(_expression)': oneArgField('elements') as Rule
		});
		const r = result as any;
		expect(r.members[0]).toMatchObject({ type: 'field', name: 'elements' });
		// The pre-fielded `length` slot survives unchanged.
		expect(r.members[2]).toMatchObject({
			type: 'field',
			name: 'length',
			content: { type: 'symbol', name: '_expression' }
		});
	});

	it('negative index resolves from the end (-1 = last member)', async () => {
		const { field: oneArgField } = await import('../primitives/field.ts');
		// Use a symbol (not a bare string) as the last member so the
		// result isn't routed through maybeKeywordSymbol's bare-STRING
		// synthesis path — we just want to verify the index resolution.
		const rule = seq(str('struct'), sym('name'), sym('body'));
		const result = transform(rule, { '-1': oneArgField('body_field') as Rule });
		const r = result as any;
		expect(r.members[2]).toMatchObject({
			type: 'field',
			name: 'body_field',
			content: { type: 'symbol', name: 'body' }
		});
		// Other positions untouched.
		expect(r.members[0]).toMatchObject({ type: 'string', value: 'struct' });
	});
});
