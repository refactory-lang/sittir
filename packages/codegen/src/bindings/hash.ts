import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import type { GrammarName } from '../grammars.ts';
import { bindingsPath, VOCABULARY_DIR } from './facts.ts';

export function bindingsSourceHash(scmPath: string, vocabularyDir: string): string {
	const hash = createHash('sha256').update(readFileSync(scmPath));
	const names = readdirSync(vocabularyDir, { recursive: true, encoding: 'utf8' })
		.filter((f) => f.endsWith('.ts'))
		.map((f) => f.split(sep).join('/'))
		.sort();
	for (const name of names) {
		hash.update(`\0${name}\0`).update(readFileSync(join(vocabularyDir, name)));
	}
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
	if (hash === undefined) throw new StaleBindingsError(`${grammar}: bindings.scm exists but no grammar.bindings.ts carries its overlay; write it with \`${REGENERATE_BINDINGS_COMMAND}\``);
	if (hash !== bindingsSourceHash(scmPath, vocabularyDir)) {
		throw new StaleBindingsError(`${grammar}: grammar.bindings.ts is stale against bindings.scm and the vocabulary; regenerate it with \`${REGENERATE_BINDINGS_COMMAND}\``);
	}
}
