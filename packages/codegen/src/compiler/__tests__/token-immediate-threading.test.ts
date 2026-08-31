/**
 * Lexical facts of a `token(...)` / `token.immediate(...)` wrapper live on
 * the leaf that replaces it once normalize's `token`/`tokenImmediate`
 * builders consume the wrapper, and `AssembledLeaf`'s `immediate` /
 * `tokenized` getters read those stamps — never a wrapper node, which no
 * longer exists at assemble.
 */

import { FIELD, REPEAT, STRING, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { deriveSlots, isTerminalValue, AssembledToken } from '../model/node-map.ts';
import { flatten } from '../flatten.ts';
import type { Rule, StringRule } from '../../types/rule.ts';

describe('token wrapper lexical facts', () => {
	it('stamps tokenized+immediate on the leaf when wrapper-deletion consumes token.immediate', () => {
		// Grammar shape: field('x', token.immediate('foo'))
		const rule: Rule<'link'> = {
			type: FIELD,
			name: 'x',
			content: {
				type: TOKEN,
				immediate: true,
				content: { type: STRING, value: 'foo' }
			}
		};
		const leaf = flatten(rule) as { type: string; value?: string; tokenized?: boolean; immediate?: boolean };
		expect(leaf.type).toBe(STRING);
		expect(leaf.value).toBe('foo');
		expect(leaf.tokenized).toBe(true);
		expect(leaf.immediate).toBe(true);
	});

	it('stamps only tokenized when wrapper-deletion consumes a plain token()', () => {
		// Grammar shape: field('x', token('foo')) — lexer hint, not adjacency.
		const rule: Rule<'link'> = {
			type: FIELD,
			name: 'x',
			content: {
				type: TOKEN,
				immediate: false,
				content: { type: STRING, value: 'foo' }
			}
		};
		const leaf = flatten(rule) as { tokenized?: boolean; immediate?: boolean };
		expect(leaf.tokenized).toBe(true);
		expect(leaf.immediate).toBeUndefined();
	});

	it('leaves bare string terminals untagged', () => {
		// Grammar shape: field('x', repeat('foo')) — no token wrapper at all.
		const rule: Rule<'link'> = {
			type: FIELD,
			name: 'x',
			content: { type: REPEAT, content: { type: STRING, value: 'foo' } }
		};
		const slots = deriveSlots(flatten(rule));
		const terminal = slots.find((s) => s.name === 'x')!.values.find(isTerminalValue);
		expect(terminal!.immediate).toBeUndefined();
		expect(terminal!.tokenized).toBeUndefined();
	});

	it('AssembledToken reads immediate/tokenized off the leaf the tokenImmediate builder stamped', () => {
		// Post-link shape of `token.immediate('!')`: the wrapper is consumed
		// and its facts live on the literal it wrapped.
		const stamped: StringRule = { type: STRING, value: '!', tokenized: true, immediate: true };
		const tok = new AssembledToken('_inner_marker', stamped);
		expect(tok.immediate).toBe(true);
		expect(tok.tokenized).toBe(true);
		expect(tok.text).toBe('!');
	});

	it('AssembledToken returns immediate=false when rule is plain StringRule', () => {
		const strRule: StringRule = { type: STRING, value: 'pub' };
		const tok = new AssembledToken('_kw_pub', strRule);
		expect(tok.immediate).toBe(false);
		expect(tok.tokenized).toBe(false);
		expect(tok.text).toBe('pub');
	});
});
