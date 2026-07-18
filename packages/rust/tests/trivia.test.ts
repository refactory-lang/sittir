/**
 * $trivia() integration tests — spec 023 Phase 3 (T010).
 */

import { describe, it, expect } from 'vitest';
import * as F from '../src/factories.js';
import type { LineComment } from '../src/types.js';

function makeFn(name: string) {
	return F.buildFunctionItem({
		name: F.buildIdentifier(name),
		parameters: F.buildParameters(),
		body: F.buildBlock()
	});
}

/** Build a `LineComment` trivia node from raw text. */
function makeComment(text: string): LineComment {
	return F.buildLineComment(F.buildLineCommentContent(text));
}

describe('$trivia() integration', () => {
	it('attaches leading trivia via rest args', () => {
		const comment = makeComment('// hello');
		const fn = makeFn('main');
		const result = fn.$trivia(comment);
		expect(result).toBe(fn);
		const td = (fn as Record<string, unknown>).$triviaData as {
			leading?: unknown[];
		};
		expect(td).toBeDefined();
		expect(td.leading).toHaveLength(1);
	});

	it('attaches trailing trivia via object form', () => {
		const comment = makeComment('// end');
		const fn = makeFn('main');
		fn.$trivia({ trailing: [comment] });
		const td = (fn as Record<string, unknown>).$triviaData as {
			trailing?: unknown[];
		};
		expect(td).toBeDefined();
		expect(td.trailing).toHaveLength(1);
	});

	it('last $trivia() call wins (overwrite)', () => {
		const c1 = makeComment('// first');
		const c2 = makeComment('// second');
		const fn = makeFn('main');
		fn.$trivia(c1).$trivia!(c2);
		const td = (fn as Record<string, unknown>).$triviaData as {
			leading?: unknown[];
		};
		expect(td.leading).toHaveLength(1);
	});

	it('$with rebuild drops trivia', () => {
		const comment = makeComment('// hello');
		const fn = makeFn('main');
		fn.$trivia(comment);
		expect((fn as Record<string, unknown>).$triviaData).toBeDefined();
		const rebuilt = fn.$with.name(F.buildIdentifier('other'));
		expect((rebuilt as Record<string, unknown>).$triviaData).toBeUndefined();
	});
});
