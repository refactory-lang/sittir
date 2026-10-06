import { CHOICE, STRING } from '../../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledEnum } from '../node-map.ts';

const member = (value: string) => ({ type: STRING, value }) as const;

describe('AssembledEnum — a member is identified by its kind id', () => {
	it('members with distinct ids construct', () => {
		const kindEntries = [
			{ id: 143, kind: 'unique', literalText: 'unique symbol', anon: true },
			{ id: 42, kind: 'symbol_keyword', literalText: 'symbol', anon: true }
		];
		const node = new AssembledEnum('predefined_type', { type: CHOICE, members: [member('symbol'), member('unique symbol')] }, { kindEntries });
		expect([...node.resolvedByText].map(([text, entry]) => [text, entry.id])).toEqual([
			['symbol', 42],
			['unique symbol', 143]
		]);
	});

	it('two members sharing a kind id are a diagnostic naming the enum and both members', () => {
		const kindEntries = [
			{ id: 143, kind: 'unique', literalText: 'unique', anon: true },
			{ id: 143, kind: 'unique', literalText: 'unique symbol', anon: true }
		];
		expect(
			() => new AssembledEnum('predefined_type', { type: CHOICE, members: [member('unique'), member('unique symbol')] }, { kindEntries })
		).toThrow(/predefined_type.*"unique".*"unique symbol".*143/);
	});
});
