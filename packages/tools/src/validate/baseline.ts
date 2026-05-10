/**
 * validate/baseline — dispatcher over two codegen scripts:
 *   --collect  → packages/codegen/src/scripts/collect-baseline.ts
 *   --check    → packages/codegen/src/scripts/check-baseline-regression.ts (default)
 *
 * The tool name is `check-baseline`; default mode is check.
 */
type ToolRunner = (argv: string[]) => Promise<number>;

const CODEGEN_COLLECT = '../../../codegen/src/scripts/collect-baseline.ts';
const CODEGEN_CHECK = '../../../codegen/src/scripts/check-baseline-regression.ts';

async function loadCollect(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_COLLECT);
	return mod.run;
}

async function loadCheck(): Promise<ToolRunner> {
	const mod: { run: ToolRunner } = await import(CODEGEN_CHECK);
	return mod.run;
}

export async function run(argv: string[]): Promise<number> {
	if (argv.includes('--collect')) {
		const rest = argv.filter((a) => a !== '--collect');
		return (await loadCollect())(rest);
	}
	// --check is the default; strip the flag if present
	const rest = argv.filter((a) => a !== '--check');
	return (await loadCheck())(rest);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`check-baseline: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
