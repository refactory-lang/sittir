import { describe, expect, it } from 'vitest';
import { collectingEmitDiagnostics, emitShapeFailure, guardOwner } from '../emit-diagnostics.ts';
import { assertOneUntaggedSlot } from '../../../emitters/node-projection.ts';
import { EmitHaltedError } from '../../../types/diagnostics.ts';

const fail = (code: string, ownerKind: string) => emitShapeFailure({ code, ownerKind, message: `${ownerKind} is broken` });

const haltedBy = (run: () => unknown): EmitHaltedError => {
	try {
		run();
	} catch (error) {
		return error as EmitHaltedError;
	}
	throw new Error('expected a halt');
};

describe('collecting the diagnostics of an emission', () => {
	it('reports every owner that fails, not the first', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', () => {
				for (const owner of ['a', 'b', 'c']) guardOwner(undefined, () => {
					if (owner !== 'b') throw fail('shape-broken', owner);
				});
			})
		);
		expect(halted).toBeInstanceOf(EmitHaltedError);
		expect(halted.blocking).toMatchObject([
			{ code: 'shape-broken', ownerKind: 'a', grammar: 'demo', canProceed: false },
			{ code: 'shape-broken', ownerKind: 'c', grammar: 'demo', canProceed: false }
		]);
	});

	it('reports a failure outside any guard together with the guarded ones', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', () => {
				guardOwner(undefined, () => {
					throw fail('inner', 'a');
				});
				throw fail('outer', 'z');
			})
		);
		expect(halted.blocking.map((d) => d.code)).toEqual(['inner', 'outer']);
	});

	it('lets an internal invariant, a plain error, abort at once', () => {
		expect(() =>
			collectingEmitDiagnostics('demo', () => {
				guardOwner(undefined, () => {
					throw new Error('invariant');
				});
			})
		).toThrow('invariant');
	});

	it('answers a guarded failure with the fallback and returns the result of a clean run', () => {
		expect(collectingEmitDiagnostics('demo', () => guardOwner(1, () => 2))).toBe(2);
		expect(haltedBy(() => collectingEmitDiagnostics('demo', () => guardOwner(1, () => { throw fail('x', 'a'); }))).blocking).toHaveLength(1);
	});

	it('lists a repeated failure once', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', () => {
				for (let pass = 0; pass < 2; pass++) guardOwner(undefined, () => {
					throw fail('same', 'a');
				});
			})
		);
		expect(halted.blocking).toHaveLength(1);
	});

	it('does not catch outside a collection', () => {
		expect(() => guardOwner(undefined, () => { throw fail('x', 'a'); })).toThrow(EmitHaltedError);
	});
});

describe('untagged-slot-ambiguous', () => {
	const entries = [{ id: 1, kind: 'identifier' }, { id: 7, kind: 'number' }, { id: 130, kind: 'expression' }] as never;

	it('names both slots, the shared kind and the patch, for every overlapping pair', () => {
		const halted = haltedBy(() =>
			assertOneUntaggedSlot(
				'join_clause',
				[
					{ name: 'name', ids: [1] },
					{ name: 'source', ids: [1, 7] },
					{ name: 'key', ids: [7] }
				],
				entries
			)
		);
		expect(halted.blocking).toMatchObject([
			{ code: 'untagged-slot-ambiguous', ownerKind: 'join_clause', details: { slots: ['name', 'source'], sharedKind: 'identifier', sharedKindId: 1 } },
			{ code: 'untagged-slot-ambiguous', ownerKind: 'join_clause', details: { slots: ['source', 'key'], sharedKind: 'number', sharedKindId: 7 } }
		]);
		expect(halted.blocking[0]!.proposal).toMatch(/field\('<name>'\)/);
	});

	it('is silent when no two slots share a kind', () => {
		expect(() => assertOneUntaggedSlot('k', [{ name: 'a', ids: [1] }, { name: 'b', ids: [7] }], entries)).not.toThrow();
	});
});
