/**
 * T021 — Format roundtrip test for TypeScript grammar fixtures.
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, '../../tests/format-roundtrip/fixtures');
const CORPUS_PATH = resolve(__dirname, '../../specs/017-format-inference/format-corpus.json');

function tryLoadNativeEngine(): { parseAndRead(src: string): string } | null {
	try {
		const req = createRequire(import.meta.url);
		const repoRoot = resolve(__dirname, '../..');
		const mod = req(`${repoRoot}/rust/crates/sittir-typescript-napi`) as {
			SittirEngine: new () => { parseAndRead(src: string): string };
		};
		return new mod.SittirEngine();
	} catch {
		return null;
	}
}

describe('format-roundtrip typescript fixtures', () => {
	const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8')) as {
		fixtures: Array<{ grammar: string; fixture: string; formatCategory: string }>;
	};
	const tsFixtures = corpus.fixtures.filter((f) => f.grammar === 'typescript');

	for (const entry of tsFixtures) {
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
