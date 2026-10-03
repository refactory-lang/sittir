/**
 * Format roundtrip for the Python fixtures: the native reader records each
 * fixture's inferred format, and an edit with `$with` changes only the slot it replaces.
 */

import { describe, it, expect } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '@sittir/python';
import {
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
			} else {
				expect(parsed.format).toBeUndefined();
			}
		});
	}
});

describe('US2 — edit isolation (python)', () => {
	it('python-4space.py: rename find_user → lookup_user changes only the name', async () => {
		const engine = await createEngine(python);
		const source = loadFixtureSource('python-4space.py');
		const named = engine
			.parse(source)
			.statements()
			.find((statement) => engine.is.functionDefinition(statement) && engine.render(statement.name()).toString() === 'find_user');
		expect(named).toBeDefined();
		if (named === undefined || !engine.is.functionDefinition(named)) return;
		const edited = named.$with.name(engine.build.identifier('lookup_user'));
		expect(edited.$render()).toBe(named.$render().replace('find_user', 'lookup_user'));
	});

	it('python-4space.py: rename find_user through the root\'s $with changes only the name\'s bytes', async () => {
		const engine = await createEngine(python);
		const source = loadFixtureSource('python-4space.py');
		const root = engine.parse(source);
		const statements = [...root.statements()];
		const index = statements.findIndex(
			(statement) => engine.is.functionDefinition(statement) && engine.render(statement.name()).toString() === 'find_user'
		);
		const named = statements[index];
		if (named === undefined || !engine.is.functionDefinition(named)) throw new Error('expected find_user');
		const at = source.indexOf('def find_user(') + 'def '.length;
		expect(source.indexOf('def find_user(', at)).toBe(-1);
		const expected = `${source.slice(0, at)}lookup_user${source.slice(at + 'find_user'.length)}`;
		statements[index] = named.$with.name(engine.build.identifier('lookup_user'));
		expect(root.$with.statements(...statements).$render()).toBe(expected);
	});
});
