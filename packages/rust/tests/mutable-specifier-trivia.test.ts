import { describe, it, expect } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('trivia beside a keyword held as a presence slot survives a round trip', () => {
	for (const source of ['fn f() { let y = & /*c*/ mut x; }\n', 'fn f() { let y = &mut /*c*/ x; }\n', 'static /*d*/ mut X: u8 = 0;\n']) {
		it(`renders ${JSON.stringify(source)} byte-for-byte`, () => {
			expect(rs.parse(source).$render()).toBe(source);
		});
	}
});
