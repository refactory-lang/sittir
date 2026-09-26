import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

type Token = { $type: number; content(): unknown; $render(): string };
type MacroCall = { arguments(): { delimTokens(): readonly Token[] } };

function readTokens(source: string): readonly Token[] {
	const root = createEngine().parse(source) as unknown as {
		statements(): readonly { content(): { expression(): MacroCall } }[];
	};
	return root.statements()[0]!.content().expression().arguments().delimTokens();
}

describe('a non_special_token whose only child is an anonymous token', () => {
	it("reads `'` and `as` as its content and renders them", () => {
		const tokens = readTokens("m!(x ' y as);");
		expect(tokens.map((token) => token.$type)).toEqual(Array(4).fill(TSKindId.NonSpecialToken));
		expect(tokens.map((token) => token.$render().toString())).toEqual(['x', "'", 'y', 'as']);
		expect(tokens[1]!.content()).toBe(TSKindId.Squote);
		expect(tokens[3]!.content()).toBe(TSKindId.AsKeyword);
	});

	it('round-trips the macro source', () => {
		const source = "m!(x ' y as);";
		expect((createEngine().parse(source) as unknown as { $render(): string }).$render().toString()).toBe(source);
	});
});
