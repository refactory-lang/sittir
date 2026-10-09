import { describe, expect, it } from 'vitest';
import { materializeDetached, type TypedNode } from '../../src/validate/common.ts';
import { probeTrace, resolveNativeTraceUntypedNode } from '../../src/probe/kind.ts';

function leaf(kind: number, text: string): TypedNode {
	return { $type: kind, $text: text };
}

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		throw new TypeError('expected object');
	}
	return value as Record<string, unknown>;
}

describe('probe-kind native trace helpers', () => {
	it('materializes wrapped native trace data through wrap accessors', () => {
		const wrapped = {
			$type: 1,
			_statements: leaf(10, 'collapsed'),
			statements() {
				return [leaf(11, 'let a = 1;'), leaf(12, 'let b = 2;')];
			}
		} satisfies TypedNode;

		const materialized = asRecord(materializeDetached(wrapped));

		expect(materialized._statements).toEqual([
			expect.objectContaining({ $type: 11, $text: 'let a = 1;' }),
			expect.objectContaining({ $type: 12, $text: 'let b = 2;' })
		]);
	});

	it('prefers the materialized wrapped path over the legacy deep walker', () => {
		const wrapped = {
			$type: 1,
			_statements: leaf(10, 'collapsed'),
			statements() {
				return [leaf(11, 'let a = 1;'), leaf(12, 'let b = 2;')];
			}
		} satisfies TypedNode;
		const legacy = {
			$type: 1,
			$text: 'let a = 1; let b = 2;',
			_statements: { $type: 10, $text: 'collapsed' }
		};

		const resolved = asRecord(resolveNativeTraceUntypedNode(wrapped, legacy));

		expect(resolved._statements).toEqual([
			expect.objectContaining({ $type: 11, $text: 'let a = 1;' }),
			expect.objectContaining({ $type: 12, $text: 'let b = 2;' })
		]);
	});

	it('falls back to the legacy deep walker when wrap data is unavailable', () => {
		const legacy = {
			$type: 1,
			$text: 'let a = 1; let b = 2;',
			_statements: { $type: 10, $text: 'collapsed' }
		};

		expect(resolveNativeTraceUntypedNode(undefined, legacy)).toBe(legacy);
	});

	it('defaults omitted trace engine selection to the full js/native matrix', async () => {
		const trace = await probeTrace('python', 'x');

		expect(trace.trace.js).toBeDefined();
		expect(trace.trace.native).toBeDefined();
	});

	it('limits trace output to the requested engine for validator-like probes', async () => {
		// This probe historically reproduced a native wrap error ("singular slot
		// 'comprehension_clauses' on 'generator_expression' requires one value")
		// — that bug is fixed (comprehension_clauses is a real visible rule in
		// packages/python/grammar.sittir.ts now), so the trace is asserted to be a
		// clean, native-only round trip instead.
		const trace = await probeTrace('python', '(x for x in y)', {
			kind: 'generator_expression',
			engine: 'native'
		});

		expect(trace.trace.js).toBeUndefined();
		expect(trace.trace.native).toMatchObject({
			shallow: expect.objectContaining({ rendered: '(x for x in y)' }),
			deep: expect.objectContaining({ rendered: '(x for x in y)' })
		});
	});
});
