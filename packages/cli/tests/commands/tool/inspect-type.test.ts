import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({
	inspectType: vi.fn().mockResolvedValue(0),
	DEFAULT_NAMESPACES: { rust: ['FieldDeclarationNs'] },
}));
import { inspectType as inspectTypeCmd } from '../../../src/commands/tool/inspect-type.ts';
import { inspectType as runInspectType } from '@sittir/tools';

describe('tool inspect-type command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		inspectTypeCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'inspect-type')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining(['--grammar', '--entry', '--namespaces', '--slots', '--config']),
		);
	});

	it('passes resolved namespaces to the tool run()', async () => {
		const program = new Command();
		inspectTypeCmd.register(program);
		await program.parseAsync(['inspect-type', '--grammar', 'rust', '--namespaces', 'FooNs, BarNs', '--slots', '--config'], { from: 'user' });
		expect(vi.mocked(runInspectType)).toHaveBeenCalledWith({
			grammar: 'rust',
			namespaces: ['FooNs', 'BarNs'],
			showSlots: true,
			showConfig: true,
		});
	});
});
