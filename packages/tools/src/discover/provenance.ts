/**
 * discover/provenance — thin wrapper delegating to @sittir/codegen's field-provenance script.
 * Actual logic lives in packages/codegen/src/scripts/field-provenance.ts.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_PROVENANCE = '../../../codegen/src/scripts/field-provenance.ts';

async function loadRun(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_PROVENANCE);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	return (await loadRun())(argv);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`provenance: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
