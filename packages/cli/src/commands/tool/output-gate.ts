import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

const repeated = (value: string, previous: readonly string[] = []): readonly string[] => [...previous, value];

export const outputGate: CommandModule = {
	name: 'output-gate',
	describe: "Record the generated files as git blobs and check a tree against them, or snapshot and check each layer's evaluated grammar",
	register: (program) => {
		defineCommand(program, outputGate)
			.option('--record <out>', 'Write a manifest of every generated file, as <blob> <path> lines, at --rev (default HEAD)')
			.option('--check <manifest>', 'Compare the generated files at --rev (default the worktree) with a manifest, and print each changed, missing or added file')
			.option('--rev <rev>', 'The revision to record or check')
			.option('--except <path[:key,key]>', 'A generated file allowed to differ; with keys, only those top-level JSON keys may differ (repeatable)', repeated)
			.option('--snapshot <dir>', "Write each grammar's evaluated grammar, per layer, as canonical JSON")
			.option('--check-snapshot <dir>', "Compare each grammar's evaluated grammar, per layer, with the snapshots in a directory")
			.action(
				async (opts: { record?: string; check?: string; rev?: string; except?: readonly string[]; snapshot?: string; checkSnapshot?: string }) => {
					const { outputGate: runOutputGate } = await import('@sittir/tools');
					const code = await runOutputGate(opts);
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
