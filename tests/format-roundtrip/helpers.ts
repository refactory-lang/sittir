import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer } from '@sittir/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const FIXTURES_DIR = resolve(repoRoot, 'tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(repoRoot, 'specs/017-format-inference/format-corpus.json');

type Grammar = 'python' | 'rust' | 'typescript';

const NATIVE_ENGINE_PATH = {
	python: 'rust/crates/sittir-python-napi',
	rust: 'rust/crates/sittir-rust-napi',
	typescript: 'rust/crates/sittir-typescript-napi'
} as const;

export type NativeEngine = {
	parseAndRead(src: string): string;
	render(nodeJson: string): string;
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

export function tryLoadNativeEngine(grammar: Grammar): NativeEngine | null {
	try {
		const req = createRequire(import.meta.url);
		const mod = req(resolve(repoRoot, NATIVE_ENGINE_PATH[grammar])) as {
			SittirEngine: new () => NativeEngine;
		};

		return new mod.SittirEngine();
	} catch {
		return null;
	}
}

export function parseNativeFixture(
	engine: NativeEngine,
	source: string
): { nodeData: object; format?: unknown } {
	return JSON.parse(engine.parseAndRead(source)) as {
		nodeData: object;
		format?: unknown;
	};
}

type BoundaryNodeValue = null | boolean | number | string | BoundaryNodeValue[] | {
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
	const boundary: Record<string, BoundaryNodeValue> = {
		$type: String(node.$type),
		$source: String(node.$source),
		$named: Boolean(node.$named)
	};

	if (node.$fields && typeof node.$fields === 'object') {
		const fields = node.$fields as Record<string, unknown>;
		boundary.$fields = Object.fromEntries(
			Object.entries(fields).map(([name, value]) => [name, toBoundaryFieldValue(value)])
		);
	}

	if (Array.isArray(node.$children)) {
		boundary.$children = node.$children.map((child) =>
			toBoundaryNodeData(child)
		) as BoundaryNodeValue;
	}

	if (typeof node.$text === 'string') {
		boundary.$text = node.$text;
	}

	if (node.$span && typeof node.$span === 'object') {
		boundary.$span = cloneJsonValue(node.$span as BoundaryNodeValue);
	}

	if (typeof node.$nodeId === 'number') {
		boundary.$nodeId = node.$nodeId;
	}

	if (node.$format && typeof node.$format === 'object') {
		boundary.$format = cloneJsonValue(node.$format as BoundaryNodeValue);
	}

	return boundary;
}

export function renderNativeNodeData(engine: NativeEngine, nodeData: object): string {
	const nodeDataWithFormat = {
		...nodeData
	};

	return engine.render(JSON.stringify(nodeDataWithFormat));
}

export function renderTsNodeData(grammar: Grammar, nodeData: object): string {
	const templatesPath = resolve(repoRoot, 'packages', grammar, 'templates');
	const { render } = createRenderer(templatesPath);

	return render(nodeData as never);
}

export function loadRenderFixtures(grammar: Grammar): RenderFixture[] {
	const fixturesPath = resolve(
		repoRoot,
		'rust',
		'crates',
		`sittir-render-${grammar}`,
		'test-fixtures.json'
	);
	const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8')) as Array<
		RenderFixture | { kind: 'roundtrip' }
	>;

	return fixtures.filter((fixture): fixture is RenderFixture => fixture.kind === 'render');
}

export function pickRenderFixture(
	grammar: Grammar,
	preferredKinds: string[]
): RenderFixture {
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
