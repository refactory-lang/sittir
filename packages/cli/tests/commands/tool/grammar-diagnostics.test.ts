import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ grammarDiagnostics: vi.fn().mockResolvedValue(0) }));
import { grammarDiagnostics as grammarDiagnosticsCmd } from '../../../src/commands/tool/grammar-diagnostics.ts';
import { grammarDiagnostics as runGrammarDiagnostics } from '@sittir/tools';

describe('tool grammar-diagnostics command', () => {
	it('registers with --grammar', () => {
		const program = new Command();
		grammarDiagnosticsCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'grammar-diagnostics')!;
		expect(cmd.options.map((o) => o.long)).toEqual(expect.arrayContaining(['--grammar']));
	});

	it('defaults grammar to rust', async () => {
		vi.clearAllMocks();
		const program = new Command();
		grammarDiagnosticsCmd.register(program);
		await program.parseAsync(['grammar-diagnostics'], { from: 'user' });
		expect(vi.mocked(runGrammarDiagnostics)).toHaveBeenCalledWith({ grammar: 'rust' });
	});
});
