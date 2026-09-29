/**
 * Format roundtrip for the Python fixtures: the native reader records each
 * fixture's inferred format, and a text edit changes only its own byte range.
 */

import { describe, it, expect } from 'vitest';
import { applyEdits } from '@sittir/common';
import type { Edit } from '@sittir/types';
import {
	diffPositions,
	loadFixtureSource,
	loadFormatCorpusEntries,
	parseNativeFixture,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip python fixtures', () => {
	const pyFixtures = loadFormatCorpusEntries('python');

	for (const entry of pyFixtures) {
		it.todo(`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`);

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

