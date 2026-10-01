import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FormatRecord } from '@sittir/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const FIXTURES_DIR = resolve(repoRoot, 'tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(repoRoot, 'tests/format-roundtrip/format-corpus.json');

type Grammar = 'python' | 'rust' | 'typescript';

const NATIVE_ENGINE_PATH_BY_GRAMMAR = {
	python: 'rust/crates/sittir-python',
	rust: 'rust/crates/sittir-rust',
	typescript: 'rust/crates/sittir-typescript'
} as const;

export type NativeEngine = {
	parseAndRead(src: string): string;
	readUntypedNode(handle: number, childIndex: number): string;
	dispose(): void;
};

export type FormatCorpusEntry = {
	grammar: Grammar;
	fixture: string;
	formatCategory: string;
	expectedBackendCoverage: string;
};

export function loadFormatCorpusEntries(grammar: Grammar): FormatCorpusEntry[] {
	const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8')) as {
		fixtures: FormatCorpusEntry[];
	};

	return corpus.fixtures.filter((entry) => entry.grammar === grammar);
}

export function loadFixtureSource(fixture: string): string {
	return readFileSync(resolve(FIXTURES_DIR, fixture), 'utf-8');
}

export function tryLoadNativeEngine(grammar: Grammar): NativeEngine | null {
	try {
		const req = createRequire(import.meta.url);
		const mod = req(resolve(repoRoot, NATIVE_ENGINE_PATH_BY_GRAMMAR[grammar])) as {
			SittirEngine: new () => NativeEngine;
		};

		return new mod.SittirEngine();
	} catch {
		return null;
	}
}

export function parseNativeFixture(engine: NativeEngine, source: string): { untypedNode: object; format?: FormatRecord } {
	return JSON.parse(engine.parseAndRead(source)) as {
		untypedNode: object;
		format?: FormatRecord;
	};
}

export function diffPositions(a: string, b: string): { start: number; end: number } | null {
	let start = 0;
	while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++;
	if (start === Math.min(a.length, b.length) && a.length === b.length) return null;
	let endA = a.length - 1,
		endB = b.length - 1;
	while (endA > start && endB > start && a[endA] === b[endB]) {
		endA--;
		endB--;
	}
	return { start, end: Math.max(endA, endB) };
}
