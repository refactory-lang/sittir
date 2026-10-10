import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import rust, { type RustAPI } from '../src/index.ts';

const fn = (rs: Engine<RustAPI>) =>
	rs.build.functionItem({
		name: 'f',
		parameters: rs.build.parameters(),
		body: rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] })
	});

describe('rust through createEngine', () => {
	it('the descriptor names its language and loads its hooks on demand', async () => {
		expect(rust.name).toBe('rust');
		const hooks = await rust.load();
		expect(hooks.name).toBe('rust');
		expect(typeof hooks.createNative).toBe('function');
	});

	it('an untouched parse renders back byte for byte', async () => {
		const rs = await createEngine(rust);
		const src = 'fn f() {\n    a;\n}\n';
		expect(rs.render(rs.parse(src)).toString()).toBe(src);
	});

	it('two engines render the same built shape with their own indent', async () => {
		const tabs = await createEngine(rust, { render: { layout: { indent: '\t' } } });
		const spaces = await createEngine(rust, { render: { layout: { indent: '  ' } } });
		expect(tabs.render(fn(tabs)).toString()).toBe('fn f() {\n\ta;\n}');
		expect(spaces.render(fn(spaces)).toString()).toBe('fn f() {\n  a;\n}');
		expect(tabs.render(fn(tabs), { layout: { indent: '    ' } }).toString()).toBe('fn f() {\n    a;\n}');
	});

	it('guards and kind ids come through the engine', async () => {
		const rs = await createEngine(rust);
		const built = fn(rs);
		expect(rs.is.functionItem(built)).toBe(true);
		expect(built.$type).toBe(rs.kinds.FunctionItem);
	});

});
