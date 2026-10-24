import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { transform as transformRule } from '../transform/transform.ts';
import { ApplyPathSkip } from '../transform/transform-path.ts';
import { getCurrentWireContext, withWireContext, wireRecordBindingEffect } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

// An edits entry may write only the keys WIRE_ENTRY_ROLES classifies as undone, scoped or unreached.
// Each case runs one entry in a full layer; the wire checks its outside keys in a finally.
const rule = () => ({ type: 'SEQ', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'c' }] });

const inLayer = (patch: (_$: unknown, member: unknown) => unknown) =>
	withWireContext(null, (context) => {
		Object.assign(context, { layer: { name: 'top', depth: 1, diagnostics: [], narrows: [], leads: [], renames: [] }, currentDollar: {} });
		return transformRule(rule() as never, { '(a)': patch } as never);
	});

describe('an edits entry writes no key classified outside', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('1: an entry that adds to aliasTargets throws the outside error', () => {
		expect(() =>
			inLayer((_$: unknown, member: unknown) => {
				getCurrentWireContext()!.aliasTargets.add('zz');
				return member;
			})
		).toThrow(/an edits entry wrote aliasTargets, which WIRE_ENTRY_ROLES classifies outside/);
	});

	it('2: a refused entry that adds to aliasTargets throws the outside error, which replaces the skip', () => {
		expect(() =>
			inLayer((_$: unknown, _member: unknown) => {
				getCurrentWireContext()!.aliasTargets.add('zz');
				throw new ApplyPathSkip('miss');
			})
		).toThrow(/an edits entry wrote aliasTargets, which WIRE_ENTRY_ROLES classifies outside/);
	});

	it('3: a nested key is named by its dotted path', () => {
		expect(() =>
			inLayer((_$: unknown, member: unknown) => {
				const ctx = getCurrentWireContext()!;
				(ctx.automaticVariants.supertypeOwners as Set<string>).add('zz');
				return member;
			})
		).toThrow(/automaticVariants\.supertypeOwners/);
	});

	it('4: a control that records an undone binding effect and returns m does not throw', () => {
		expect(() =>
			inLayer((_$: unknown, member: unknown) => {
				wireRecordBindingEffect({ kind: 'alias', from: 'a', to: 'b' } as never);
				return member;
			})
		).not.toThrow();
	});
});
