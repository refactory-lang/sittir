import { describe, it, expect } from 'vitest';

describe('factory ergonomics', () => {
	describe('Gap 2: omitted required fields default to empty', () => {
		it('emits ?? F.block() fallback for required single-kind container fields', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			// functionItemFrom should default body to F.block()
			expect(content).toMatch(/body:.*\?\? F\.block\(\)/);
			// functionItemFrom should default parameters to F.parameters()
			expect(content).toMatch(/parameters:.*\?\? F\.parameters\(\)/);
		});
	});

	describe('Gap 3: array at wrapper position auto-wraps', () => {
		it('emits _wrapWithChildren dispatch table', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			expect(content).toContain('function _wrapWithChildren');
			// Container kind: dispatches with rest-params spread
			expect(content).toMatch(/case "parameters":[\s\S]*?F\.parameters\(/);
		});

		it('_resolveOneBranch handles arrays by wrapping with children', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			expect(content).toMatch(/Array\.isArray\(v\).*_wrapWithChildren/s);
		});
	});

	describe('Gap 4: single value at wrapper position auto-wraps', () => {
		it('_resolveOneBranch wraps non-matching NodeData as single child', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			expect(content).toMatch(/isNodeData\(v\).*\$type.*_wrapWithChildren/s);
		});
	});

	describe('Gap 5: single-field factory signatures', () => {
		it('emits direct-value signature for single-field-no-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');
			// label(identifier: ...) — direct value, not label(config: T.Label.Config)
			expect(content).toMatch(/export function label\(identifier:/);
			// Should NOT have a config parameter
			expect(content).not.toMatch(/export function label\(config/);
		});

		it('keeps config form for single-field-with-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');
			// block has label (1 field) + children — must keep config form
			expect(content).toMatch(/export function block\(config/);
		});

		it('emits $with setter that calls factory with direct value', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');
			// $with.identifier setter should call label(value) not label({...config, identifier: value})
			// Find the label factory and check its $with block
			const labelMatch = content.match(/export function label\(identifier:[\s\S]*?\n\}/);
			expect(labelMatch).not.toBeNull();
			const labelBody = labelMatch![0];
			// The setter calls label(value) directly
			expect(labelBody).toMatch(/=> label\(value\)/);
			// Not the config-spread form
			expect(labelBody).not.toMatch(/\.\.\.\s*config/);
		});

		it('adapts from() to use direct-value call for single-field factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			// labelFrom should call F.label(resolvedIdentifier) not F.label({ identifier: ... })
			// It should NOT have the config-object form for label
			expect(content).not.toMatch(/F\.label\(\{/);
		});
	});

	describe('examples cleanup contract', () => {
		it('keeps branch and polymorph ir bundles exposing strict explicitly', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/ir.ts'), 'utf-8');

			expect(content).toContain('.strict');
			expect(content).toContain('from: FR.');
		});
	});
});
