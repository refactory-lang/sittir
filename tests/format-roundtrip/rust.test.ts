/**
 * Format roundtrip for the Rust fixtures: the native reader records each
 * fixture's inferred format, and an edit with `$with` changes only the slot it replaces.
 */

import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import {
	loadFixtureSource,
	loadFormatCorpusEntries,
	parseNativeFixture,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip rust fixtures', () => {
	const rustFixtures = loadFormatCorpusEntries('rust');

	for (const entry of rustFixtures) {
		it.todo(`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`);

		it(`${entry.fixture}: extract_format populates treeHandle.format`, () => {
			const engine = tryLoadNativeEngine('rust');
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

describe('US2 — edit isolation (rust)', () => {
	it('rust-tab-indent.rs: rename greet → welcome changes only the name', async () => {
		const engine = await createEngine(rust);
		const source = loadFixtureSource('rust-tab-indent.rs');
		const named = engine
			.parse(source)
			.statements()
			.find((statement) => engine.is.functionItem(statement) && engine.render(statement.name()).toString() === 'greet');
		expect(named).toBeDefined();
		if (named === undefined || !engine.is.functionItem(named)) return;
		const edited = named.$with.name(engine.build.identifier('welcome'));
		expect(edited.$render()).toBe(named.$render().replace('greet', 'welcome'));
	});
});
