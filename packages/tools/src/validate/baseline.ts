export interface CheckBaselineOptions {
	collect: boolean;
	backend?: string;
	metrics?: boolean;
	base?: string;
	head?: string;
}

export async function run(opts: CheckBaselineOptions): Promise<number> {
	if (opts.collect) {
		const { collectBaseline, serialiseBaseline } = await import('../scripts/collect-baseline.ts');
		const baseline = await collectBaseline(opts.backend);
		process.stdout.write(serialiseBaseline(baseline));
		if (opts.metrics) {
			const metricsBackend: 'ts' | 'native' = opts.backend === 'native' ? 'native' : 'ts';
			const { dumpMetrics } = await import('@sittir/common');
			dumpMetrics(metricsBackend);
		}
		return 0;
	}
	const checkArgs: string[] = [];
	if (opts.base) checkArgs.push('--base', opts.base);
	if (opts.head) checkArgs.push('--head', opts.head);
	const { run: runCheck } = await import('../scripts/check-baseline-regression.ts');
	return runCheck(checkArgs);
}
