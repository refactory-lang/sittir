import { describe, expect, it } from 'vitest';
import { runTriviaPlacement } from '@sittir/tools';

describe('tool trivia-placement', () => {
	it("reports each extra's owner and position as the reader places it", async () => {
		const rows = await runTriviaPlacement({
			grammar: 'rust',
			source: 'fn f() { // TODO\n}\nfn g() {\n a; // note\n // lead\n b;\n}\n'
		});
		expect(rows.map((row) => [row.kind, row.owner, row.position])).toEqual([
			['line_comment', 'block', 'inner:statements'],
			['line_comment', 'expression_statement', 'trailing'],
			['line_comment', 'expression_statement', 'leading']
		]);
	});
});
