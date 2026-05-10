/**
 * profile/bench — thin wrapper delegating to @sittir/codegen's bench-render script.
 * Actual logic lives in packages/codegen/src/scripts/bench-render.ts.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_BENCH = '../../../codegen/src/scripts/bench-render.ts';

async function loadRun(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_BENCH);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	return (await loadRun())(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`bench: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
