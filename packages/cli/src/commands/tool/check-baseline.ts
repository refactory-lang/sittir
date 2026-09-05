import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { checkBaseline as runCheckBaseline } from '@sittir/tools';

export const checkBaseline: CommandModule = {
	name: 'check-baseline',
	describe: 'Check or collect parity baselines',
	register: (program) => {
		defineCommand(program, checkBaseline)
			.option('--collect', 'Run collect-baseline (collect fresh baseline to stdout)')
			.option('--metrics', 'Emit metrics file when SITTIR_METRICS=1 is set (collect mode only)')
			.option('--base <path>', 'Base baseline JSON path (check mode)')
			.option('--head <path>', 'Head baseline JSON path (check mode)')
			.action(
				async (opts: { collect?: boolean; metrics?: boolean; base?: string; head?: string }) => {
					const code = await runCheckBaseline({
						collect: opts.collect ?? false,
						metrics: opts.metrics ?? false,
						base: opts.base,
						head: opts.head
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
