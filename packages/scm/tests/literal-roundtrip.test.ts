import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import scm from '../src/index.ts';

const engine = await createEngine(scm);

describe('a parsed query renders the anchors the source wrote', () => {
	it.each([
		['an anchor after a grouped child', '((a) . (b))\n'],
		['an anchor before the children of a node', '(a . (b))\n'],
		['an anchor after the last child of a node', '(a (b) .)\n']
	])('%s', (_name, source) => {
		expect(engine.parse(source).$render()).toBe(source);
	});
});
