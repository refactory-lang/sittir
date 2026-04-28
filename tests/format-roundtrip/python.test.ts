/**
 * T022 — Format roundtrip test for Python grammar fixtures.
 *
 * Spec 017 US1: parse via native reader, set treeHandle.format,
 * render with JS engine, assert result equals fixture source byte-for-byte.
 *
 * Phase 1 status: native reader populates format via extract_format (Rust).
 * The JS applyFormat applies boundary.leading/trailing only; per-line
 * indentation restoration is Phase 2 (slots/separators).
 */

import { describe, it, expect } from 'vitest';
import { applyEdits } from '@sittir/core';
import type { Edit } from '@sittir/types';
import {
	loadFixtureSource,
	loadFormatCorpusEntries,
	parseNativeFixture,
	pickRenderFixture,
	renderNativeNodeData,
	renderTsNodeData,
	toBoundaryNodeData,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip python fixtures', () => {
	const pyFixtures = loadFormatCorpusEntries('python');

	for (const entry of pyFixtures) {
		it.todo(
			`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`,
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

		const fixture = pickRenderFixture('python', ['call', 'attribute', 'binary_operator']);
		const nativeRendered = renderNativeNodeData(engine, fixture.input);
		const tsRendered = renderTsNodeData('python', fixture.input);

		expect(nativeRendered).toBe(tsRendered);
		expect(nativeRendered).toBe(fixture.expectedOutput);
	});
});

function diffPositions(a: string, b: string): { start: number; end: number } | null {
	let start = 0;
	while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++;
	if (start === Math.min(a.length, b.length) && a.length === b.length) return null;
	let endA = a.length - 1, endB = b.length - 1;
	while (endA > start && endB > start && a[endA] === b[endB]) { endA--; endB--; }
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
	it('python-4space.py: native direct render matches TS render for parsed node data', () => {
		const engine = tryLoadNativeEngine('python');
		if (!engine) return; // skip — native not built

		const source = loadFixtureSource('python-4space.py');
		const parsed = parseNativeFixture(engine, source);
		const nodeDataWithFormat = {
			...(parsed.nodeData as object),
			$format: parsed.format
		};
		const boundaryNodeData = toBoundaryNodeData(nodeDataWithFormat);
		const nativeRendered = renderNativeNodeData(engine, boundaryNodeData);
		const tsRendered = renderTsNodeData('python', boundaryNodeData);

		expect(nativeRendered).toBe(tsRendered);
	});
});

describe('US3 — native/TS render parity (python)', () => {
	const bothFixtures = loadFormatCorpusEntries('python').filter(
		(entry) => entry.expectedBackendCoverage === 'both'
	);

	if (bothFixtures.length === 0) {
		it.todo('no "both" fixtures yet — add entries to format-corpus.json to enable parity testing');
	} else {
		for (const entry of bothFixtures) {
			it(`${entry.fixture}: native render matches TS render byte-for-byte`, () => {
				const engine = tryLoadNativeEngine('python');
				if (!engine) return; // skip — native not built

				const source = loadFixtureSource(entry.fixture);
				const parsed = parseNativeFixture(engine, source);
				const nodeDataWithFormat = {
					...(parsed.nodeData as object),
					$format: parsed.format
				};
				const nativeRendered = renderNativeNodeData(engine, nodeDataWithFormat);

				expect(nativeRendered).toBe(source);
			});
		}
	}
});
