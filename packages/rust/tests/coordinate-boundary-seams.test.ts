import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { edited } from '../../common/tests/support/edited-render.ts';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('an untouched node in an edited one meets its neighbours as its template renders it', () => {
	it.each([
		['a!(\'lifetime)\n', "('lifetime)"],
		['a!(* a *);\na!(\'lifetime)\ndefault!(a);\n', "('lifetime)"]
	])('keeps a lifetime quote tight to its name in %j', (source, text) => {
		const { root, node } = edited(rs, source, text);
		expect(rs.render(node as never).toString()).toBe(text);
		expect(rs.render(root as never).toString()).toBe(source);
	});
});
