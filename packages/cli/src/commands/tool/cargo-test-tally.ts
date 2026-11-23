import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const cargoTestTally: CommandModule = {
	name: 'cargo-test-tally',
	describe: 'Tally passed, failed and ignored tests in a cargo test log, per binary and in total, for one storage',
	register: (program) => {
		defineCommand(program, cargoTestTally)
			.requiredOption('--log <path>', 'Cargo test output (stdout and stderr together)')
			.requiredOption('--storage <label>', 'The storage the run used, such as object or arena (labels the output only)')
			.option('--json', 'Machine-readable JSON output')
			.action(async (opts: { log: string; storage: string; json?: boolean }) => {
				const { cargoTestTally: runCargoTestTally } = await import('@sittir/tools');
				const code = await runCargoTestTally({ log: opts.log, storage: opts.storage, json: opts.json ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
