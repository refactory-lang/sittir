/**
 * Real-grammar regression coverage for Task 4's separatedList wrap
 * capture (`_leading_sep`/`_trailing_sep`) — the `wrap-separated-list-emit`
 * unit tests only assert the EMITTED SOURCE contains the expected calls;
 * this exercises the actual generated `wrapObjectTypeContentComma` against
 * a real parse, locking in the span-comparison mechanism's runtime
 * correctness (see `emitSeparatedListWrap`'s doc comment, codegen/src/emitters/wrap.ts).
 */
import { describe, expect, it } from 'vitest';
import { probeTrace } from '../../src/probe/kind.ts';

describe('separatedList wrap capture — real typescript grammar integration', () => {
	it('captures a present trailing comma with no leading comma', async () => {
		const trace = await probeTrace('typescript', 'type T = { a: string, b: number, };', {
			kind: 'object_type_content_comma',
			engine: 'native'
		});

		expect(trace.trace.native?.deep?.nodeData).toMatchObject({
			_leading_sep: false,
			_trailing_sep: true
		});
	});

	it('captures no trailing comma when the source has none', async () => {
		const trace = await probeTrace('typescript', 'type T = { a: string, b: number };', {
			kind: 'object_type_content_comma',
			engine: 'native'
		});

		expect(trace.trace.native?.deep?.nodeData).toMatchObject({
			_leading_sep: false,
			_trailing_sep: false
		});
	});
});
