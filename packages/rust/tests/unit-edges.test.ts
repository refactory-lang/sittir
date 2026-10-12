import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('a unit a list seats takes the gap after it', () => {
	it('keeps the line break after an empty statement in a snapshot', () => {
		expect(rs.render(rs.parse(';\nfn f() {}\n').$snapshot()).toString()).toBe(';\nfn f() {}\n');
	});
});
