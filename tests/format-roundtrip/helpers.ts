import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SittirEngineLike } from '@sittir/core/engine';
import { readTreeNode as readPythonTreeNode } from '@sittir/python';
import { readTreeNode as readRustTreeNode } from '@sittir/rust';
import { readTreeNode as readTypeScriptTreeNode } from '@sittir/typescript';
import type { FormatRecord } from '@sittir/types';

import {
	loadLanguageForGrammar,
	loadWebTreeSitter,
	loadKindIdFromName,
	treeHandle
} from '../../packages/tools/src/validate/common.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const FIXTURES_DIR = resolve(repoRoot, 'tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(repoRoot, 'specs/017-format-inference/format-corpus.json');

type Grammar = 'python' | 'rust' | 'typescript';

const READ_TREE_NODE = {
	python: readPythonTreeNode,
	rust: readRustTreeNode,
	typescript: readTypeScriptTreeNode
} as const;

const NATIVE_ENGINE_PATH_BY_GRAMMAR = {
	python: 'rust/crates/sittir-python',
	rust: 'rust/crates/sittir-rust',
	typescript: 'rust/crates/sittir-typescript'
} as const;

export type NativeEngine = {
	parseAndRead(src: string): string;
	/** ADR-0017: readNode takes (handle, childIndex) instead of single nodeId. */
	readNode(handle: number, childIndex: number): string;
	// Phase B: render accepts a JS object directly (napi-native AnyTransport
	// decoded from the object). The old string-JSON path has been removed.
	render(transport: object): string;
	dispose(): void;
};

export type FormatCorpusEntry = {
	grammar: Grammar;
	fixture: string;
	formatCategory: string;
	expectedBackendCoverage: string;
};

export type RenderFixture = {
	grammar: Grammar;
	input: object;
	expectedOutput: string;
	kind: 'render';
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

export function tryLoadNativeEngine(grammar: Grammar, format?: FormatRecord): NativeEngine | null {
	try {
		const req = createRequire(import.meta.url);
		const mod = req(resolve(repoRoot, NATIVE_ENGINE_PATH_BY_GRAMMAR[grammar])) as {
			SittirEngine: new (options?: { format?: string }) => NativeEngine;
		};

		return new mod.SittirEngine(format ? { format: JSON.stringify(format) } : undefined);
	} catch {
		return null;
	}
}

export async function parseTsFixture(grammar: Grammar, source: string): Promise<object> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree) {
		throw new Error(`failed to parse ${grammar} fixture source`);
	}
	const kindIdFromName = await loadKindIdFromName(grammar);
	return READ_TREE_NODE[grammar](treeHandle(tree, source, kindIdFromName ?? undefined));
}

export function parseNativeFixture(engine: NativeEngine, source: string): { nodeData: object; format?: FormatRecord } {
	return JSON.parse(engine.parseAndRead(source)) as {
		nodeData: object;
		format?: FormatRecord;
	};
}

type BoundaryNodeValue =
	| null
	| boolean
	| number
	| string
	| BoundaryNodeValue[]
	| {
			[key: string]: BoundaryNodeValue;
	  };

function cloneJsonValue<T extends BoundaryNodeValue>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeBoundaryValue(value: unknown): BoundaryNodeValue {
	if (value === null) return null;
	if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((item) => normalizeBoundaryValue(item)) as BoundaryNodeValue;
	}
	if (typeof value !== 'object') {
		throw new TypeError(`Unsupported boundary value: ${typeof value}`);
	}
	return toBoundaryNodeData(value) as BoundaryNodeValue;
}

export function toBoundaryNodeData(nodeData: unknown): object {
	if (!nodeData || typeof nodeData !== 'object') {
		throw new TypeError('toBoundaryNodeData expects a NodeData object');
	}

	const node = nodeData as Record<string, unknown>;
	const SOURCE_MAP: Record<string, number> = { ts: 0, sg: 1, factory: 2 };
	const boundary: Record<string, BoundaryNodeValue> = {};
	for (const [key, value] of Object.entries(node)) {
		if (typeof value === 'function') continue;
		if (key === '$source') {
			boundary.$source = typeof value === 'string' ? (SOURCE_MAP[value] ?? 0) : ((value ?? 0) as number);
			continue;
		}
		if (key === '$children' && Array.isArray(value)) {
			boundary.$children = value.map((child) => normalizeBoundaryValue(child)) as BoundaryNodeValue;
			continue;
		}
		if (key === '$span' && value && typeof value === 'object') {
			boundary.$span = cloneJsonValue(value as BoundaryNodeValue);
			continue;
		}
		if (key === '$type') {
			boundary.$type = typeof value === 'number' ? value : String(value);
			continue;
		}
		boundary[key] = normalizeBoundaryValue(value);
	}
	return boundary;
}

/**
 * Recursively convert a readNode-shaped NodeData (nested `$fields`) into
 * the flat transport shape expected by the napi `#[napi(object)]` structs.
 *
 * Transform: `{ $type, $source, $fields: { a, b }, $children: [...] }`
 *         → `{ $type, $source, a, b, $children: [...] }`
 *
 * Also:
 * - Coerces `$source` to numeric (0/1/2) for the napi Source enum.
 * - Ensures branch nodes always carry `$children` (empty array when absent)
 *   because napi `Vec<T>` fields cannot accept undefined.
 */
function toNativeTransport(obj: unknown): unknown {
	return normalizeBoundaryValue(obj);
}

export function renderNativeNodeData(engine: NativeEngine, nodeData: object): string {
	// Native render accepts the generator-owned shape directly; normalize only
	// JSON-compatible values and numeric $source for test fixtures.
	return engine.render(toNativeTransport(nodeData) as object);
}

export function createTsRenderEngine(_grammar: Grammar, _format?: FormatRecord): SittirEngineLike {
	throw new Error(
		'createTsRenderEngine: the JS render engine was removed (Track 1 JS-engine-removal cleanup). ' +
			"This spec-017 US1 JS-vs-native parity comparison is no longer possible without a new SittirEngineLike adapter around @sittir/core's Nunjucks primitives (createRenderer). See tests/format-roundtrip/*.test.ts for the skipped call sites."
	);
}

// `.render()` returns `RenderHandle` under `SittirEngineLike`, not `string` — this
// return-type mismatch predates the JS-engine removal above and only applies to the
// now-skipped call sites (createTsRenderEngine always throws), so it's left as-is.
export function renderTsNodeData(engine: SittirEngineLike, nodeData: object): string {
	return engine.render(nodeData as never);
}

export function loadRenderFixtures(grammar: Grammar): RenderFixture[] {
	const fixturesPath = resolve(repoRoot, 'rust', 'crates', `sittir-${grammar}`, 'test-fixtures.json');
	const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8')) as Array<RenderFixture | { kind: 'roundtrip' }>;

	return fixtures.filter((fixture): fixture is RenderFixture => fixture.kind === 'render');
}

export function pickRenderFixture(grammar: Grammar, preferredKinds: string[]): RenderFixture {
	const fixtures = loadRenderFixtures(grammar);

	for (const kind of preferredKinds) {
		const match = fixtures.find((fixture) => {
			const input = fixture.input as { $type?: string };
			return input.$type === kind;
		});

		if (match) return match;
	}

	return fixtures[0];
}
