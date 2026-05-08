import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsEngine, type SittirEngineLike } from '@sittir/core/engine';
import { readTreeNode as readPythonTreeNode } from '@sittir/python';
import { readTreeNode as readRustTreeNode } from '@sittir/rust';
import { readTreeNode as readTypeScriptTreeNode } from '@sittir/typescript';
import type { FormatRecord } from '@sittir/types';

import {
	loadLanguageForGrammar,
	loadWebTreeSitter,
	loadKindIdFromName,
	treeHandle
} from '../../packages/codegen/src/validate/common.ts';

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

function toBoundaryFieldValue(value: unknown): BoundaryNodeValue {
	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => toBoundaryNodeData(item)) as BoundaryNodeValue;
	}

	return toBoundaryNodeData(value) as BoundaryNodeValue;
}

export function toBoundaryNodeData(nodeData: unknown): object {
	if (!nodeData || typeof nodeData !== 'object') {
		throw new TypeError('toBoundaryNodeData expects a NodeData object');
	}

	const node = nodeData as Record<string, unknown>;
	// Preserve numeric $type as-is (Phase D: TSKindId-based). Only stringify
	// when $type is already a string (hidden/synthetic kinds like "_suite").
	const rawType = node.$type;
	// $source MUST be numeric (0=ts, 1=sg, 2=factory) for napi boundary.
	// Coerce string values ('ts'/'sg'/'factory') to their numeric equivalents.
	const SOURCE_MAP: Record<string, number> = { ts: 0, sg: 1, factory: 2 };
	const rawSource = node.$source;
	const numericSource = typeof rawSource === 'string' ? (SOURCE_MAP[rawSource] ?? 0) : (rawSource ?? 0);
	const boundary: Record<string, BoundaryNodeValue> = {
		$type: typeof rawType === 'number' ? rawType : String(rawType),
		$source: numericSource as number,
		$named: Boolean(node.$named)
	};

	if (node.$fields && typeof node.$fields === 'object') {
		const fields = node.$fields as Record<string, unknown>;
		boundary.$fields = Object.fromEntries(
			Object.entries(fields).map(([name, value]) => [name, toBoundaryFieldValue(value)])
		);
	}

	if (Array.isArray(node.$children)) {
		boundary.$children = node.$children.map((child) => toBoundaryNodeData(child)) as BoundaryNodeValue;
	} else if (boundary.$fields) {
		// napi structs with Vec<T> $children fields cannot accept undefined —
		// ensure branch nodes always carry $children (empty array when absent).
		boundary.$children = [];
	}

	if (typeof node.$text === 'string') {
		boundary.$text = node.$text;
	}

	if (node.$span && typeof node.$span === 'object') {
		boundary.$span = cloneJsonValue(node.$span as BoundaryNodeValue);
	}

	if (typeof node.$nodeHandle === 'number') {
		boundary.$nodeHandle = node.$nodeHandle;
	}
	if (typeof node.$childIndex === 'number') {
		boundary.$childIndex = node.$childIndex;
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
	if (!obj || typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) return obj.map(toNativeTransport);

	const node = obj as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	// Copy metadata fields
	for (const [key, value] of Object.entries(node)) {
		if (key === '$fields') continue; // flatten below
		if (key === '$children') {
			result[key] = Array.isArray(value) ? value.map(toNativeTransport) : [];
		} else if (key === '$source') {
			// Coerce string $source to numeric for napi Source enum
			if (typeof value === 'string') {
				const SOURCE_MAP: Record<string, number> = {
					ts: 0,
					sg: 1,
					factory: 2
				};
				result[key] = SOURCE_MAP[value] ?? 0;
			} else {
				result[key] = value ?? 0;
			}
		} else {
			result[key] = value;
		}
	}

	// Flatten $fields into top-level (napi structs read fields at root)
	if (node.$fields && typeof node.$fields === 'object') {
		const fields = node.$fields as Record<string, unknown>;
		for (const [fk, fv] of Object.entries(fields)) {
			result[fk] = toNativeTransport(fv);
		}
	}

	// Ensure $children exists on branch nodes
	if ((node.$fields || node.$children) && !('$children' in result)) {
		result.$children = [];
	}

	return result;
}

export function renderNativeNodeData(engine: NativeEngine, nodeData: object): string {
	// Phase B: render() accepts a JS object directly (napi-native AnyTransport
	// decoded from the napi value). The old string-JSON path was removed.
	// Convert from readNode nested shape ($fields wrapper) to the flat transport
	// shape expected by napi structs, and ensure $source is numeric.
	return engine.render(toNativeTransport(nodeData) as object);
}

export function createTsRenderEngine(grammar: Grammar, format?: FormatRecord): SittirEngineLike {
	const templatesPath = resolve(repoRoot, 'packages', grammar, 'templates');
	return createJsEngine({ templatesPath, format });
}

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
