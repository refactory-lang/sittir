import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const SOURCE = 'fn a() {}\nfn b() { let x = 1; }\n';

describe.each([
	['a shallow read', false],
	['a deep read', true]
])('a comment written in place below the root, on %s', (_, deep) => {
	it('renders inside an empty block', () => {
		const root = engine.parse(SOURCE, { deep });
		const first = root.statements()[0]!;
		if (!engine.is.functionItem(first)) throw new Error('expected a function');
		const body = first.body();
		if (!engine.isEmptyNode(body)) throw new Error('expected an empty block');
		body.$trivia.inner(engine.build.lineComment(' inside'));
		expect(root.$render()).toBe('fn a() {\n    // inside\n}\nfn b() { let x = 1; }\n');
	});

	it('renders before a nested statement', () => {
		const root = engine.parse(SOURCE, { deep });
		const second = root.statements()[1]!;
		if (!engine.is.functionItem(second)) throw new Error('expected a function');
		const statement = second.body().statements()[0];
		if (!engine.isNode(statement)) throw new Error('expected a statement node');
		statement.$trivia.leading(engine.build.lineComment(' before'));
		expect(root.$render()).toBe('fn a() {}\nfn b() {\n    // before\n    let x = 1;\n}\n');
	});

	it('leaves an untouched file rendering its bytes', () => {
		expect(engine.parse(SOURCE, { deep }).$render()).toBe(SOURCE);
	});
});
