/**
 * T022 — Format roundtrip test for Python grammar fixtures.
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
import { applyEdits } from '@sittir/core';
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

describe('format-roundtrip python fixtures', () => {
	const pyFixtures = loadFormatCorpusEntries('python');

	for (const entry of pyFixtures) {
		it.todo(
			`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`
		);

		it(`${entry.fixture}: extract_format populates treeHandle.format`, () => {
			const engine = tryLoadNativeEngine('python');
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

describe('US1 — borrowed Askama parity (python)', () => {
	it('generated call render fixture matches the TS renderer', () => {
		const engine = tryLoadNativeEngine('python');
		if (!engine) return; // skip — native not built

		const fixture = pickRenderFixture('python', [
			'call',
			'attribute',
			'binary_operator'
		]);
		const tsEngine = createTsRenderEngine('python');
		const nativeRendered = renderNativeNodeData(engine, fixture.input);
		const tsRendered = renderTsNodeData(tsEngine, fixture.input);

		expect(nativeRendered).toBe(tsRendered);
		expect(nativeRendered).toBe(fixture.expectedOutput);
	});
});

function diffPositions(
	a: string,
	b: string
): { start: number; end: number } | null {
	let start = 0;
	while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++;
	if (start === Math.min(a.length, b.length) && a.length === b.length)
		return null;
	let endA = a.length - 1,
		endB = b.length - 1;
	while (endA > start && endB > start && a[endA] === b[endB]) {
		endA--;
		endB--;
	}
	return { start, end: Math.max(endA, endB) };
}

describe('US2 — edit isolation (python)', () => {
	it('python-4space.py: rename find_user → lookup_user is isolated to the edited byte range', () => {
		const source = loadFixtureSource('python-4space.py');
		const original = 'find_user';
		const replacement = 'lookup_user';
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

describe('US2 — direct render parity (python)', () => {
	it('python-4space.py: native direct render matches TS render for parsed node data', async () => {
		const engine = tryLoadNativeEngine('python');
		if (!engine) return; // skip — native not built

		const source = loadFixtureSource('python-4space.py');
		const parsed = parseNativeFixture(engine, source);
		const boundaryNodeData = parsed.nodeData;
		const tsEngine = createTsRenderEngine('python', parsed.format);
		const nativeRendered = renderNativeNodeData(engine, boundaryNodeData);
		const tsRendered = renderTsNodeData(tsEngine, boundaryNodeData);

		expect(nativeRendered).toBe(tsRendered);
	});
});

describe('US3 — native/TS render parity (python)', () => {
	const bothFixtures = loadFormatCorpusEntries('python').filter(
		(entry) => entry.expectedBackendCoverage === 'both'
	);

	if (bothFixtures.length === 0) {
		it.todo(
			'no "both" fixtures yet — add entries to format-corpus.json to enable parity testing'
		);
	} else {
		for (const entry of bothFixtures) {
			it(`${entry.fixture}: native render matches TS render byte-for-byte`, async () => {
				const engine = tryLoadNativeEngine('python');
				if (!engine) return; // skip — native not built

				const source = loadFixtureSource(entry.fixture);
				const parsed = parseNativeFixture(engine, source);
				const nodeData = await parseTsFixture('python', source);
				const boundaryNodeData = toBoundaryNodeData(nodeData);
				const tsEngine = createTsRenderEngine('python', parsed.format);
				const nativeRendered = renderNativeNodeData(engine, boundaryNodeData);
				const tsRendered = renderTsNodeData(tsEngine, boundaryNodeData);

				expect(nativeRendered).toBe(tsRendered);
				expect(tsRendered).not.toHaveLength(0);
			});
		}
	}
});
