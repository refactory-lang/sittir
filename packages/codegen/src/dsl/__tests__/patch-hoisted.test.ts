import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { field } from '../primitives/field.ts';
import { applyTransformForTest, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const hoistedGroup = (...members: unknown[]) => ({ type: 'SEQ', members, annotations: { hoisted: true } });
const annotationsOf = (rule: unknown) => (rule as { annotations?: Record<string, unknown> }).annotations;

describe('a patch through a hoisted group', () => {
	it('keeps hoisted when it only wraps a member in a field', () => {
		const { result } = applyTransformForTest('_group', hoistedGroup(S('pub'), sym('scope')), { 1: field('scope_path') });
		expect(annotationsOf(result)).toEqual({ hoisted: true });
	});

	it('keeps hoisted when it only renames a field', () => {
		const { result } = applyTransformForTest('_group', hoistedGroup(S('pub'), { type: 'FIELD', name: 'left', content: sym('scope') }), { 1: field('scope_path') });
		expect(annotationsOf(result)).toEqual({ hoisted: true });
	});

	it('keeps hoisted when it changes a member', () => {
		const { result } = applyTransformForTest('_group', hoistedGroup(S('pub'), sym('scope')), { 1: sym('path') });
		expect(annotationsOf(result)).toEqual({ hoisted: true });
	});
});
