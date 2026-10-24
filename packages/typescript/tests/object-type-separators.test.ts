import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('object type and interface members separated by a line break', () => {
	it.each([
		'type T = {\n  a: number\n  b: number\n}\n',
		'interface X {\n  hook: string\n  g(): void;\n}\n',
		'type S = {\n length: number\n (string): string\n [index:string] : number\n}\n',
		'type T = { a: number, b: string; c: 1 }\n'
	])('parses and renders %j without an error', (source) => {
		const tree = ts.parse(source);
		expect(JSON.stringify(tree)).not.toContain('ERROR');
		expect(tree.$render!().toString()).toBe(source);
	});

	it('reads a line break between members as the automatic semicolon', () => {
		const tree = ts.parse('type T = {\n  a: number\n  b: number\n}\n');
		expect(JSON.stringify(tree)).toContain('automatic_semicolon');
	});
});
