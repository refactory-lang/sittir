/**
 * inspect/refs — dump every reference to a given symbol: who names it with a
 * field, and who refers to it without one.
 *
 * CLI:
 *   inspect-refs [--grammar <name>] [--symbol <name>] [--base]
 *
 * Options:
 *   --grammar      grammar name        (default: rust)
 *   --symbol       target symbol name  (default: _type_identifier)
 *   --base         use base grammar.js instead of overrides (where available)
 */

import { evaluateGrammar } from '../codegen-surface.ts';

export interface InspectRefsOptions {
	grammar: string;
	symbol: string;
	useBase: boolean;
}

export async function run(args: InspectRefsOptions): Promise<number> {
	const raw = await evaluateGrammar(args.grammar, { base: args.useBase });
	const refs = raw.references.filter((r) => r.to === args.symbol);

	process.stdout.write(`\n${refs.length} references to ${args.symbol}:\n`);

	const named = refs.filter((r) => r.fieldName !== undefined);
	const unnamed = refs.filter((r) => r.fieldName === undefined);
	process.stdout.write(`  named:   ${named.length}\n`);
	process.stdout.write(`  unnamed: ${unnamed.length}\n\n`);

	process.stdout.write('Named references (parent → fieldName):\n');
	for (const r of named) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : ''].filter(Boolean).join(' ');
		process.stdout.write(`  ${r.from} → field('${r.fieldName}')${flags ? ' ' + flags : ''}\n`);
	}

	process.stdout.write('\nUnnamed references (parent only):\n');
	for (const r of unnamed) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : ''].filter(Boolean).join(' ');
		process.stdout.write(`  ${r.from}${flags ? ' ' + flags : ''}\n`);
	}

	return 0;
}
