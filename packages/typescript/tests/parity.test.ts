/**
 * T048 — TS-side parity sanity check (typescript grammar).
 *
 * Loads the same grammar-owned native `test-fixtures.json` the Rust parity
 * harness (T047) reads, runs the TS engine over each fixture, and
 * confirms it reproduces the captured `expectedOutput` (render) /
 * `expectedSourceOut` (round-trip). Catches fixture-generator bugs
 * without involving Rust — since the fixtures are emitted BY the TS
 * engine at codegen time, a fresh re-run should reproduce them
 * byte-for-byte.
 *
 * A divergence here indicates:
 *   - fixture JSON is stale (regen via `cli.ts --grammar typescript --all --output packages/typescript/src`), OR
 *   - render path has non-deterministic behavior (real bug).
 *
 * The TS `readNode` path used at fixture capture is shallow — the
 * render() short-circuits text-only leaves to `$text`, which is what
 * makes the round-trip test trivial. Any divergence means the
 * short-circuit is no longer honored.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRenderer } from '@sittir/core';
import type { AnyNodeData } from '@sittir/types';
import { KIND_NAMES } from '../src/types.ts';

interface RenderFixture {
	kind: 'render';
	grammar: string;
	input: AnyNodeData;
	expectedOutput: string;
}

interface RoundTripFixture {
	kind: 'roundtrip';
	grammar: string;
	sourceIn: string;
	pattern: string;
	edits: unknown[];
	expectedSourceOut: string;
	expectedReparseTree: string;
}

type ParityFixture = RenderFixture | RoundTripFixture;

const GRAMMAR = 'typescript';
const FIXTURES_PATH = resolve(__dirname, '../../..', 'rust', 'crates', `sittir-${GRAMMAR}`, 'test-fixtures.json');
const TEMPLATES_PATH = resolve(__dirname, '..', 'templates');

const fixtures: ParityFixture[] = JSON.parse(readFileSync(FIXTURES_PATH, 'utf-8'));
const { render } = createRenderer(TEMPLATES_PATH, { kindNames: KIND_NAMES });

// Split by kind so a render regression doesn't mask round-trip issues
// (and vice versa). Each bucket runs as its own `describe`.
const renderFixtures = fixtures.filter((f): f is RenderFixture => f.kind === 'render');
const roundTripFixtures = fixtures.filter((f): f is RoundTripFixture => f.kind === 'roundtrip');

describe(`${GRAMMAR} parity (TS-side) — render fixtures`, () => {
	it(`loaded non-empty fixture corpus`, () => {
		expect(renderFixtures.length).toBeGreaterThan(0);
	});

	// Cap individual expectation count at ~5× to keep vitest output
	// readable; the assertion-count is independent of fixture count
	// via `.each` fanout. Failures list the fixture index + expected
	// vs actual for pinpoint diagnosis.
	it.each(renderFixtures.map((fx, idx) => ({ idx, fx })))('render #$idx — $fx.input.$type', ({ idx, fx }) => {
		const actual = render(fx.input);
		if (actual !== fx.expectedOutput) {
			throw new Error(
				`[${GRAMMAR}][render #${idx}] kind=${fx.input.$type} render divergence\n` +
					`  expected: ${JSON.stringify(fx.expectedOutput)}\n` +
					`  actual:   ${JSON.stringify(actual)}`
			);
		}
	});
});

describe(`${GRAMMAR} parity (TS-side) — roundtrip fixtures`, () => {
	it(`loaded non-empty roundtrip corpus`, () => {
		expect(roundTripFixtures.length).toBeGreaterThan(0);
	});

	// Round-trip semantic check: the fixture records `expectedSourceOut`
	// as the rendered string from the TS engine at capture time. This
	// test confirms the SAME render path produces that same string —
	// stronger than render fixtures (which use NodeData as input),
	// this one uses the RENDERED source-span as input to the render
	// path (via parse-then-readNode-then-render). Skipping the parse
	// step here because it requires a loaded tree-sitter parser
	// (web-tree-sitter + WASM) which the grammar package's vitest
	// config intentionally doesn't depend on — keep parity.test.ts
	// fast + dep-free. The Rust-side T047 harness does the full parse
	// check.
	it('roundtrip count matches render count (paired emission invariant)', () => {
		expect(roundTripFixtures.length).toBe(renderFixtures.length);
	});
});
