/**
 * $trivia() integration tests — spec 023 Phase 3 (T010).
 */

import { describe, it, expect } from 'vitest';
import * as F from '../src/factories.js';

function makeFn(name: string) {
	return F.functionItem({
		name: F.identifier(name),
		parameters: F.parameters(),
		body: F.block(),
	});
}

describe('$trivia() integration', () => {
	it('attaches leading trivia via rest args', () => {
		const comment = F.lineCommentContent('// hello');
		const fn = makeFn('main');
		const result = fn.$trivia(comment);
		expect(result).toBe(fn);
		const td = (fn as Record<string, unknown>).$triviaData as {
			leading?: unknown[];
		};
		expect(td).toBeDefined();
		expect(td.leading).toHaveLength(1);
		expect((td.leading![0] as Record<string, unknown>).$text).toBe('// hello');
	});

	it('attaches trailing trivia via object form', () => {
		const comment = F.lineCommentContent('// end');
		const fn = makeFn('main');
		fn.$trivia({ trailing: [comment] });
		const td = (fn as Record<string, unknown>).$triviaData as {
			trailing?: unknown[];
		};
		expect(td).toBeDefined();
		expect(td.trailing).toHaveLength(1);
		expect((td.trailing![0] as Record<string, unknown>).$text).toBe('// end');
	});

	it('last $trivia() call wins (overwrite)', () => {
		const c1 = F.lineCommentContent('// first');
		const c2 = F.lineCommentContent('// second');
		const fn = makeFn('main');
		fn.$trivia(c1).$trivia!(c2);
		const td = (fn as Record<string, unknown>).$triviaData as {
			leading?: unknown[];
		};
		expect(td.leading).toHaveLength(1);
		expect((td.leading![0] as Record<string, unknown>).$text).toBe('// second');
	});

	it('$with rebuild drops trivia', () => {
		const comment = F.lineCommentContent('// hello');
		const fn = makeFn('main');
		fn.$trivia(comment);
		expect((fn as Record<string, unknown>).$triviaData).toBeDefined();
		const rebuilt = fn.$with.name(F.identifier('other'));
		expect((rebuilt as Record<string, unknown>).$triviaData).toBeUndefined();
	});
});
