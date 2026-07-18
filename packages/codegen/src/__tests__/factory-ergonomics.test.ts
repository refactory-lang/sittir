import { describe, it, expect } from 'vitest';

describe('factory ergonomics', () => {
	describe('Gap 2: omitted required fields default to empty', () => {
		it('emits ?? F.block() fallback for required single-kind container fields', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			// functionItemFrom should default body to F.buildBlock()
			expect(content).toMatch(/body:.*\?\? F\.buildBlock\(\)/);
			// functionItemFrom should default parameters to F.buildParameters()
			expect(content).toMatch(/parameters:.*\?\? F\.buildParameters\(\)/);
		});
	});

	describe('Gap 3: array at wrapper position auto-wraps', () => {
		it('emits _wrapWithChildren dispatch table', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			expect(content).toContain('function _wrapWithChildren');
			// Container kind: dispatches with rest-params spread
			expect(content).toMatch(/case ['"]parameters['"]:[\s\S]*?F\.buildParameters\(/);
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
			// buildLabel(identifier: ...) — direct value, not buildLabel(config: T.Label.Config)
			expect(content).toMatch(/export function buildLabel\(identifier:/);
			// Should NOT have a config parameter
			expect(content).not.toMatch(/export function buildLabel\(config/);
		});

		it('keeps config form for single-field-with-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');
			// block has label (1 field) + children — must keep config form
			expect(content).toMatch(/export function buildBlock\(config/);
		});

		it('emits $with setter that calls factory with direct value', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');
			// $with.identifier setter should call buildLabel(value) not buildLabel({...config, identifier: value})
			// Find the label factory and check its $with block
			const labelMatch = content.match(/export function buildLabel\(identifier:[\s\S]*?\n\}/);
			expect(labelMatch).not.toBeNull();
			const labelBody = labelMatch![0];
			// The setter calls buildLabel(value) directly
			expect(labelBody).toMatch(/=> buildLabel\(value\)/);
			// Not the config-spread form
			expect(labelBody).not.toMatch(/\.\.\.\s*config/);
		});

		it('adapts from() to use direct-value call for single-field factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
			// coerceToLabel should call F.buildLabel(resolvedIdentifier) not F.buildLabel({ identifier: ... })
			// It should NOT have the config-object form for label
			expect(content).not.toMatch(/F\.buildLabel\(\{/);
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
