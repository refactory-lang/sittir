import { describe, expect, it } from 'vitest';
import { fieldContentsOf, judgeFields } from '../../__tests__/helpers/reauthored-fields.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const field = (name: string, content: object, id = name) => ({ type: 'FIELD', name, content, id });
const judge = (upstream: unknown, kept: unknown) => judgeFields(fieldContentsOf(upstream), fieldContentsOf(kept));

describe('the reauthored-field guard', () => {
	it('reads a new field over the same content as a rename', () => {
		const verdict = judge(field('argument', sym('expression')), field('item', { ...sym('expression'), id: 'x' }, 'other'));
		expect(verdict).toEqual({ renamed: ['argument -> item'], dropped: [] });
	});

	it('reports a field that is gone with nothing over its content', () => {
		expect(judge(field('argument', sym('expression')), sym('expression')).dropped).toEqual(['argument']);
	});

	it('does not pair a dropped field with an unrelated field over other content', () => {
		const verdict = judge(field('argument', sym('expression')), field('item', sym('identifier')));
		expect(verdict.dropped).toEqual(['argument']);
	});

	it('does not read a field the upstream rule already had as the replacement', () => {
		const upstream = { type: 'SEQ', members: [field('a', sym('x')), field('b', sym('x'))] };
		expect(judge(upstream, field('b', sym('x'))).dropped).toEqual(['a']);
	});
});
