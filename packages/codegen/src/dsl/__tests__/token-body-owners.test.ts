import { describe, expect, it } from 'vitest';
import type { GrammarRule } from '../../grammar-shapes/grammar-json.ts';
import { tokenBodyKey, tokenBodyOwners } from '../rule-transforms.ts';

describe('token rules grouped by the body tree-sitter extracts once', () => {
	it('lists every rule writing a body, in the order given, so the first names the shared auxiliary token', () => {
		const flags: GrammarRule = { type: 'PATTERN', value: '[a-z]+' };
		const digits: GrammarRule = { type: 'PATTERN', value: '[0-9]+' };
		const owners = tokenBodyOwners([
			['flags', flags],
			['digits', digits],
			['posix_class_name', { type: 'PATTERN', value: '[a-z]+' }]
		]);
		expect(owners.get(tokenBodyKey(flags))).toEqual(['flags', 'posix_class_name']);
		expect(owners.get(tokenBodyKey(digits))).toEqual(['digits']);
	});
});
