import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { GrammarName } from '../grammars.ts';
import { bindingsPath, VOCABULARY_DIR } from './facts.ts';

export const isVocabularySource = (file: string): boolean => file.endsWith('.ts');

export const vocabularySources = (vocabularyDir: string = VOCABULARY_DIR): readonly string[] =>
	readdirSync(vocabularyDir)
		.filter(isVocabularySource)
		.sort()
		.map((name) => join(vocabularyDir, name));

export function bindingsSourceHash(scmPath: string, vocabularyDir: string): string {
	const hash = createHash('sha256').update(readFileSync(scmPath));
	for (const path of vocabularySources(vocabularyDir)) hash.update(`\0${basename(path)}\0`).update(readFileSync(path));
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
