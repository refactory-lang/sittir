import { describe, it, expect } from 'vitest';
import { runToFixpoint } from '../fixpoint.ts';
import { DiagnosticSink, EmitHaltedError } from '../../types/diagnostics.ts';
import { assertCompilation } from '../compile.ts';

describe('runToFixpoint', () => {
	it('returns once the step reports no change', () => {
		const diagnostics = new DiagnosticSink();
		let calls = 0;
		runToFixpoint({
			name: 'test.converges',
			cap: 16,
			diagnostics,
			step: () => {
				calls++;
				return calls < 3;
			}
		});
		expect(calls).toBe(3);
		expect(diagnostics.hasBlocking()).toBe(false);
	});

	it('raises a blocking diagnostic naming the pass when a cycling step never converges', () => {
		const diagnostics = new DiagnosticSink();
		runToFixpoint({
			name: 'test.cyclingPass',
			cap: 4,
			diagnostics,
			step: () => true
		});
		expect(diagnostics.hasBlocking()).toBe(true);
		const failed = diagnostics.all().find((d) => d.severity === 'fail');
		expect(failed?.code).toBe('fixpoint-cap-reached');
		expect(failed?.message).toContain('test.cyclingPass');
	});

	it('fails assertCompilation, naming the cycling pass', () => {
		const diagnostics = new DiagnosticSink();
		runToFixpoint({
			name: 'test.cyclingPass',
			cap: 4,
			diagnostics,
			step: () => true
		});

		let thrown: unknown;
		try {
			assertCompilation({
				grammar: 'cycling',
				raw: undefined as never,
				linked: undefined as never,
				normalized: undefined as never,
				nodeMap: undefined as never,
				diagnostics,
				slotGroupingDiagnostics: [],
				grammarDiagnostics: []
			});
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(EmitHaltedError);
		const message = (thrown as EmitHaltedError).message;
		expect(message).toContain('fixpoint-cap-reached');
		expect(message).toContain('test.cyclingPass');
	});
});
