import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engine = await sharedEngine(() => createEngine(language));

const hosted = (literal: string): string => `class C { char c = ${literal}; }\n`;

describe("a character literal is one token: ' Character ', where Character is one character or one escape", () => {
	it.each(["'a'", "'\\n'", "'\\x41'", "' '"])('reads %s', (literal) => {
		expect(engine.parse(hosted(literal)).$errors).toEqual([]);
	});

	it.each(["'a '", "'\\n '", "'\\x41 '", "'  '"])('refuses %s, white space before the closing quote', (literal) => {
		expect(engine.parse(hosted(literal)).$errors.length).toBeGreaterThan(0);
	});
});
