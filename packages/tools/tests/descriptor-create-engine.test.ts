import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../../rust/src/index.ts';
import python from '../../python/src/index.ts';
import typescript from '../../typescript/src/index.ts';
import scm from '../../scm/src/index.ts';
import regex from '../../regex/src/index.ts';

const sources = [
	['rust', rust, 'fn f() {}\n'],
	['python', python, 'x = 1\n'],
	['typescript', typescript, 'const x = 1;\n'],
	['scm', scm, '(a) @b\n'],
	['regex', regex, 'a+b']
] as const;

describe('a descriptor creates an engine the same way createEngine(descriptor) does', () => {
	for (const [name, descriptor, source] of sources) {
		it(`${name}: both forms render alike`, async () => {
			const viaDescriptor = await (descriptor as typeof rust).createEngine();
			const viaFunction = await createEngine(descriptor as typeof rust);
			expect(viaDescriptor.render(viaDescriptor.parse(source)).toString()).toBe(viaFunction.render(viaFunction.parse(source)).toString());
		});
	}

	it('applies the render options it is given', async () => {
		const tabs = await rust.createEngine({ render: { layout: { indent: '\t' } } });
		const spaces = await rust.createEngine({ render: { layout: { indent: '  ' } } });
		const block = (engine: typeof tabs) => engine.build.block({ statements: [engine.build.expressionStatement(engine.build.identifier('a'))] });
		expect(tabs.render(block(tabs)).toString()).toBe('{\n\ta;\n}');
		expect(spaces.render(block(spaces)).toString()).toBe('{\n  a;\n}');
	});
});
