import { describe, expect, it } from 'vitest';
import { collectingEmitDiagnostics, EmitCollector, emitShapeFailure } from '../emit-diagnostics.ts';
import { assertOneUntaggedSlot } from '../../../emitters/node-projection.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../../types/diagnostics.ts';

const fail = (code: string, ownerKind: string) => emitShapeFailure({ code, ownerKind, message: `${ownerKind} is broken` });

const haltedBy = (run: () => unknown): EmitHaltedError => {
	try {
		run();
	} catch (error) {
		return error as EmitHaltedError;
	}
	throw new Error('expected a halt');
};

const blocking = (error: EmitHaltedError): readonly GrammarDiagnostic[] => error.blocking as readonly GrammarDiagnostic[];

describe('collecting the diagnostics of an emission', () => {
	it('reports every owner that fails, not the first, stamping the grammar', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				for (const owner of ['a', 'b', 'c'])
					collector.guard(() => {
						if (owner !== 'b') throw fail('shape-broken', owner);
					});
			})
		);
		expect(halted).toBeInstanceOf(EmitHaltedError);
		expect(blocking(halted)).toMatchObject([
			{ code: 'shape-broken', ownerKind: 'a', grammar: 'demo', canProceed: false },
			{ code: 'shape-broken', ownerKind: 'c', grammar: 'demo', canProceed: false }
		]);
	});

	it('reports a failure outside any guard together with the guarded ones', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				collector.guard(() => {
					throw fail('inner', 'a');
				});
				throw fail('outer', 'z');
			})
		);
		expect(blocking(halted).map((d) => d.code)).toEqual(['inner', 'outer']);
	});

	it('answers a failed guard with undefined and a clean one with its value', () => {
		const seen: unknown[] = [];
		haltedBy(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				seen.push(collector.guard(() => 2));
				seen.push(collector.guard(() => { throw fail('x', 'a'); }));
				seen.push(collector.failed);
			})
		);
		expect(seen).toEqual([2, undefined, true]);
		expect(collectingEmitDiagnostics('demo', (collector) => collector.guard(() => 7))).toBe(7);
	});

	it('lets an internal error abort when nothing was collected', () => {
		expect(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				collector.guard(() => {
					throw new Error('invariant');
				});
			})
		).toThrow('invariant');
	});

	it('keeps the collected diagnostics when a later stage crashes on the output of a failed one', () => {
		const crashed = haltedBy(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				const first = collector.guard((): { rows: number[] } => {
					throw fail('first-stage', 'a');
				});
				return first!.rows.length;
			})
		);
		expect(blocking(crashed).map((d) => d.code)).toEqual(['first-stage', 'emit-aborted-after-failure']);
		expect(blocking(crashed)[1]!.message).toMatch(/after 1 diagnostic\(s\).*Cannot read properties of undefined/);
	});

	it('lists a repeated failure once', () => {
		const halted = haltedBy(() =>
			collectingEmitDiagnostics('demo', (collector) => {
				for (let pass = 0; pass < 2; pass++)
					collector.guard(() => {
						throw fail('same', 'a');
					});
			})
		);
		expect(blocking(halted)).toHaveLength(1);
	});

	it('is local to its collector: a separate one sees none of it', () => {
		const one = new EmitCollector('x');
		one.guard(() => {
			throw fail('x', 'a');
		});
		expect(one.failed).toBe(true);
		expect(new EmitCollector('y').failed).toBe(false);
		expect(() => one.assertClear()).toThrow(EmitHaltedError);
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
		expect(blocking(halted)).toMatchObject([
			{ code: 'untagged-slot-ambiguous', ownerKind: 'join_clause', details: { slots: ['name', 'source'], sharedKind: 'identifier', sharedKindId: 1 } },
			{ code: 'untagged-slot-ambiguous', ownerKind: 'join_clause', details: { slots: ['source', 'key'], sharedKind: 'number', sharedKindId: 7 } }
		]);
		expect(blocking(halted)[0]!.proposal).toMatch(/field\('<name>'\)/);
	});

	it('is silent when no two slots share a kind', () => {
		expect(() => assertOneUntaggedSlot('k', [{ name: 'a', ids: [1] }, { name: 'b', ids: [7] }], entries)).not.toThrow();
	});
});
