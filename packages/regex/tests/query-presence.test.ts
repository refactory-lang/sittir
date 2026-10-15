import { expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(regex);

it('a boolean slot that routes by kind compares its presence', () => {
	const root = engine.parse('[^a][b]');
	const classes = () => root.$query().$descendants.ofType(engine.kinds.CharacterClass);
	expect([...classes().where((c) => c.negation.eq(true))]).toHaveLength(1);
	expect([...classes().where((c) => c.negation.eq(false))]).toHaveLength(1);
});
