import { describe, expect, it } from 'vitest';
import { runTriviaPlacement } from '@sittir/tools';

describe('tool trivia-placement', () => {
	it('classifies inner and same-line trailing', async () => {
		const rows = await runTriviaPlacement({
			grammar: 'rust',
			source: 'fn f() { // TODO\n}\nfn g() { a; // note\n b; }\n'
		});
		expect(rows.map((r) => [r.rule, r.today])).toEqual([
			[4, 'lost'],
			[1, 'leading']
		]);
		expect(rows[0]).toMatchObject({ parent: 'block', gap: 'slot' });
	});

	it('places an own-line comment before its next sibling and after the last one', async () => {
		const rows = await runTriviaPlacement({ grammar: 'rust', source: 'fn g() {\n a;\n // lead\n b;\n // tail\n}\n' });
		expect(rows.map((r) => [r.rule, r.today, r.prevNamed, r.nextNamed])).toEqual([
			[2, 'leading', 'expression_statement', 'expression_statement'],
			[3, 'trailing', 'expression_statement', undefined]
		]);
	});
});
