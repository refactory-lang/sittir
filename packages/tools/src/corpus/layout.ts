import { join } from 'node:path';
import { REPO_ROOT } from '@sittir/codegen/grammars';

export const CORPUS_ROOT = join(REPO_ROOT, 'packages/codegen/fixtures');

export function upstreamCorpusDir(grammar: string): string {
	return join(CORPUS_ROOT, grammar, 'upstream');
}

export function localCorpusPath(grammar: string): string {
	return join(CORPUS_ROOT, grammar, 'local.txt');
}

export function corpusSourcePath(grammar: string): string {
	return join(upstreamCorpusDir(grammar), 'SOURCE.json');
}
