import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import typescript from '../src/index.ts';

const engines = {
	arena: await createEngine(typescript, { nodeStorage: 'arena' }),
	object: await createEngine(typescript, { nodeStorage: 'object' })
};

const NEXT_DEPLOY = 'if (originalMode === undefined) delete process.env.NEXT_TEST_MODE\nelse process.env.NEXT_TEST_MODE = originalMode\n';

describe.each(Object.keys(engines) as (keyof typeof engines)[])('an automatic semicolon keeps its line break when the code around it is edited (%s storage)', (storage) => {
	it.each([
		['if (c) x()\nelse y()\n', 'c'],
		['if (c) x()\nelse y()\n', 'x'],
		[NEXT_DEPLOY, 'originalMode'],
		[NEXT_DEPLOY, 'delete process.env.NEXT_TEST_MODE'],
		['if (c) {\n  x()\n}\nelse y()\n', 'c'],
		['function f(): void\nfunction f() {}\n', 'f'],
		['class A {\n  m(): void\n  m() {}\n}\n', 'm']
	])('%j, edited at %j, renders on source', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});

	it.each([
		['if (c) { x() } else y()\n', 'c'],
		['f(() => { x() })\n', 'x']
	])('%j, edited at %j, keeps the source gap after the automatic semicolon', (source, text) => {
		expect(editedRender(engines[storage], source, text)).toBe(source);
	});

	it.each(['const x = 1', 'x()', 'if (c) { x() }'])('%j, which ends at its automatic semicolon, renders untouched on source', (source) => {
		const { root } = engines[storage].diagnostics.parseAndRead(source);
		expect(engines[storage].render(root as never).toString()).toBe(source);
	});
});
