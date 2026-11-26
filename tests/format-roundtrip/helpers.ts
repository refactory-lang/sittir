import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nativeEngineOf, type NativeEngineLike, type NativeModuleLike } from '@sittir/common/engine';
import { NATIVE_LOADER, nativeBindingDir } from '../../packages/codegen/src/grammars.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const FIXTURES_DIR = resolve(repoRoot, 'tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(repoRoot, 'tests/format-roundtrip/format-corpus.json');

type Grammar = 'python' | 'rust' | 'typescript';

export type NativeEngine = NativeEngineLike<object>;

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
		return nativeEngineOf(req(resolve(nativeBindingDir(grammar), NATIVE_LOADER)) as NativeModuleLike<object>);
	} catch {
		return null;
	}
}

const COORDINATES = new Set(['$treeHandle', '$handle', '$parentHandle', '$layout', '$_layout', '$span']);

function detached(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(detached);
	if (node === null || typeof node !== 'object') return node;
	return Object.fromEntries(Object.entries(node).filter(([key]) => !COORDINATES.has(key)).map(([key, value]) => [key, detached(value)]));
}

export function parseNativeFixture(engine: NativeEngine, source: string, adoptStyle = false): { treeId: number } {
	const { treeId } = JSON.parse(engine.parse(source, { adoptStyle })) as { treeId: number };
	return { treeId };
}

export function renderDetachedFixture(engine: NativeEngine, source: string, adoptStyle: boolean): string {
	const { treeId } = parseNativeFixture(engine, source, adoptStyle);
	return engine.render(detached(engine.read(treeId, 0, Infinity)) as never);
}

export function firstIndent(text: string): string | undefined {
	return text.split('\n').find((line) => /^\s+\S/.test(line))?.match(/^\s+/)?.[0];
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
