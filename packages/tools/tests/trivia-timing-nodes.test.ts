import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../../python/src/index.ts';
import { loadSlotAccessorOf, wrappedNodesOf } from '../src/validate/common.ts';

const py = await createEngine(python);

describe('the trivia timing walk', () => {
	// A repeated slot is read by its plural accessor (`decorated_definition`'s
	// `_decorator` by `decorators`), so its nodes are reached as wrapped nodes.
	it('times only wrapped nodes, each with a trivia reader', async () => {
		const nodes = wrappedNodesOf(py.parse('@a\n@b\ndef f(): pass\n', { depth: Infinity }), await loadSlotAccessorOf('python'));
		expect(nodes.length).toBeGreaterThan(0);
		expect(nodes.filter((node) => typeof (node.$trivia as { readonly leading?: unknown } | undefined)?.leading !== 'function')).toEqual([]);
	});
});
