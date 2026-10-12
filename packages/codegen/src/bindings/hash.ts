import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import type { GrammarName } from '../grammars.ts';
import { bindingsPath, VOCABULARY_DIR } from './facts.ts';

export const isVocabularySource = (file: string): boolean => file.endsWith('.ts');

const vocabularyNames = (vocabularyDir: string): readonly string[] =>
	readdirSync(vocabularyDir, { recursive: true, encoding: 'utf8' })
		.filter(isVocabularySource)
		.map((name) => name.split(sep).join('/'))
		.sort();

export const vocabularySources = (vocabularyDir: string = VOCABULARY_DIR): readonly string[] => vocabularyNames(vocabularyDir).map((name) => join(vocabularyDir, name));

export function bindingsSourceHash(scmPath: string, vocabularyDir: string): string {
	const hash = createHash('sha256').update(readFileSync(scmPath));
	for (const name of vocabularyNames(vocabularyDir)) hash.update(`\0${name}\0`).update(readFileSync(join(vocabularyDir, name)));
	return hash.digest('hex');
}

export const grammarBindingsHash = (grammar: GrammarName): string => bindingsSourceHash(bindingsPath(grammar), VOCABULARY_DIR);

export const REGENERATE_BINDINGS_COMMAND = 'pnpm exec tsx packages/cli/src/cli.ts tool bindings-inventory --write';

export class StaleBindingsError extends Error {}

export function assertBindingsFresh(
	grammar: GrammarName,
	hash: string | undefined,
	scmPath: string = bindingsPath(grammar),
	vocabularyDir: string = VOCABULARY_DIR
): void {
	if (!existsSync(scmPath)) return;
	if (hash === undefined) throw new StaleBindingsError(`${grammar}: bindings.scm exists but no grammar.bindings.ts carries its grammar bindings; write it with \`${REGENERATE_BINDINGS_COMMAND}\``);
	if (hash !== bindingsSourceHash(scmPath, vocabularyDir)) {
		throw new StaleBindingsError(`${grammar}: grammar.bindings.ts is stale against bindings.scm and the vocabulary; regenerate it with \`${REGENERATE_BINDINGS_COMMAND}\``);
	}
}
