import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const source = 'fn a() {}\nfn b() {}';
const crlfSource = source.replaceAll('\n', '\r\n');

describe.each(['object', 'arena'] as const)('rendering a %s node through another engine', (nodeStorage) => {
	it.each([false, true])('uses the rendering engine defaults after parser disposal: %s', async (disposeParser) => {
		const parser = await createEngine(rust, { nodeStorage });
		const renderer = await createEngine(rust, { render: { layout: { newline: '\r\n' } } });
		try {
			const root = parser.parse(source);
			if (disposeParser) parser.dispose();
			expect(renderer.render(root).toString()).toBe(crlfSource);
			expect(renderer.render(root, { layout: { newline: '\n' } }).toString()).toBe(source);
		} finally {
			parser.dispose();
			renderer.dispose();
		}
	});
});
