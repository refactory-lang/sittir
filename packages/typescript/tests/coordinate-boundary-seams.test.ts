import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { edited } from '../../common/tests/support/edited-render.ts';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('an untouched list in an edited node meets its braces as its template renders it', () => {
	it.each([
		['export type { UserType }\n', '{ UserType }'],
		['export type { UserType } from "./User.js";\n', '{ UserType } from "./User.js"'],
		["export type { A, B, C as D } from 'mymodule';\n", "{ A, B, C as D } from 'mymodule'"],
		["export type { A } from './z.ts';\n", "{ A } from './z.ts'"]
	])('keeps the spaces inside the braces of %j', (source, text) => {
		expect(ts.render(edited(ts, source, text).node as never).toString()).toBe(text);
	});
});
