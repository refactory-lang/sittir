import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammars } from '../../framework/options.ts';

export const fetchCorpus: CommandModule = {
	name: 'fetch-corpus',
	describe: "Fetch a grammar's upstream test corpus at the version its package depends on",
	register: (program) => {
		withGrammars(defineCommand(program, fetchCorpus))
			.option('--all', 'Fetch every grammar on disk')
			.option('--update', 'Refetch even when the installed upstream version differs from the recorded one')
			.action(async (opts: { grammar?: string[]; all?: boolean; update?: boolean }) => {
				const { allGrammars } = await import('@sittir/codegen/grammars');
				const { fetchUpstreamCorpus } = await import('@sittir/tools');
				const grammars = opts.all ? allGrammars() : (opts.grammar ?? []);
				if (grammars.length === 0) throw new Error('fetch-corpus: pass --grammar <name> or --all');
				for (const grammar of grammars) {
					const source = await fetchUpstreamCorpus({ grammar, update: opts.update });
					process.stdout.write(
						`${grammar}: ${source.files.length} file(s) from ${source.repository}@${source.ref} (${source.commit})\n`
					);
				}
			});
	}
};
