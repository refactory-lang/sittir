/**
 * §H1 threading — verify TokenRule.immediate / TokenRule (any) metadata
 * is preserved from grammar rule into the slot-model TerminalValue and
 * onto AssembledToken instances.
 *
 * Distinct from the `modelType === 'token'` classification: an
 * AssembledToken can come from a plain `StringRule` OR a `TokenRule`.
 * The `.immediate` / `.tokenized` getters report the wrapper status of
 * the underlying rule, not the model classification.
 *
 * Documented limit (cleanup-rules §H1): this test exercises the
 * data-model threading. Render-template adjacency consumption
 * (walker emitting adjacent vs spaced based on the flag) is not yet
 * implemented — see the cleanup-rules §H1 note for what's still TODO.
 */

import { describe, it, expect } from 'vitest';
import {
	deriveSlots,
	isTerminalValue,
	AssembledToken
} from '../compiler/node-map.ts';
import type { Rule, TokenRule, StringRule } from '../compiler/rule.ts';

describe('§H1 — TokenRule metadata threading', () => {
	it('preserves immediate=true through deriveValuesForRule', () => {
		// Grammar shape: field('x', token.immediate('foo'))
		const rule: Rule = {
			type: 'field',
			name: 'x',
			content: {
				type: 'token',
				immediate: true,
				content: { type: 'string', value: 'foo' }
			}
		};
		const slots = deriveSlots(rule);
		const x = slots.find((s) => s.name === 'x');
		expect(x).toBeDefined();
		const terminal = x!.values.find(isTerminalValue);
		expect(terminal).toBeDefined();
		expect(terminal!.value).toBe('foo');
		expect(terminal!.immediate).toBe(true);
		expect(terminal!.tokenized).toBe(true);
	});

	it('preserves immediate=false on plain token() wrapper', () => {
		// Grammar shape: field('x', token('foo')) — lexer hint, not adjacency.
		const rule: Rule = {
			type: 'field',
			name: 'x',
			content: {
				type: 'token',
				immediate: false,
				content: { type: 'string', value: 'foo' }
			}
		};
		const slots = deriveSlots(rule);
		const terminal = slots
			.find((s) => s.name === 'x')!
			.values.find(isTerminalValue);
		expect(terminal!.immediate).toBe(false);
		expect(terminal!.tokenized).toBe(true);
	});

	it('leaves bare string terminals untagged', () => {
		// Grammar shape: field('x', 'foo') — no token wrapper at all.
		const rule: Rule = {
			type: 'field',
			name: 'x',
			content: { type: 'string', value: 'foo' }
		};
		const slots = deriveSlots(rule);
		const terminal = slots
			.find((s) => s.name === 'x')!
			.values.find(isTerminalValue);
		expect(terminal!.immediate).toBeUndefined();
		expect(terminal!.tokenized).toBeUndefined();
	});

	it('AssembledToken exposes immediate getter when rule is TokenRule', () => {
		const tokRule: TokenRule = {
			type: 'token',
			immediate: true,
			content: { type: 'string', value: '!' }
		};
		const tok = new AssembledToken('_inner_marker', tokRule);
		expect(tok.immediate).toBe(true);
		expect(tok.tokenized).toBe(true);
		expect(tok.text).toBeUndefined(); // text only set for StringRule path
	});

	it('AssembledToken returns immediate=false when rule is plain StringRule', () => {
		const strRule: StringRule = { type: 'string', value: 'pub' };
		const tok = new AssembledToken('_kw_pub', strRule);
		expect(tok.immediate).toBe(false);
		expect(tok.tokenized).toBe(false);
		expect(tok.text).toBe('pub');
	});
});
