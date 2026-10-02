/**
 * Consumer-facing regression for the utils facade: the grammar's trivia facts
 * and the node members, which act through the engine the node belongs to.
 */

import { describe, expect, it } from 'vitest';
import type { TriviaFacts } from '@sittir/types';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/types.ts';
import { triviaFacts } from '../src/utils.ts';

describe('utils facade surface', () => {
	it('exports trivia facts satisfying TriviaFacts', () => {
		const _typed: TriviaFacts = triviaFacts;
		expect(_typed.kinds.has('line_comment')).toBe(true);
		expect(_typed.kindName(TSKindId.Identifier)).toBe('identifier');
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
