import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { Parser as TSParser } from 'web-tree-sitter';
import { loadWebTreeSitter } from '../engine-loader.ts';

const wasm = fileURLToPath(new URL('../../../rust/.sittir/parser.wasm', import.meta.url));

describe('loadWebTreeSitter — concurrent callers', () => {
	it('initializes the web-tree-sitter binding once, shared by callers already in flight', async () => {
		const init = vi.spyOn(TSParser, 'init');
		const [{ Parser, Language }] = await Promise.all([loadWebTreeSitter(), loadWebTreeSitter()]);
		expect(init).toHaveBeenCalledTimes(1);
		const lang = await Language.load(readFileSync(wasm));
		expect(() => new Parser().setLanguage(lang)).not.toThrow();
	});
});
