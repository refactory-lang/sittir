import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { languageOf } from '../engine-loader.ts';

const wasm = fileURLToPath(new URL('../../../rust/.sittir/parser.wasm', import.meta.url));

describe('languageOf', () => {
	it('loads a digest again after a load of it failed', async () => {
		const digest = 'a digest whose first load fails';
		await expect(languageOf(new Uint8Array([0, 1, 2, 3]), digest)).rejects.toThrow();
		const { language } = await languageOf(new Uint8Array(readFileSync(wasm)), digest);
		expect(language.name).toBe('rust');
	});

	it('shares one load among callers of a digest', async () => {
		const bytes = new Uint8Array(readFileSync(wasm));
		const [first, second] = await Promise.all([languageOf(bytes), languageOf(bytes)]);
		expect(second.language).toBe(first.language);
	});
});
