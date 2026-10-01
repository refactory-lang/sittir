/**
 * Consumer-facing regression for the utils facade: the grammar's trivia facts
 * and the node methods a `withMethods` node carries, which act through the
 * engine the node belongs to.
 */

import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode, TriviaFacts } from '@sittir/types';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/types.ts';
import { triviaFacts, withMethods } from '../src/utils.ts';

describe('utils facade surface', () => {
	it('exports trivia facts satisfying TriviaFacts', () => {
		const _typed: TriviaFacts = triviaFacts;
		expect(_typed.kinds.has('line_comment')).toBe(true);
		expect(_typed.kindName(TSKindId.Identifier)).toBe('identifier');
	});

	it('attaches the method handles to a node made outside an engine, which cannot render', () => {
		const plain = { $type: TSKindId.Identifier, $source: 2 as const, $named: true, $text: 'main' };
		const node = withMethods(plain as unknown as AnyUntypedNode) as unknown as {
			$render(): string;
			$toEdit(start: number, end: number): unknown;
			$replace(target: unknown): unknown;
		};

		expect(typeof node.$render).toBe('function');
		expect(typeof node.$toEdit).toBe('function');
		expect(typeof node.$replace).toBe('function');
		expect(() => node.$render()).toThrow(/node has no engine/);
	});

	it('$toEdit and $replace produce correct Edit objects through the node engine', async () => {
		const engine = await createEngine(rust);
		const node = engine.build.identifier('main');

		expect(node.$toEdit({ start: { index: 0 }, end: { index: 4 } } as never)).toEqual({
			startPos: 0,
			endPos: 4,
			insertedText: 'main'
		});
		expect(node.$replace({ range: () => ({ start: { index: 1 }, end: { index: 3 } }) } as never)).toEqual({
			startPos: 1,
			endPos: 3,
			insertedText: 'main'
		});
	});
});
