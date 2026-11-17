import { describe, expect, it } from 'vitest';
import { runPinned } from '../read.ts';

describe('the pinned child emits a portable build module', () => {
	it('writes the module through the pinned builders and returns its text and diagnostics', async () => {
		const { text, diagnostics } = await runPinned('portableBuild', {
			grammar: 'python',
			api: 'PythonAPI',
			map: 'PythonMap',
			table: {
				builders: { passStatement: 'nullary' },
				paths: { 'statement.pass': { root: true, arms: [{ kind: 1, builder: 'passStatement', when: [], members: [], presets: [], flags: {} }] } }
			},
			members: {}
		});
		expect(diagnostics).toEqual([]);
		expect(text).toContain('export function portableBuild(engine: Engine<PythonAPI>)');
		expect(text).toContain('b.passStatement()');
		expect(text).toContain('pass: statement_pass');
	}, 60_000);
});
