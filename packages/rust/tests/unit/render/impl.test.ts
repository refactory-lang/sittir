import { describe, it, expect } from 'vitest';
import { renderSilent as render } from '../../../src/render.js';
import { validateFast as validate } from '../../../src/validate-fast.js';
import { implItem } from '../../../src/nodes/impl.js';
import { functionItem } from '../../../src/nodes/function.js';

describe('implItem() + render()', () => {
	it('renders an inherent impl block with a method that validates ok', () => {
		const method = functionItem({ name: 'new', body: 'Self { value: 0 }', returnType: 'Self' });
		const node = implItem({ type: 'Counter', body: render(method) });
		const output = render(node);
		expect(output).toContain('impl Counter {');
		expect(output).toContain('fn new()');
		expect(output).not.toContain('for Counter');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders a trait impl (impl Drop for Guard) that validates ok', () => {
		const dropFn = functionItem({
			name: 'drop',
			parameters: '&mut self',
			body: 'println!("dropped");',
		});
		const node = implItem({ type: 'Guard', trait: 'Drop', body: render(dropFn) });
		const output = render(node);
		expect(output).toContain('impl Drop for Guard {');
		expect(output).toContain('fn drop');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders an impl block with no methods that validates ok', () => {
		const node = implItem({ type: 'Empty' });
		const output = render(node);
		expect(output).toContain('impl Empty {');
		expect(output).toContain('}');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders an impl with array body of IR nodes that validates ok', () => {
		const method1 = functionItem({ name: 'new', body: 'Self { x: 0 }', returnType: 'Self' });
		const method2 = functionItem({
			name: 'value',
			parameters: '&self',
			body: 'self.x',
			returnType: 'i32',
		});
		const node = implItem({ type: 'Counter', body: [method1, method2] as never });
		const output = render(node);
		expect(output).toContain('impl Counter {');
		expect(output).toContain('fn new()');
		expect(output).toContain('fn value(&self)');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders an impl with single IR node body that validates ok', () => {
		const method = functionItem({ name: 'run', body: '42', returnType: 'i32' });
		const node = implItem({ type: 'Runner', body: method as never });
		const output = render(node);
		expect(output).toContain('impl Runner {');
		expect(output).toContain('fn run()');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});
});
