const CODEMOD_INLINE_PATH = '../../../../tests/acceptance/codemod-inline.ts';

export interface BenchCodemodOptions {
	corpus: string;
}

function ensureBenchmarkNodeEnv(): void {
	process.env.NODE_ENV ??= 'production';
}

async function loadRunCodemodOnDir(): Promise<(corpus: string) => Promise<readonly unknown[]>> {
	ensureBenchmarkNodeEnv();
	const mod: { runCodemodOnDir: (corpus: string) => Promise<readonly unknown[]> } = await import(
		new URL(CODEMOD_INLINE_PATH, import.meta.url).pathname
	);
	return mod.runCodemodOnDir;
}

export async function run(opts: BenchCodemodOptions): Promise<number> {
	ensureBenchmarkNodeEnv();
	const runCodemodOnDir = await loadRunCodemodOnDir();
	const start = Date.now();
	const results = await runCodemodOnDir(opts.corpus);
	const elapsed = Date.now() - start;
	process.stdout.write(`${elapsed} ${results.length}\n`);
	return 0;
}
