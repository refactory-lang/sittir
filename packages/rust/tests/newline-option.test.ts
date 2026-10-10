// The line ending is one of the arms of the grammar's `_newline` member
// (`Newline`: '\n', '\r\n', '\r'), set under `render.layout`, per engine or
// per call. Every break of a render takes it.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const fn = () =>
	rs.build.functionItem({
		name: 'f',
		parameters: rs.build.parameters(),
		body: rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] })
	});

describe('newline option', () => {
	it('keeps LF when no line ending is given', () => {
		expect(rs.render(fn()).toString()).toBe('fn f() {\n    a;\n}');
	});

	it('spells every break with the engine line ending', async () => {
		const crlf = await createEngine(rust, { render: { layout: { newline: '\r\n' } } });
		expect(crlf.render(fn()).toString()).toBe('fn f() {\r\n    a;\r\n}');
	});

	it('takes a line ending per call', () => {
		expect(rs.render(fn(), { layout: { newline: '\r' } }).toString()).toBe('fn f() {\r    a;\r}');
		expect(rs.render(fn(), { layout: { newline: '\n' } }).toString()).toBe('fn f() {\n    a;\n}');
	});

	it('sets the line ending and the indent unit together', async () => {
		const engine = await createEngine(rust, { render: { layout: { indent: '\t', newline: '\r\n' } } });
		expect(engine.render(fn()).toString()).toBe('fn f() {\r\n\ta;\r\n}');
	});

	it('refuses an ending outside the arms, naming them', async () => {
		// @ts-expect-error a tab is not a line ending
		await expect(createEngine(rust, { render: { layout: { newline: '\t' } } })).rejects.toThrow(/newline "\\t" is not one of \['\\n', '\\r\\n', '\\r'\]/);
		// @ts-expect-error per-call endings are checked the same way
		expect(() => rs.render(fn(), { layout: { newline: '\n\n' } }).toString()).toThrow(/is not one of/);
	});

	it('has no top-level indent or newline key', async () => {
		// @ts-expect-error indent lives under layout
		await expect(createEngine(rust, { render: { indent: '\t' } })).rejects.toThrow(/unknown key indent/);
		// @ts-expect-error newline lives under layout
		await expect(createEngine(rust, { render: { newline: '\n' } })).rejects.toThrow(/unknown key newline/);
	});
});
