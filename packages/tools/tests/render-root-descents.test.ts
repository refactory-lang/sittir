import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../../typescript/src/index.ts';
import { layoutWorkOf } from '../src/validate/layout-runs.ts';

const ts = await createEngine(typescript);
const work = await layoutWorkOf('typescript');

afterAll(() => ts.dispose());

const ROOT_DESCENT_CEILING = 12;

const functionAt = (i: number): string => `function f${i}(a, b) {\n  g${i}(a, b);\n  h${i}();\n}\n`;

const codemodDescents = (count: number): number => {
	const [renamedAt, argumentsAt, insertedAt] = [count / 4, count / 2, (3 * count) / 4];
	const root = ts.parse(Array.from({ length: count }, (_, i) => functionAt(i)).join('\n'));
	const fn = (i: number) => {
		const statement = root.statements()[i];
		if (statement === undefined || !ts.is.functionDeclaration(statement)) throw new Error(`expected function ${i}`);
		return statement;
	};
	const [renamed, changed, grown] = [fn(renamedAt), fn(argumentsAt), fn(insertedAt)];
	const [call, ...rest] = changed.body().statements();
	if (call === undefined || !ts.is.expressionStatement(call)) throw new Error('expected a call statement');
	const expression = call.expression();
	if (!ts.is.callExpressionCall(expression)) throw new Error('expected a plain call');
	const args = expression.arguments();
	if (!ts.is.arguments(args)) throw new Error('expected arguments');
	const changedArguments = call.$with.expression(
		expression.$with.arguments(args.$with.elements(ts.build.identifier('z')))
	);
	const inserted = ts.build.expressionStatement(ts.build.identifier('inserted'));
	const edited = root.$with.statements(
		...root.statements().map((statement, i) => {
			if (i === renamedAt) return renamed.$with.name(ts.build.identifier('renamed'));
			if (i === argumentsAt) return changed.$with.body(changed.body().$with.statements(changedArguments, ...rest));
			if (i === insertedAt)
				return grown.$with.body(grown.body().$with.statements(...grown.body().statements(), inserted));
			return statement;
		})
	);
	const expectedAt = (i: number): string => {
		const text = functionAt(i);
		if (i === renamedAt) return text.replace(`f${i}(`, 'renamed(');
		if (i === argumentsAt) return text.replace(`g${i}(a, b)`, `g${i}(z)`);
		if (i === insertedAt) return text.replace(`h${i}();\n`, `h${i}();\n  inserted;\n`);
		return text;
	};
	const before = work(root).rootDescents;
	expect(edited.$render()).toBe(Array.from({ length: count }, (_, i) => expectedAt(i)).join('\n'));
	return work(root).rootDescents - before;
};

describe('a render moves one cursor through the tree it reads', () => {
	it('a codemod render descends from the root as often over 80 functions as over 20', () => {
		const [small, large] = [codemodDescents(20), codemodDescents(80)];
		expect(large).toBe(small);
		expect(large).toBeLessThanOrEqual(ROOT_DESCENT_CEILING);
	});
});
