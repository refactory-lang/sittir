import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

type Token = { $type: number; content(): unknown; $render(): string };
type MacroCall = { arguments(): { delimTokens(): readonly Token[] } };

function readTokens(source: string): readonly Token[] {
	const root = rs.parse(source) as unknown as {
		statements(): readonly { content(): { expression(): MacroCall } }[];
	};
	return root.statements()[0]!.content().expression().arguments().delimTokens();
}

describe('a non_special_token whose only child is an anonymous token', () => {
	it("reads `'` and `as` as its content and renders them", () => {
		const tokens = readTokens("m!(x ' y as);");
		expect(tokens.map((token) => token.$type)).toEqual(Array(4).fill(rs.kinds.NonSpecialToken));
		expect(tokens.map((token) => token.$render().toString())).toEqual(['x', "'", 'y', 'as']);
		expect(tokens[1]!.content()).toBe(rs.kinds.Squote);
		expect(tokens[3]!.content()).toBe(rs.kinds.AsKeyword);
	});

	it('round-trips the macro source', () => {
		const source = "m!(x ' y as);";
		expect((rs.parse(source) as unknown as { $render(): string }).$render().toString()).toBe(source);
	});
});
