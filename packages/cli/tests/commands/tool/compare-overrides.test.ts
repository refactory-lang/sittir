import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ compareOverrides: vi.fn().mockResolvedValue(0) }));
import { compareOverrides as compareOverridesCmd } from '../../../src/commands/tool/compare-overrides.ts';
import { compareOverrides as runCompareOverrides } from '@sittir/tools';

describe('tool compare-overrides command', () => {
	it('registers with expected options', () => {
		const program = new Command();
		compareOverridesCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'compare-overrides')!;
		expect(cmd.options.map((o) => o.long)).toEqual(
			expect.arrayContaining([
				'--grammar',
				'--backup-dir',
				'--backup-rust',
				'--backup-python',
				'--backup-typescript',
				'--suggested-dir'
			])
		);
	});

	it('passes parsed options to the tool run()', async () => {
		const program = new Command();
		compareOverridesCmd.register(program);
		await program.parseAsync(
			[
				'compare-overrides',
				'--grammar',
				'rust',
				'--backup-dir',
				'backups',
				'--backup-rust',
				'rust-backup.ts',
				'--backup-python',
				'python-backup.ts',
				'--backup-typescript',
				'ts-backup.ts',
				'--suggested-dir',
				'packages-root'
			],
			{ from: 'user' }
		);
		expect(vi.mocked(runCompareOverrides)).toHaveBeenCalledWith({
			grammars: ['rust'],
			backupDir: 'backups',
			backupFiles: {
				rust: 'rust-backup.ts',
				python: 'python-backup.ts',
				typescript: 'ts-backup.ts'
			},
			suggestedDir: 'packages-root'
		});
	});
});
