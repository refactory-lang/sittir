const CODEMOD_INLINE_PATH = '../../../../tests/acceptance/codemod-inline.ts';

async function loadRunCodemodOnDir(): Promise<(corpus: string) => Promise<readonly unknown[]>> {
	const mod: { runCodemodOnDir: (corpus: string) => Promise<readonly unknown[]> } = await import(
		new URL(CODEMOD_INLINE_PATH, import.meta.url).pathname
	);
	return mod.runCodemodOnDir;
}

function printUsage(): void {
	process.stdout.write('Usage: bench-codemod <corpus-dir>\n');
}

export async function run(argv: string[]): Promise<number> {
	const corpus = argv[0];
	if (corpus === '--help' || corpus === '-h') {
		printUsage();
		return 0;
	}
	if (corpus === undefined) {
		process.stderr.write('bench-codemod: missing corpus directory argument\n');
		return 2;
	}

	const runCodemodOnDir = await loadRunCodemodOnDir();
	const start = Date.now();
	const results = await runCodemodOnDir(corpus);
	const elapsed = Date.now() - start;
	process.stdout.write(`${elapsed} ${results.length}\n`);
	return 0;
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((error: unknown) => {
			process.stderr.write(`bench-codemod: ${(error as Error).stack ?? error}\n`);
			process.exit(1);
		});
}
