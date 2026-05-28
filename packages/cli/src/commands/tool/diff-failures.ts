import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { diffFailures as runDiffFailures } from '@sittir/tools';

export const diffFailures: CommandModule = {
name: 'diff-failures',
describe: 'Dump per-kind validator failures for a grammar',
register: (program) => {
withGrammar(program.command('diff-failures'))
.description('Dump per-kind validator failures for a grammar')
.argument('[which]', 'Which validators: all | from | rt | cov | factory', 'all')
.action(async (which: string, opts: { grammar?: string }) => {
const code = await runDiffFailures({
grammar: opts.grammar ?? 'rust',
which: which ?? 'all'
});
if (code !== 0) process.exitCode = code;
});
}
};
