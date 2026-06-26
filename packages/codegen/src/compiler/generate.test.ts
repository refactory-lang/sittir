import { describe, it, expect } from 'vitest';
import type { NodeMap } from './types.ts';
import { DiagnosticSink, EmitHaltedError } from '../types/diagnostics.ts';
import { assertEmittable } from './generate.ts';

// Minimal stub — PR-G's assertEmittable does not read nodeMap.
// PR-L will exercise the nodeMap-reading 'unslotted-child' path.
const stubNodeMap = {} as NodeMap;

describe('assertEmittable', () => {
	it('does not throw for an empty sink (inert)', () => {
		const sink = new DiagnosticSink();
		expect(() => assertEmittable(stubNodeMap, sink)).not.toThrow();
	});

	it('does not throw for a sink with only warning/info items', () => {
		const sink = new DiagnosticSink();
		sink.warn({ code: 'W1', message: 'a warning', canProceed: true });
		sink.info({ code: 'I1', message: 'an info', canProceed: true });
		expect(() => assertEmittable(stubNodeMap, sink)).not.toThrow();
	});

	it('does not throw for a sink with error+canProceed:false (keys on fail, not canProceed)', () => {
		const sink = new DiagnosticSink();
		sink.emit({ code: 'E1', severity: 'error', message: 'an error', canProceed: false });
		expect(() => assertEmittable(stubNodeMap, sink)).not.toThrow();
	});

	it('throws EmitHaltedError when sink contains a fail diagnostic', () => {
		const sink = new DiagnosticSink();
		sink.fail({ code: 'HALT', message: 'fatal problem' });
		expect(() => assertEmittable(stubNodeMap, sink)).toThrow(EmitHaltedError);
	});

	it('blocking array contains only fail items (non-fail items filtered out)', () => {
		const sink = new DiagnosticSink();
		sink.warn({ code: 'W1', message: 'warning', canProceed: true });
		sink.fail({ code: 'F1', message: 'fatal1' });
		sink.info({ code: 'I1', message: 'info', canProceed: true });
		sink.fail({ code: 'F2', message: 'fatal2' });

		let caughtError: EmitHaltedError | undefined;
		try {
			assertEmittable(stubNodeMap, sink);
		} catch (e) {
			caughtError = e as EmitHaltedError;
		}
		expect(caughtError).toBeInstanceOf(EmitHaltedError);
		expect(caughtError!.blocking.map((d) => d.code)).toEqual(['F1', 'F2']);
	});
});
