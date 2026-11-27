import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './grammars.ts';

export const CORPUS_ROOT = join(REPO_ROOT, 'packages/codegen/fixtures');

export function corpusDir(grammar: string): string {
	return join(CORPUS_ROOT, grammar);
}

export function upstreamCorpusDir(grammar: string): string {
	return join(corpusDir(grammar), 'upstream');
}

export function localCorpusPath(grammar: string): string {
	return join(corpusDir(grammar), 'local.txt');
}

export function corpusSourcePath(grammar: string): string {
	return join(upstreamCorpusDir(grammar), 'SOURCE.json');
}

export interface CorpusEntry {
	name: string;
	source: string;
}

const CORPUS_HEADER =
	/^(={3,})([^=\r\n][^\r\n]*)?\r?\n((?:(?:[^=\r\n]|\s+:)[^\r\n]*\r?\n)+)===+([^=\r\n][^\r\n]*)?\r?\n/gm;
const CORPUS_DIVIDER = /^(-{3,})([^-\r\n][^\r\n]*)?\r?\n/gm;

export function parseCorpus(content: string, grammar?: string): CorpusEntry[] {
	const headers = [...content.matchAll(CORPUS_HEADER)];
	const firstSuffix = headers[0]?.[2];
	const tests = headers.filter((h) => h[2] === firstSuffix && h[4] === firstSuffix);
	const entries: CorpusEntry[] = [];
	tests.forEach((header, index) => {
		const bodyStart = header.index + header[0].length;
		const bodyEnd = tests[index + 1]?.index ?? content.length;
		const body = content.slice(bodyStart, bodyEnd);
		const divider = [...body.matchAll(CORPUS_DIVIDER)]
			.filter((d) => d[2] === firstSuffix)
			.reduce<RegExpExecArray | RegExpMatchArray | undefined>(
				(best, d) => (best === undefined || d[1]!.length >= best[1]!.length ? d : best),
				undefined
			);
		if (divider === undefined) return;
		const [nameLine = '', ...markers] = header[3]!.split(/\r?\n/).filter((line) => line.length > 0);
		const attributes = markers.map((line) => line.trim().match(/^:([a-z-]+)(?:\((.+?)\))?$/)).filter((m) => m !== null);
		const declaredLanguage = attributes.find((m) => m[1] === 'language')?.[2];
		if (grammar !== undefined && declaredLanguage !== undefined && declaredLanguage !== grammar) return;
		const expected = body.slice(divider.index! + divider[0].length);
		if (attributes.some((m) => m[1] === 'error') || /\((ERROR|MISSING)\b/.test(expected)) return;
		let source = body.slice(0, divider.index);
		if (source.endsWith('\n')) source = source.slice(0, -1);
		if (source.endsWith('\r')) source = source.slice(0, -1);
		if (source.trim().length === 0) return;
		entries.push({ name: nameLine.trim(), source });
	});
	return entries;
}

export function loadCorpusEntries(grammar: string): CorpusEntry[] {
	const upstreamDir = upstreamCorpusDir(grammar);
	const files = existsSync(upstreamDir)
		? readdirSync(upstreamDir)
				.filter((f) => f.endsWith('.txt'))
				.sort()
				.map((f) => join(upstreamDir, f))
		: [];
	const local = localCorpusPath(grammar);
	if (existsSync(local)) files.push(local);
	const entries = files.flatMap((file) => parseCorpus(readFileSync(file, 'utf-8'), grammar));
	if (entries.length === 0) {
		throw new Error(
			`corpus: grammar '${grammar}' has no corpus entries under ${corpusDir(grammar)}; run \`sittir tool fetch-corpus --grammar ${grammar}\``
		);
	}
	return entries;
}
