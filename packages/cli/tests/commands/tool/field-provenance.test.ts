import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ fieldProvenance: vi.fn().mockResolvedValue(0) }));
import { fieldProvenance as fieldProvenanceCmd } from '../../../src/commands/tool/field-provenance.ts';
import { fieldProvenance as runFieldProvenance } from '@sittir/tools';

describe('tool field-provenance command', () => {
	it('registers the field-provenance command', () => {
		const program = new Command();
		fieldProvenanceCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'field-provenance')!;
		expect(cmd).toBeDefined();
	});

	it('registers expected typed options', () => {
		const program = new Command();
		fieldProvenanceCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'field-provenance')!;
		const longs = cmd.options.map((o) => o.long);
		expect(longs).toEqual(expect.arrayContaining(['--grammar', '--kind', '--redundant', '--source']));
	});

	it('passes parsed options to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		fieldProvenanceCmd.register(program);
		await program.parseAsync(['field-provenance', '--grammar', 'rust', '--kind', 'block', '--redundant'], {
			from: 'user'
		});
		expect(vi.mocked(runFieldProvenance)).toHaveBeenCalledWith({
			grammar: 'rust',
			kind: 'block',
			redundant: true,
			source: undefined
		});
	});
});
