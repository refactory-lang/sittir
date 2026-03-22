import { describe, it, expect } from 'vitest';
import { renderSilent as render } from '../../../src/render.js';
import { validateFast as validate } from '../../../src/validate-fast.js';
import { useDeclaration } from '../../../src/nodes/use.js';

describe('useDeclaration() + render()', () => {
	it('renders a scoped use list that validates ok', () => {
		const node = useDeclaration({ argument: 'std::collections::{HashMap, BTreeMap}' });
		const output = render(node);
		expect(output).toBe('use std::collections::{HashMap, BTreeMap};');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders a single-item use that validates ok', () => {
		const node = useDeclaration({ argument: 'std::fmt::Display' });
		const output = render(node);
		expect(output).toBe('use std::fmt::Display;');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

});
