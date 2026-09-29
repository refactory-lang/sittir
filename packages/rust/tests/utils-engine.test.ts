/**
 * Consumer-facing regression for explicit `withMethods(node, methodsEngine)`.
 */

import { describe, expect, it } from 'vitest';
import type { AnyNodeData, ByteRange, GrammarFacts } from '@sittir/types';
import { TSKindId } from '../src/types.ts';
import { withMethods, methodsEngine } from '../src/utils.ts';

describe('utils facade surface', () => {
	it('exports methodsEngine satisfying GrammarFacts', () => {
		expect(typeof methodsEngine.render).toBe('function');
		expect(typeof methodsEngine.toEdit).toBe('function');
		// shape satisfies the interface
		const _typed: GrammarFacts = methodsEngine;
		expect(_typed).toBeDefined();
	});

	it('attaches render/edit method handles through the exported methodsEngine', () => {
		const plain = { $type: TSKindId.Identifier, $source: 2 as const, $named: true, $text: 'main' };
		const node = withMethods(plain, methodsEngine);

		expect(typeof node.$render).toBe('function');
		expect(typeof node.$toEdit).toBe('function');
		expect(typeof node.$replace).toBe('function');
		expect(typeof node.$trivia).toBe('function');
	});

	it('$toEdit and $replace produce correct Edit objects (via mock engine)', () => {
		// Use a mock engine so this test does not depend on the native render boundary.
		const mockEngine = {
			render(n: AnyNodeData): string {
				return n.$text ?? '';
			},
			toEdit(
				n: AnyNodeData,
				startOrRange: number | ByteRange,
				endPos?: number
			): ReturnType<GrammarFacts['toEdit']> {
				const text = n.$text ?? '';
				const start = typeof startOrRange === 'number' ? startOrRange : startOrRange.start.index;
				const end = typeof startOrRange === 'number' ? (endPos ?? start) : startOrRange.end.index;
				return { startPos: start, endPos: end, insertedText: text };
			},
			trivia: methodsEngine.trivia
		} satisfies GrammarFacts;
		const node = withMethods(
			{ $type: TSKindId.Identifier, $source: 2 as const, $named: true, $text: 'main' },
			mockEngine
		);

		expect(node.$toEdit({ start: { index: 0 }, end: { index: 4 } })).toEqual({
			startPos: 0,
			endPos: 4,
			insertedText: 'main'
		});
		expect(node.$replace({ range: () => ({ start: { index: 1 }, end: { index: 3 } }) })).toEqual({
			startPos: 1,
			endPos: 3,
			insertedText: 'main'
		});
	});
});
