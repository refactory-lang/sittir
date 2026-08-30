/**
 * $trivia() integration tests — spec 023 Phase 3 (T010).
 */

import { describe, it, expect } from 'vitest';
import * as F from '../src/factories/index.js';
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

/** The runtime's trivia storage key — `$trivia()` mutates the node and
 *  stashes entries here; probed structurally because the key is
 *  deliberately not part of the public node type surface. */
type TriviaData = { leading?: unknown[]; trailing?: unknown[] };
function triviaDataOf(node: object): TriviaData | undefined {
	return (node as { $triviaData?: TriviaData }).$triviaData;
}

describe('$trivia() integration', () => {
	it('attaches leading trivia via rest args', () => {
		const comment = makeComment('// hello');
		const fn = makeFn('main');
		const result = fn.$trivia(comment);
		expect(result).toBe(fn);
		const td = triviaDataOf(fn);
		expect(td).toBeDefined();
		expect(td?.leading).toHaveLength(1);
	});

	it('attaches trailing trivia via object form', () => {
		const comment = makeComment('// end');
		const fn = makeFn('main');
		fn.$trivia({ trailing: [comment] });
		const td = triviaDataOf(fn);
		expect(td).toBeDefined();
		expect(td?.trailing).toHaveLength(1);
	});

	it('last $trivia() call wins (overwrite)', () => {
		const c1 = makeComment('// first');
		const c2 = makeComment('// second');
		const fn = makeFn('main');
		fn.$trivia(c1);
		fn.$trivia(c2);
		expect(triviaDataOf(fn)?.leading).toHaveLength(1);
	});

	it('$with rebuild drops trivia', () => {
		const comment = makeComment('// hello');
		const fn = makeFn('main');
		fn.$trivia(comment);
		expect(triviaDataOf(fn)).toBeDefined();
		const rebuilt = fn.$with.name(F.buildIdentifier('other'));
		expect(triviaDataOf(rebuilt)).toBeUndefined();
	});

	// `line_comment.jinja` renders `//{{ content }}` — content is the text
	// AFTER the `//` marker, unlike `makeComment`'s raw-`//`-prefixed text
	// above (whose callers never render, only assert `$triviaData` shape).
	function buildLineComment(afterSlashes: string): LineComment {
		return F.buildLineComment(F.buildLineCommentContent(afterSlashes));
	}

	// `$trivia()` mutates and returns the SAME node (asserted above), but its
	// declared return type is the type-erased AnyNodeData — so these render
	// cases keep the typed reference and call `$trivia` as the mutation it is.
	it('leading trivia renders before the node', () => {
		const fn = makeFn('main');
		fn.$trivia(buildLineComment(' hello'));
		expect(fn.$render()).toBe('// hello\nfn main(){  }');
	});

	it('trailing trivia renders after the node', () => {
		const fn = makeFn('main');
		fn.$trivia({ trailing: [buildLineComment(' bye')] });
		// A line comment is newline-terminated by the spacing model — the
		// final `\n` is part of the comment's own rendering, so a trailing
		// comment leaves the output newline-terminated.
		expect(fn.$render()).toBe('fn main(){  }\n// bye\n');
	});

	it('multiple leading and trailing entries render in order', () => {
		const fn = makeFn('main');
		fn.$trivia({
			leading: [buildLineComment(' top1'), buildLineComment(' top2')],
			trailing: [buildLineComment(' bottom')]
		});
		expect(fn.$render()).toBe('// top1\n// top2\nfn main(){  }\n// bottom\n');
	});
});
