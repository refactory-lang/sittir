import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const bootstrapGrammar: CommandModule = {
	name: 'bootstrap-grammar',
	describe: 'Scaffold a new grammar package from an upstream tree-sitter grammar (its native crate is scaffolded by the first gen --all)',
	register: (program) => {
		defineCommand(program, bootstrapGrammar)
			.requiredOption('-n, --name <name>', 'Sittir grammar name (package dir, crate suffix, wire name)')
			.option('-u, --upstream <package>', 'Upstream npm package, or a verbatim non-npm spec such as github:owner/repo#tag (default: tree-sitter-<name>)')
			.option('-r, --range <range>', 'Upstream version range (default: ^<latest>)')
			.option('--no-install', 'Skip pnpm install')
			.option('-g, --generate', 'Run the full gen --all chain after install')
			.option('--dry-run', 'Print the files that would be written')
			.action(
				async (opts: {
					name: string;
					upstream?: string;
					range?: string;
					install?: boolean;
					generate?: boolean;
					dryRun?: boolean;
				}) => {
					const { bootstrapGrammar: runBootstrapGrammar } = await import('@sittir/tools');
					const code = await runBootstrapGrammar(opts);
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
