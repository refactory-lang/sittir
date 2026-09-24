import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { alias } from '../primitives/alias.ts';
import { variant } from '../primitives/variant.ts';
import { applyTransformForTest, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe('alias() on an existing unnamed alias', () => {
	it('promotes it to a named alias and keeps the content', () => {
		const member = { type: 'ALIAS', named: false, value: '"', content: P('[bc]?"') };
		const { result } = applyTransformForTest('string_literal', { type: 'SEQ', members: [member, S('x')] }, { 0: alias('string_open') });
		expect((result as { members: unknown[] }).members[0]).toMatchObject({ type: 'ALIAS', named: true, value: 'string_open', content: P('[bc]?"') });
	});
});

describe('a mint whose body lexes as one token is a subtype, not a hoisted group', () => {
	it('deposits a bare literal under the hidden name without a hoisted annotation', () => {
		const { result, deposits } = applyTransformForTest('_pattern', { type: 'CHOICE', members: [S('x'), S('_')] }, { 1: alias('wildcard_pattern') });
		expect(deposits.get('_wildcard_pattern')).toEqual(S('_'));
		expect((result as { members: unknown[] }).members[1]).toMatchObject({ type: 'ALIAS', named: true, value: 'wildcard_pattern' });
	});
	it('treats a token() body as one token too', () => {
		const tok = { type: 'TOKEN', content: { type: 'SEQ', members: [S('//'), P('.*')] } };
		const { deposits } = applyTransformForTest('line_comment', { type: 'SEQ', members: [S('#'), tok] }, { 1: alias('comment_text') });
		expect((deposits.get('_comment_text') as { annotations?: object }).annotations).toBeUndefined();
	});
	it('applies to a variant() mint of a literal arm', () => {
		const { deposits } = applyTransformForTest('range', { type: 'CHOICE', members: [{ type: 'SEQ', members: [S('a'), S('..')] }, S('..')] }, { 1: variant('bare') });
		expect((deposits.get('range_bare') as { annotations?: object }).annotations).toBeUndefined();
	});
	it('still stamps hoisted on a compound body', () => {
		const { deposits } = applyTransformForTest('p', { type: 'CHOICE', members: [{ type: 'SEQ', members: [S('a'), S('b')] }] }, { 0: alias('ab') });
		expect((deposits.get('_ab') as { annotations?: object }).annotations).toEqual({ hoisted: true });
	});
});
