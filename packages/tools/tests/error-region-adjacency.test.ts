import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import { isErrorNode } from '@sittir/common/utils';
import python from '../../python/src/index.ts';
import rust from '../../rust/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const py = await createEngine(python);
const ts = await createEngine(typescript);
const rs = await createEngine(rust);

describe('an ERROR region keeps the source bytes beside it wherever its owner renders from its template', () => {
	it.each(['x = a ?b\n', 'x = a?b\n', 'x = a ? b\n', 'x = 1abc\n'])('python %j snapshots to its source', (source) => {
		const root = py.parse(source);
		expect(root.$errors.length).toBeGreaterThan(0);
		expect(py.render(root.$snapshot()).toString()).toBe(source);
	});

	it.each(['let x = 1 + ;\n', 'let x = 1 +;\n', 'let x = a @@ b;\n', 'let x = 1abc;\n'])('typescript %j snapshots to its source', (source) => {
		const root = ts.parse(source);
		expect(root.$errors.length).toBeGreaterThan(0);
		expect(ts.render(root.$snapshot()).toString()).toBe(source);
	});

	it('reads an ERROR entry as its own text, with the runs beside it on its line as $before and $after', () => {
		const [first] = rs.parse('fn f() {} @@ fn g() {}').statements();
		if (first === undefined || !rs.is.functionItem(first)) throw new Error('expected a function item');
		const [entry] = first.$trivia.trailing();
		if (!isErrorNode(entry)) throw new Error('expected an ERROR entry');
		expect([entry.$text, entry.$before, entry.$after]).toEqual(['@@', ' ', ' ']);
		expect(rs.render(entry as never).toString()).toBe('@@');
	});

	it('gives a snapshot ERROR entry no $after where it touches the token after it', () => {
		const errors: Record<string, unknown>[] = [];
		const collect = (value: unknown): void => {
			if (Array.isArray(value)) value.forEach(collect);
			else if (value !== null && typeof value === 'object') {
				const entry = value as { $type?: unknown; $text?: unknown; $before?: unknown; $after?: unknown };
				if (entry.$type === ERROR_KIND_ID) errors.push({ $text: entry.$text, $before: entry.$before, $after: entry.$after });
				Object.values(value).forEach(collect);
			}
		};
		collect(py.parse('x = a ?b\n').$snapshot());
		expect(errors).toEqual([{ $text: 'a ?', $before: ' ', $after: undefined }]);
	});

	it('renders an edited typescript declaration with the space before its ERROR region', () => {
		const [declaration] = ts.parse('let x = 1 + ;\n').statements();
		if (declaration === undefined || typeof declaration === 'number' || !ts.is.lexicalDeclaration(declaration)) throw new Error('expected a lexical declaration');
		expect(declaration.$with.declarators(...declaration.declarators()).$render()).toBe('let x = 1 + ;');
	});
});
