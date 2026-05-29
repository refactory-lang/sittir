import { resolve } from 'node:path';
import type { CommandModule } from '../../framework/command-module.ts';
import { compareOverrides as runCompareOverrides } from '@sittir/tools';

export const compareOverrides: CommandModule = {
	name: 'compare-overrides',
	describe: 'Compare override key sets between backup and current overrides.suggested.ts',
	register: (program) => {
		program.command('compare-overrides')
			.description('Compare override key sets between backup and current overrides.suggested.ts')
			.option('-g, --grammar <name>', 'Grammar(s) to compare: rust|python|typescript|all', 'all')
			.option('--backup-dir <dir>', 'Directory containing <grammar>-overrides.ts backup files')
			.option('--backup-rust <file>', 'Path to Rust overrides backup file')
			.option('--backup-python <file>', 'Path to Python overrides backup file')
			.option('--backup-typescript <file>', 'Path to TypeScript overrides backup file')
			.option('--suggested-dir <dir>', 'Packages root for overrides.suggested.ts lookup')
			.action(async (opts: { grammar?: string; backupDir?: string; backupRust?: string; backupPython?: string; backupTypescript?: string; suggestedDir?: string }) => {
				const grammarArg = opts.grammar ?? 'all';
				const grammars =
					grammarArg === 'all'
						? ['rust', 'python', 'typescript']
						: [grammarArg];
				const backupFiles: Partial<Record<'rust' | 'python' | 'typescript', string>> = {};
				if (opts.backupRust) backupFiles.rust = opts.backupRust;
				if (opts.backupPython) backupFiles.python = opts.backupPython;
				if (opts.backupTypescript) backupFiles.typescript = opts.backupTypescript;
				const code = await runCompareOverrides({
					grammars,
					backupDir: opts.backupDir,
					backupFiles,
					suggestedDir: opts.suggestedDir ?? resolve(process.cwd(), 'packages'),
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
