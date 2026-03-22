import { describe, it, expect } from 'vitest';
import { renderSilent as render } from '../../../src/render.js';
import { validateFast as validate } from '../../../src/validate-fast.js';
import { ifExpression } from '../../../src/nodes/if.js';

describe('ifExpression() + render()', () => {
	it('renders if + else that validates ok', () => {
		const node = ifExpression({
			condition: 'x > 0',
			consequence: 'x',
			alternative: '-x',
		});
		const output = render(node);
		expect(output).toContain('if x > 0 {');
		expect(output).toContain('} else {');
		expect(output).toContain('-x');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders two else-if clauses without ERROR nodes', () => {
		// Build nested if expressions compositionally
		const innerIf = render(
			ifExpression({
				condition: 'x > 0',
				consequence: '"small"',
				alternative: '"none"',
			}),
		);
		const middleIf = render(
			ifExpression({
				condition: 'x > 5',
				consequence: '"medium"',
				alternative: innerIf,
			}),
		);
		const node = ifExpression({
			condition: 'x > 10',
			consequence: '"big"',
			alternative: middleIf,
		});
		const output = render(node);
		expect(output).toContain('else if x > 5 {');
		expect(output).toContain('else if x > 0 {');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

	it('renders if with no else block (no else clause)', () => {
		const node = ifExpression({ condition: 'flag', consequence: 'do_thing();' });
		const output = render(node);
		expect(output).not.toContain('else');
		const vr = validate(output);
		expect(vr.ok).toBe(true);
	});

});
