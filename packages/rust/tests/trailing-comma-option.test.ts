import { describe, it, expect } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('the trailing comma after the last match arm is an optional-field spelling', () => {
	it('a parsed match keeps the spelling it was written with', () => {
		for (const source of ['fn f() { match x { 1 => a, _ => b } }\n', 'fn f() { match x { 1 => a, _ => b, } }\n'])
			expect(rs.parse(source).$render()).toBe(source);
	});

	it('the render option chooses the comma and defaults to none', () => {
		expect(rs.build.lastMatchArm({ pattern: '_', value: 'b' }).$render()).toBe('_ => b');
		expect(rs.build.lastMatchArm({ pattern: '_', value: 'b' }, { trailingComma: rs.kinds.Comma }).$render()).toBe('_ => b,');
		expect(rs.build.lastMatchArm({ pattern: '_', value: 'b' }, { trailingComma: null }).$render()).toBe('_ => b');
	});
});
