/**
 * Consumer-facing regression for the utils facade: the grammar's trivia facts.
 */

import { describe, expect, it } from 'vitest';
import type { TriviaFacts } from '@sittir/types';
import { TSKindId } from '../src/types.ts';
import { triviaFacts } from '../src/utils.ts';

describe('utils facade surface', () => {
	it('exports trivia facts satisfying TriviaFacts', () => {
		const _typed: TriviaFacts = triviaFacts;
		expect(_typed.kinds.has('line_comment')).toBe(true);
		expect(_typed.kindName(TSKindId.Identifier)).toBe('identifier');
	});
});
