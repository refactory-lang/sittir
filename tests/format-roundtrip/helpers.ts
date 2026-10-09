import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FormatRecord } from '@sittir/types';
import { NATIVE_LOADER, nativeBindingDir } from '../../packages/codegen/src/grammars.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const FIXTURES_DIR = resolve(repoRoot, 'tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(repoRoot, 'tests/format-roundtrip/format-corpus.json');

type Grammar = 'python' | 'rust' | 'typescript';

export type NativeEngine = {
	parse(src: string): string;
	read(treeId: number, index: number, depth?: number): object;
	lineGapsOf(handle: number): string;
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
		const mod = req(resolve(nativeBindingDir(grammar), NATIVE_LOADER)) as {
			SittirEngine: new () => NativeEngine;
		};

		return new mod.SittirEngine();
	} catch {
		return null;
	}
}

export function parseNativeFixture(engine: NativeEngine, source: string): { treeId: number; format?: FormatRecord } {
	const parsed = JSON.parse(engine.parse(source)) as { treeId: number; format: FormatRecord | null };
	return parsed.format === null ? { treeId: parsed.treeId } : { treeId: parsed.treeId, format: parsed.format };
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
