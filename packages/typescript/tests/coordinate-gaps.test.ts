// A rebuilt node whose list items are still coordinates renders the class
// its source spelled, by majority, in place of the engine's option: blank
// lines survive an append, and a tight comma list survives a replace.
// The wrapped accessors are typed as slot data while the values carry the
// fluent surface, so the shapes below are asserted through `unknown`.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('gaps between coordinates', () => {
	it('keeps the blank lines a parsed block spelled when a statement is appended', () => {
		const engine = createEngine();
		const source = 'function f() {\n  a();\n\n  b();\n\n  c();\n}\n';
		const fn = engine.parse(source).statements()[0] as unknown as {
			body(): {
				$with: { statements(...v: readonly unknown[]): unknown };
				statements(): readonly unknown[];
			};
		};
		const body = fn.body();
		const rebuilt = body.$with.statements(
			...body.statements(),
			ir.expressionStatement.strict(
				ir.callExpression.call.strict({ function: ir.identifier('d'), arguments: ir.arguments.strict() }),
				{ terminator: TSKindId.Semi }
			)
		);
		// The blank lines are the claim; the indent width is the format's.
		const text = engine.render(rebuilt as never).toString().replace(/\n[ \t]+/g, '\n');
		expect(text).toContain('a();\n\nb();\n\nc();\n\nd();');
	});

	it('keeps a tight comma list tight when an argument is replaced', () => {
		const engine = createEngine();
		const call = (
			engine.parse('f(a,b,c);\n').statements()[0] as unknown as {
				expression(): {
					arguments(): {
						$with: { elements(...v: readonly unknown[]): unknown };
						elements(): readonly unknown[];
					};
				};
			}
		)
			.expression()
			.arguments();
		const [a, , c] = call.elements();
		const rebuilt = call.$with.elements(a, ir.identifier('x'), c);
		expect(engine.render(rebuilt as never).toString()).toBe('(a,x,c)');
	});
});
