/**
 * T021 — Format roundtrip test for TypeScript grammar fixtures.
 *
 * Spec 017 US1: parse via native reader, then render through engine surfaces
 * on both paths so parity comes from engine-owned format state rather than
 * helper-level post-processing.
 *
 * Phase 1 status: native reader populates inferred format via extract_format
 * (Rust). The JS render engine still replays only boundary.leading/trailing;
 * per-line indentation restoration remains Phase 2 (slots/separators).
 */

import { describe, it, expect } from 'vitest';
import { applyEdits } from '@sittir/common';
import type { Edit } from '@sittir/types';
import {
	loadFixtureSource,
	loadFormatCorpusEntries,
	parseNativeFixture,
	pickRenderFixture,
	createTsRenderEngine,
	renderNativeNodeData,
	renderTsNodeData,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip typescript fixtures', () => {
	const tsFixtures = loadFormatCorpusEntries('typescript');

	for (const entry of tsFixtures) {
		it.todo(`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`);

		it(`${entry.fixture}: extract_format populates treeHandle.format`, () => {
			const engine = tryLoadNativeEngine('typescript');
			if (!engine) return; // skip — native not built

			const source = loadFixtureSource(entry.fixture);
			const parsed = parseNativeFixture(engine, source);

			if (entry.formatCategory !== 'canonical') {
				expect(parsed.format).toBeDefined();
				expect(parsed.format).toHaveProperty('boundary');
			}
		});
	}
});

// Skipped: JS render engine removed (Track 1 cleanup) — this spec-017 US1 JS-vs-native parity check has no comparison baseline until a new SittirEngineLike adapter exists.
describe.skip('US1 — borrowed Askama parity (typescript)', () => {
	it('generated class_declaration render fixture matches the TS renderer', () => {
		const engine = tryLoadNativeEngine('typescript');
		if (!engine) return; // skip — native not built

		const fixture = pickRenderFixture('typescript', ['class_declaration', 'function_signature', 'ambient_declaration']);
		const tsEngine = createTsRenderEngine('typescript');
		const nativeRendered = renderNativeNodeData(engine, fixture.input);
		const tsRendered = renderTsNodeData(tsEngine, fixture.input);

		expect(nativeRendered).toBe(tsRendered);
		expect(nativeRendered).toBe(fixture.expectedOutput);
	});
});

function diffPositions(a: string, b: string): { start: number; end: number } | null {
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

describe('US2 — edit isolation (typescript)', () => {
	it('typescript-4space.ts: rename createUser → buildUser is isolated to the edited byte range', () => {
		const source = loadFixtureSource('typescript-4space.ts');
		const original = 'createUser';
		const replacement = 'buildUser';
		const startPos = source.indexOf(original);
		expect(startPos).toBeGreaterThan(-1);
		const endPos = startPos + original.length;
		const edit: Edit = { startPos, endPos, insertedText: replacement };
		const result = applyEdits(source, [edit]);
		const diff = diffPositions(source, result.source);
		expect(diff).not.toBeNull();
		expect(diff!.start).toBeGreaterThanOrEqual(edit.startPos);
		expect(diff!.end).toBeLessThan(edit.startPos + edit.insertedText.length);
	});
});

// Skipped: JS render engine removed (Track 1 cleanup) — this spec-017 US1 JS-vs-native parity check has no comparison baseline until a new SittirEngineLike adapter exists.
describe.skip('US2 — direct render parity (typescript)', () => {
	it('typescript-4space.ts: native direct render matches TS render for parsed node data', async () => {
		const engine = tryLoadNativeEngine('typescript');
		if (!engine) return; // skip — native not built

		const source = loadFixtureSource('typescript-4space.ts');
		const parsed = parseNativeFixture(engine, source);
		const boundaryNodeData = parsed.nodeData;
		const tsEngine = createTsRenderEngine('typescript', parsed.format);
		const nativeRendered = renderNativeNodeData(engine, boundaryNodeData);
		const tsRendered = renderTsNodeData(tsEngine, boundaryNodeData);

		expect(nativeRendered).toBe(tsRendered);
	});
});

// Skipped: JS render engine removed (Track 1 cleanup) — this spec-017 US1 JS-vs-native parity check has no comparison baseline until a new SittirEngineLike adapter exists.
describe.skip('US3 — native/TS render parity (typescript)', () => {
	const bothFixtures = loadFormatCorpusEntries('typescript').filter(
		(entry) => entry.expectedBackendCoverage === 'both'
	);

	if (bothFixtures.length === 0) {
		it.todo('no "both" fixtures yet — add entries to format-corpus.json to enable parity testing');
	} else {
		for (const entry of bothFixtures) {
			it(`${entry.fixture}: native render matches TS render byte-for-byte`, async () => {
				const engine = tryLoadNativeEngine('typescript');
				if (!engine) return; // skip — native not built

				const source = loadFixtureSource(entry.fixture);
				const parsed = parseNativeFixture(engine, source);
				const boundaryNodeData = parsed.nodeData;
				const tsEngine = createTsRenderEngine('typescript', parsed.format);
				const nativeRendered = renderNativeNodeData(engine, boundaryNodeData);
				const tsRendered = renderTsNodeData(tsEngine, boundaryNodeData);

				expect(nativeRendered).toBe(tsRendered);
				expect(tsRendered).not.toHaveLength(0);
			});
		}
	}
});
