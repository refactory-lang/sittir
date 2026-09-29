// A token-interior slot whose capture is empty holds the empty string, not
// an absent value: `#!` with nothing after it still has its `content` slot.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe('empty token-interior slot', () => {
	const source = '#!\nfn main() {}';

	it('reads an empty shebang content as the empty string', async () => {
		const shebang = (await createEngine(rust)).parse(source).shebang();
		expect(shebang?.content()).toBe('');
	});
});
