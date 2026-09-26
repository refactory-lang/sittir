import { describe, it, expect } from 'vitest';
import { numberSignature } from '../interior.ts';

const anchored = (source: string): RegExp => new RegExp(`^(?:${source})$`, 'u');

describe('numberSignature: the shape of a leaf guard pattern', () => {
	it.each([
		['a decimal run', '[0-9][0-9_]*', 'decimal'],
		['a decimal run with digit groups', '\\d(_?\\d)*', 'decimal'],
		['a hex literal with its prefix', '0x[0-9a-fA-F_]+', 'hex'],
		['a hex literal with a spelled prefix', '0[xX][\\da-fA-F](_?[\\da-fA-F])*', 'hex'],
		['an octal literal', '0[oO][0-7](_?[0-7])*', 'octal'],
		['a binary literal', '0[bB][0-1](_?[0-1])*', 'binary'],
		['a float with a point', '\\d+\\.\\d*(?:[eE][+-]?\\d+)?', 'float'],
		['a float with a leading point', '\\.\\d+', 'float'],
		['a scientific float', '\\d+[eE][+-]?\\d+', 'float']
	])('%s is %s', (_label, source, expected) => {
		expect(numberSignature(anchored(source))).toBe(expected);
	});

	it.each([
		['an identifier', '[a-zA-Z_]\\w*'],
		['a run of string content', '[^"\\\\]+'],
		['a pattern that matches the empty string', '\\d*']
	])('%s has no numeric signature', (_label, source) => {
		expect(numberSignature(anchored(source))).toBeUndefined();
	});
});
