import { describe, it, expect } from 'vitest';
import { renderSilent as render } from '../../../src/render.js';
import { validateFast as validate } from '../../../src/validate-fast.js';
import { sourceFile } from '../../../src/nodes/source-file.js';
import { useDeclaration } from '../../../src/nodes/use.js';
import { structItem } from '../../../src/nodes/struct-item.js';
import { implItem } from '../../../src/nodes/impl.js';
import { functionItem } from '../../../src/nodes/function.js';

describe('sourceFile() + render()', () => {
	it('renders use + struct + impl with blank-line separation that validates ok', () => {
		const method = functionItem({
			name: 'fmt',
			parameters: '&self, f: &mut fmt::Formatter',
			returnType: 'fmt::Result',
			body: 'write!(f, "({}, {})", self.x, self.y)',
		});
		const children = [
			render(useDeclaration({ argument: 'std::fmt::Display' })),
			render(structItem({ name: 'Point', body: 'x: f64,\ny: f64,', children: ['pub'] })),
			render(
				implItem({
					type: 'Point',
					trait: 'Display',
					body: render(method),
				}),
			),
		];
		const node = sourceFile({ children });
		const output = render(node);
		// Items are separated by exactly two newlines
		const parts = output.split('\n\n');
		expect(parts.length).toBe(3);
		expect(output).toContain('use std::fmt::Display;');
		expect(output).toContain('pub struct Point');
		expect(output).toContain('impl Display for Point');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders a single item with no extra blank lines', () => {
		const node = sourceFile({ children: [render(structItem({ name: 'Solo' }))] });
		const output = render(node);
		expect(output).not.toMatch(/\n\n/);
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders sourceFile with IR node children directly (renderChild IR-node path)', () => {
		const useNode = useDeclaration({ argument: 'std::io' });
		const struct = structItem({ name: 'Cfg' });
		// Pass IR nodes directly — renderChild should recursively render them
		const node = sourceFile({ children: [useNode, struct] as never });
		const output = render(node);
		expect(output).toContain('use std::io;');
		expect(output).toContain('struct Cfg;');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});
});
