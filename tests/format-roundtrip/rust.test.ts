/**
 * Format roundtrip for the Rust fixtures: a parse that adopts each fixture's
 * style renders it in the fixture's indentation, and an edit with `$with` changes only the slot it replaces.
 */

import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import {
	loadFixtureSource,
	loadFormatCorpusEntries,
	firstIndent,
	renderDetachedFixture,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip rust fixtures', () => {
	const rustFixtures = loadFormatCorpusEntries('rust');

	for (const entry of rustFixtures) {
		it.todo(`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`);

		it(`${entry.fixture}: a parse that adopts its style renders a detached copy in its indentation`, () => {
			const engine = tryLoadNativeEngine('rust');
			if (!engine) return; // skip — native not built

			const source = loadFixtureSource(entry.fixture);
			expect(firstIndent(renderDetachedFixture(engine, source, true))).toBe(firstIndent(source));
			if (entry.formatCategory !== 'canonical') {
				expect(firstIndent(renderDetachedFixture(tryLoadNativeEngine('rust')!, source, false))).not.toBe(firstIndent(source));
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
