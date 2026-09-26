// A token-interior slot whose capture is empty holds the empty string, not
// an absent value: `#!` with nothing after it still has its `content` slot.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

describe('empty token-interior slot', () => {
	const source = '#!\nfn main() {}';

	it('reads an empty shebang content as the empty string', () => {
		const shebang = createEngine().parse(source).shebang();
		expect(shebang?.content()).toBe('');
	});
});
