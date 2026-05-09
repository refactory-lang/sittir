/**
 * validate/diff — thin wrapper delegating to @sittir/codegen's diff-failures script.
 * Actual logic lives in packages/codegen/src/scripts/diff-failures.ts.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_DIFF_FAILURES = '../../../codegen/src/scripts/diff-failures.ts';

async function loadRun(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_DIFF_FAILURES);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	return (await loadRun())(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`diff-failures: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
