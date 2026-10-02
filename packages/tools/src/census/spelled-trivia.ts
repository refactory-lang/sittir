import { readNodeModelFile } from '../validate/common.ts';

export interface SpelledTriviaForm {
	readonly kind: string;
	readonly opens: readonly string[];
	readonly closes: readonly string[];
}

export type SpelledTriviaTable = { readonly forms: readonly SpelledTriviaForm[] } | { readonly reason: string };

export interface SpelledTriviaModel {
	readonly spelledTrivia?: SpelledTriviaTable | null;
}

/**
 * The comment kinds a trivia position builds from text spelled in full, as
 * codegen stamped them on the node model: each kind with the fixed texts it
 * opens and closes with, in the order the text is matched, or the reason the
 * grammar has no such table.
 */
export function formatSpelledTrivia(grammar: string, model: SpelledTriviaModel): string {
	const table = model.spelledTrivia;
	if (table === undefined || table === null) return `${grammar}: no ir.comment\n`;
	if ('reason' in table) return `${grammar}: no table: ${table.reason}\n`;
	const spelling = (form: SpelledTriviaForm): string =>
		form.opens.flatMap((open) => form.closes.map((close) => `${JSON.stringify(open)}…${JSON.stringify(close)}`)).join(' | ');
	return [`${grammar}: ${table.forms.length} kinds`, ...table.forms.map((form) => `  ${form.kind}  ${spelling(form)}`)].join('\n') + '\n';
}

export interface SpelledTriviaOptions {
	readonly grammar: string;
}

export async function run(opts: SpelledTriviaOptions): Promise<number> {
	const raw = readNodeModelFile(opts.grammar);
	if (raw === undefined) {
		process.stderr.write(`spelled-trivia: no node-model.json5 for grammar '${opts.grammar}'\n`);
		return 1;
	}
	process.stdout.write(formatSpelledTrivia(opts.grammar, JSON.parse(raw) as SpelledTriviaModel));
	return 0;
}
