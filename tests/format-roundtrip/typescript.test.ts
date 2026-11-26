/**
 * Format roundtrip for the TypeScript fixtures: a parse that adopts each fixture's
 * style renders it in the fixture's indentation, and an edit with `$with` changes only the slot it replaces.
 */

import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';
import {
	loadFixtureSource,
	loadFormatCorpusEntries,
	firstIndent,
	renderDetachedFixture,
	tryLoadNativeEngine
} from './helpers.ts';

describe('format-roundtrip typescript fixtures', () => {
	const tsFixtures = loadFormatCorpusEntries('typescript');

	for (const entry of tsFixtures) {
		it.todo(`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`);

		it(`${entry.fixture}: a parse that adopts its style renders a detached copy in its indentation`, () => {
			const engine = tryLoadNativeEngine('typescript');
			if (!engine) return; // skip — native not built

			const source = loadFixtureSource(entry.fixture);
			expect(firstIndent(renderDetachedFixture(engine, source, true))).toBe(firstIndent(source));
			if (entry.formatCategory !== 'canonical') {
				expect(firstIndent(renderDetachedFixture(tryLoadNativeEngine('typescript')!, source, false))).not.toBe(firstIndent(source));
			}
		});
	}
});

describe('US2 — edit isolation (typescript)', () => {
	it('typescript-4space.ts: rename createUser → buildUser changes only the name', async () => {
		const engine = await createEngine(typescript);
		const source = loadFixtureSource('typescript-4space.ts');
		const named = engine
			.parse(source)
			.statements()
			.find((statement) => engine.is.functionDeclaration(statement) && engine.render(statement.name()).toString() === 'createUser');
		expect(named).toBeDefined();
		if (named === undefined || !engine.is.functionDeclaration(named)) return;
		const edited = named.$with.name(engine.build.identifier('buildUser'));
		// a rebuilt statement renders with a final line break the parsed one lacks
		expect(edited.$render().trimEnd()).toBe(named.$render().replace('createUser', 'buildUser'));
	});
});
