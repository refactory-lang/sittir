import { describe, expect, it } from 'vitest';
import { stripStructuralNodeText, type WrappedNodeData } from '../../src/validate/common.ts';
import { materializeProbeWrappedNodeData, probeTrace, resolveNativeTraceNodeData } from '../../src/probe/kind.ts';

function leaf(handle: number, text: string): WrappedNodeData {
	return {
		$type: handle,
		$source: 0,
		$named: true,
		$text: text,
		$nodeHandle: handle,
		$childIndex: 0
	};
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
			...leaf(1, 'let a = 1; let b = 2;'),
			_statements: leaf(10, 'collapsed'),
			statements() {
				return [leaf(11, 'let a = 1;'), leaf(12, 'let b = 2;')];
			}
		} satisfies WrappedNodeData;

		const materialized = asRecord(materializeProbeWrappedNodeData(wrapped));

		expect(materialized).not.toHaveProperty('$text');
		expect(materialized._statements).toEqual([
			expect.objectContaining({ $type: 11, $text: 'let a = 1;' }),
			expect.objectContaining({ $type: 12, $text: 'let b = 2;' })
		]);
	});

	it('strips root $text when structure is children-only', () => {
		const nodeData = {
			$type: 1,
			$source: 0,
			$named: true,
			$text: 'ψ1 = β_γ + Ψ_5',
			_children: []
		};

		const stripped = asRecord(stripStructuralNodeText(nodeData));

		expect(stripped).not.toHaveProperty('$text');
		expect(stripped._children).toEqual([]);
	});

	it('materialized probe data strips $text from children-only roots', () => {
		const wrapped = {
			...leaf(1, 'ψ1 = β_γ + Ψ_5'),
			_children: [],
			children() {
				return [];
			}
		} satisfies WrappedNodeData;

		const materialized = asRecord(materializeProbeWrappedNodeData(wrapped));

		expect(materialized).not.toHaveProperty('$text');
		expect(materialized._children).toEqual([]);
	});

	it('prefers the materialized wrapped path over the legacy deep walker', () => {
		const wrapped = {
			...leaf(1, 'let a = 1; let b = 2;'),
			_statements: leaf(10, 'collapsed'),
			statements() {
				return [leaf(11, 'let a = 1;'), leaf(12, 'let b = 2;')];
			}
		} satisfies WrappedNodeData;
		const legacy = {
			$type: 1,
			$text: 'let a = 1; let b = 2;',
			_statements: { $type: 10, $text: 'collapsed' }
		};

		const resolved = asRecord(resolveNativeTraceNodeData(wrapped, legacy));

		expect(resolved).not.toHaveProperty('$text');
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

		expect(resolveNativeTraceNodeData(undefined, legacy)).toBe(legacy);
	});

	it('defaults omitted trace engine selection to the full js/native matrix', async () => {
		const trace = await probeTrace('python', 'x');

		expect(trace.trace.js).toBeDefined();
		expect(trace.trace.native).toBeDefined();
	});

	it('limits trace output to the requested engine and reproduces native wrap errors for validator-like probes', async () => {
		const trace = await probeTrace('python', '(x for x in y)', {
			kind: 'generator_expression',
			engine: 'native'
		});

		expect(trace.trace.js).toBeUndefined();
		expect(trace.trace.native).toMatchObject({
			wrapError: expect.stringContaining(
				'singular slot "comprehension_clauses" on "generator_expression" requires one value'
			)
		});
	});
});
