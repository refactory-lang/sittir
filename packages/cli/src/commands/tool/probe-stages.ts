import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { probeStages as runProbeStages } from '@sittir/tools';

export const probeStages: CommandModule = {
name: 'probe-stages',
describe: 'Dump a rule shape at every compiler phase',
register: (program) => {
withGrammar(program.command('probe-stages'))
.description('Dump a rule shape at every compiler phase')
.requiredOption('-k, --kind <kind>', 'Rule kind to probe')
.option('--no-overrides', 'Skip overrides.ts, use base grammar.js directly')
.option('--compact', 'Compact JSON output (no indent)')
.option('--skip-emit', 'Skip the emit phases (types + template)')
.option('--brief', 'Print only grammar, kind, and simplify fields')
.action(async (opts: {
grammar?: string;
kind: string;
noOverrides?: boolean;
compact?: boolean;
skipEmit?: boolean;
brief?: boolean;
}) => {
const code = await runProbeStages({
grammar: opts.grammar ?? 'rust',
kind: opts.kind,
noOverrides: opts.noOverrides ?? false,
compact: opts.compact ?? false,
skipEmit: opts.skipEmit ?? false,
brief: opts.brief ?? false
});
if (code !== 0) process.exitCode = code;
});
}
};
