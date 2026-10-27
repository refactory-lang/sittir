import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PACKAGES = new URL('../../', import.meta.url);
const TREES = ['codegen/src', 'common/src', 'tools/src', 'types/src'];

function naming(name: RegExp): string[] {
	return TREES.flatMap((tree) =>
		readdirSync(new URL(`${tree}/`, PACKAGES), { recursive: true, encoding: 'utf8' })
			.filter((file) => file.endsWith('.ts'))
			.filter((file) => name.test(readFileSync(new URL(`${tree}/${file}`, PACKAGES), 'utf8')))
			.map((file) => `${tree}/${file}`)
	).sort();
}

describe('the writable chunk view', () => {
	it('is allocated only by the record writer', () => {
		expect(naming(/\bUint32Array\b/)).toEqual(['common/src/built-arena.ts']);
	});

	it('is named only by the record writer and the native typings that hand it chunks', () => {
		expect(naming(/\bWritableWords\b/)).toEqual(['common/src/built-arena.ts', 'common/src/engine.ts']);
	});
});
