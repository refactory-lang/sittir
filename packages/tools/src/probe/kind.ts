/**
 * probe/kind — thin wrapper delegating to @sittir/codegen's probe-kind script.
 * Actual probe logic lives in packages/codegen/src/scripts/probe-kind.ts.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_PROBE_KIND = '../../../codegen/src/scripts/probe-kind.ts';

async function loadRun(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_PROBE_KIND);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	return (await loadRun())(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`probe-kind: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
