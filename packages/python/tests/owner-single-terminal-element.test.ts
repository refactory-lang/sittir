import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe('a list owner given one element that is a kind id', () => {
	it('builds its list from that element, on the strict surface', async () => {
		const py = await createEngine(python);
		const statements = py.build.simpleStatements.strict(py.build.passStatement);
		expect(String(py.render(statements)).trim()).toBe('pass');
	});

	it('builds its list from that element, on the loose surface', async () => {
		const py = await createEngine(python);
		expect(String(py.render(py.build.simpleStatements(py.build.passStatement))).trim()).toBe('pass');
	});
});
