import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const b = rs.build;

describe('a kind id among a loose list slot’s items', () => {
	it('resolves a token kind the slot does not store as an id', () => {
		expect(b.delimTokenTreeParen(b.identifier('a'), rs.kinds.Comma, b.identifier('b')).$render()).toBe('(a, b)');
	});

	it('keeps a kind id the slot stores', () => {
		expect(b.delimTokenTreeParen(rs.kinds.Dollar, b.identifier('x')).$render()).toMatch(/^\(\$ ?x\)$/);
	});
});

describe('a kind id given to a loose mixed scalar slot', () => {
	const arm = (value: unknown) =>
		b.matchArmWithComma({ pattern: b.matchPattern({ pattern: b.identifier('x') }), value: value as never }).$render();

	it('keeps a kind id the slot stores', () => {
		expect(arm(rs.kinds.Self)).toBe('x => self,');
	});

	it('reads any other number as a numeric value', () => {
		expect(arm(rs.kinds.Comma)).toBe(`x => ${rs.kinds.Comma},`);
	});
});
