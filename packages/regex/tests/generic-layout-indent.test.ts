import { describe, expect, it } from 'vitest';
import type { Engine, LanguageAPI } from '@sittir/types';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';

describe('the shared layout options on a grammar-independent engine', () => {
	it('are typed for every language, and a language that admits no indent unit refuses `layout.indent` when it renders', async () => {
		const engine = (await createEngine(regex)) as unknown as Engine<LanguageAPI>;
		const node = engine.parse('a');
		expect(engine.render(node).toString()).toBe('a');
		expect(() => engine.render(node, { layout: { indent: '  ' } }).toString()).toThrow(/unknown key layout\/indent/);
	});
});
