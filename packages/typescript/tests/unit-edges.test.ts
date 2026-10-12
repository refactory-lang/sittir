import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('a unit a list seats takes the gap after it', () => {
	it('keeps the line break after a unit statement in a snapshot', () => {
		expect(ts.render(ts.parse(';\nx;\n').$snapshot()).toString()).toBe(';\nx;\n');
		expect(ts.render(ts.parse('x;\n;\ny;\n').$snapshot()).toString()).toBe('x;\n;\ny;\n');
	});

	it('breaks the line after a unit statement in a built list', () => {
		const root = ts.parse(';\n');
		const [unit] = root.statements();
		const statement = (name: string) => ts.build.expressionStatement(ts.build.identifier(name));
		// The parsed unit is its bare kind id, which `$with.statements` takes at runtime but not in its type.
		expect(root.$with.statements(statement('a'), unit as never, statement('b')).$render()).toBe('a;\n;\nb;\n');
	});

	it('spaces a unit element of a comma list like any other element', () => {
		const [statement] = ts.parse('[x, true];\n').statements();
		if (statement === undefined || typeof statement === 'number' || !ts.is.expressionStatement(statement)) throw new Error('expected an expression statement');
		const array = statement.expression();
		if (!ts.is.array(array)) throw new Error('expected an array');
		const elements = array.elements().filter((element) => element !== undefined);
		expect(array.$with.elements(...elements.reverse()).$render()).toBe('[true, x]');
	});
});
