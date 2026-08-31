/**
 * Real-grammar regression coverage for the separator-as-slot design
 * (`AssembledSeparatedList`) against `object_type_content` — the ONE real
 * grammar kind with a genuinely nonterminal separator (`choice(',', ';')`),
 * merged from the former `object_type_content_comma`/`_semi` split by the
 * plan's Task 7. Three concerns:
 *
 * - Wire capture (the `_delimiter` bitflag: leading = 1, trailing = 2): the
 *   `wrap-separated-list-emit` unit tests only assert the EMITTED SOURCE
 *   contains the expected calls; this exercises the actual generated
 *   `wrapObjectTypeContent` against a real parse, locking in the
 *   span-comparison mechanism's runtime correctness (see
 *   `emitSeparatedListWrap`'s doc comment, codegen/src/emitters/wrap.ts).
 * - Render (Task 5/7's `emitListSlot`/`buildSeparatorKindMatchLines`): a
 *   real production bug here (a hardcoded space silently dropping every
 *   separator) was found and fixed only by Task 7's manual `probe-kind`
 *   verification, with no committed regression test at the time — these
 *   `rendered` assertions close that gap.
 * - Reconstruction (`emitSeparatedListFrom`): `from()` on an already-wrapped
 *   separatedList node used to silently reset `_separator`/
 *   `_delimiter` to the factory's defaults (comma, no
 *   flanks) instead of preserving the original instance's own facts —
 *   found via external code review, fixed by threading them through as
 *   factory options on the self-NodeData-unwrap path.
 */
import { describe, expect, it } from 'vitest';
import { probeTrace } from '../../src/probe/kind.ts';
import { coerceToObjectTypeContent } from '../../../typescript/src/factories/coerce.ts';

describe('separatedList wrap capture — real typescript grammar integration', () => {
	it('captures a present trailing comma with no leading comma', async () => {
		const trace = await probeTrace('typescript', 'type T = { a: string, b: number, };', {
			kind: 'object_type_content',
			engine: 'native'
		});

		expect(trace.trace.native?.deep?.nodeData).toMatchObject({
			_delimiter: 2
		});
	});

	it('captures no trailing comma when the source has none', async () => {
		const trace = await probeTrace('typescript', 'type T = { a: string, b: number };', {
			kind: 'object_type_content',
			engine: 'native'
		});

		expect(trace.trace.native?.deep?.nodeData).toMatchObject({
			_delimiter: 0
		});
	});
});

describe('separatedList render — real typescript grammar integration (nonterminal separator)', () => {
	it('preserves a trailing semicolon separator on round-trip', async () => {
		const trace = await probeTrace('typescript', 'interface Foo { a: string; b: number; }', {
			kind: 'object_type_content',
			engine: 'native'
		});

		const rendered = trace.trace.native?.deep?.rendered ?? '';
		expect(rendered).toContain(';');
		expect(rendered).not.toContain(',');
	});

	it('preserves a comma separator on round-trip', async () => {
		const trace = await probeTrace('typescript', 'type Foo = { a: string, b: number };', {
			kind: 'object_type_content',
			engine: 'native'
		});

		const rendered = trace.trace.native?.deep?.rendered ?? '';
		expect(rendered).toContain(',');
		expect(rendered).not.toContain(';');
	});

	it('recovers from a mixed comma/semicolon separator without dropping content', async () => {
		const trace = await probeTrace('typescript', 'type Foo = { a, b; c };', {
			kind: 'object_type_content',
			engine: 'native'
		});

		const rendered = trace.trace.native?.deep?.rendered ?? '';
		expect(rendered).toContain('a');
		expect(rendered).toContain('b');
		expect(rendered).toContain('c');
	});
});

describe('separatedList from() reconstruction — preserves original separator facts', () => {
	it('preserves a trailing semicolon when reconstructing an already-wrapped node', async () => {
		const trace = await probeTrace('typescript', 'interface Foo { a: string; b: number; }', {
			kind: 'object_type_content',
			engine: 'native'
		});

		const wrapped = trace.trace.native?.deep?.nodeData as { _delimiter?: number; _separator?: number };
		expect(((wrapped._delimiter ?? 0) & 2) !== 0).toBe(true);
		expect(wrapped._separator).toBeDefined();

		const reconstructed = coerceToObjectTypeContent(wrapped as never);
		expect((((reconstructed as unknown as { _delimiter?: number })._delimiter ?? 0) & 2) !== 0).toBe(true);
		expect((reconstructed as unknown as { _separator: number })._separator).toBe(wrapped._separator);
		expect(reconstructed.$render!()).toContain(';');
		expect(reconstructed.$render!()).not.toContain(',');
	});
});
