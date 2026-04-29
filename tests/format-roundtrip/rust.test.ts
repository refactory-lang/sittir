/**
 * T020 — Format roundtrip test for Rust grammar fixtures.
 *
 * Spec 017 US1: parse via native reader, set treeHandle.format,
 * render with JS engine, assert result equals fixture source byte-for-byte.
 *
 * Phase 1 status: native reader populates format via extract_format (Rust).
 * The JS applyFormat applies boundary.leading/trailing only; per-line
 * indentation restoration is Phase 2 (slots/separators).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { applyEdits } from '@sittir/core';
import type { Edit } from '@sittir/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, '../../tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(__dirname, '../../specs/017-format-inference/format-corpus.json');

function tryLoadNativeEngine(): { parseAndRead(src: string): string; render(nodeJson: string): string } | null {
	try {
		const req = createRequire(import.meta.url);
		const repoRoot = resolve(__dirname, '../..');
		const mod = req(`${repoRoot}/rust/crates/sittir-rust-napi`) as {
			SittirEngine: new () => { parseAndRead(src: string): string };
		};
		return new mod.SittirEngine();
	} catch {
		return null;
	}
}

describe('format-roundtrip rust fixtures', () => {
	const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8')) as {
		fixtures: Array<{ grammar: string; fixture: string; formatCategory: string }>;
	};
	const rustFixtures = corpus.fixtures.filter((f) => f.grammar === 'rust');

	for (const entry of rustFixtures) {
		it.todo(
			`${entry.fixture}: byte-equal roundtrip (Phase 2 — needs slot/indent restoration)`,
		);

		it(`${entry.fixture}: extract_format populates treeHandle.format`, () => {
			const engine = tryLoadNativeEngine();
			if (!engine) return; // skip — native not built

			const source = readFileSync(resolve(FIXTURES_DIR, entry.fixture), 'utf-8');
			const result = JSON.parse(engine.parseAndRead(source)) as {
				nodeData: unknown;
				format?: unknown;
			};

			if (entry.formatCategory !== 'canonical') {
				expect(result.format).toBeDefined();
				expect(result.format).toHaveProperty('boundary');
			}
		});
	}
});

function diffPositions(a: string, b: string): { start: number; end: number } | null {
	let start = 0;
	while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++;
	if (start === Math.min(a.length, b.length) && a.length === b.length) return null;
	let endA = a.length - 1, endB = b.length - 1;
	while (endA > start && endB > start && a[endA] === b[endB]) { endA--; endB--; }
	return { start, end: Math.max(endA, endB) };
}

describe('US2 — edit isolation (rust)', () => {
	it('rust-tab-indent.rs: rename greet → welcome is isolated to the edited byte range', () => {
		const source = readFileSync(resolve(FIXTURES_DIR, 'rust-tab-indent.rs'), 'utf-8');
		const original = 'greet';
		const replacement = 'welcome';
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

describe('US3 — native/TS render parity (rust)', () => {
	const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8')) as {
		fixtures: Array<{ grammar: string; fixture: string; formatCategory: string; expectedBackendCoverage: string }>;
	};
	const bothFixtures = corpus.fixtures.filter(
		(f) => f.grammar === 'rust' && f.expectedBackendCoverage === 'both',
	);

	if (bothFixtures.length === 0) {
		it.todo('no "both" fixtures yet — add entries to format-corpus.json to enable parity testing');
	} else {
		for (const entry of bothFixtures) {
			it(`${entry.fixture}: native render matches TS render byte-for-byte`, () => {
				const engine = tryLoadNativeEngine();
				if (!engine) return; // skip — native not built

				const source = readFileSync(resolve(FIXTURES_DIR, entry.fixture), 'utf-8');
				const parsed = JSON.parse(engine.parseAndRead(source)) as {
					nodeData: unknown;
					format?: unknown;
				};

				const nodeDataWithFormat = { ...(parsed.nodeData as object), '$format': parsed.format };
				const nativeRendered = engine.render(JSON.stringify(nodeDataWithFormat));

				expect(nativeRendered).toBe(source);
			});
		}
	}
});
