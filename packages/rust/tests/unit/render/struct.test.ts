import { describe, it, expect } from 'vitest';
import { renderSilent as render } from '../../../src/render.js';
import { validateFast as validate } from '../../../src/validate-fast.js';
import { structItem } from '../../../src/nodes/struct-item.js';

describe('structItem() + render()', () => {
	it('renders a named-field pub struct that validates ok', () => {
		const node = structItem({
			name: 'Guard',
			body: 'value: i32,\nactive: bool,',
			children: ['pub'],
		});
		const output = render(node);
		expect(output).toContain('pub struct Guard');
		expect(output).toContain('value: i32');
		expect(output).toContain('active: bool');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders a unit struct (no fields) that validates ok', () => {
		const node = structItem({ name: 'Sentinel', children: ['pub'] });
		const output = render(node);
		expect(output).toContain('pub struct Sentinel;');
		expect(output).not.toContain('{');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders a private struct (no visibility) that validates ok', () => {
		const node = structItem({ name: 'Inner', body: 'x: f64,' });
		const output = render(node);
		expect(output).not.toMatch(/^pub\s/);
		expect(output).toContain('struct Inner');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders space-separated modifiers when children is a multi-element array', () => {
		const node = structItem({
			name: 'Foo',
			children: ['pub', 'crate'],
		});
		const output = render(node);
		expect(output).toContain('pub crate struct Foo');
		expect(output).not.toContain('pub,crate');
	});
});
