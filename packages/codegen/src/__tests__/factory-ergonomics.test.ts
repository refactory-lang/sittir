import { describe, it, expect } from 'vitest';

describe('factory ergonomics', () => {
	describe('Gap 1: optional config on all-optional-field factories', () => {
		it('emits config?: when all fields are optional and children default to []', async () => {
			// Use rust's `blockComment` — all fields optional, has $children
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(
				resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
				'utf-8'
			);
			// blockComment(config?: T.BlockComment.Config) — note the ?
			expect(content).toMatch(/export function blockComment\(config\?:/);
			// The body should default config to {}
			expect(content).toMatch(/const _config = config \?\? \{\}/);
		});
	});

	describe('Gap 5: single-field factory signatures', () => {
		it('emits direct-value signature for single-field-no-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(
				resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
				'utf-8'
			);
			// label(identifier: ...) — direct value, not label(config: T.Label.Config)
			expect(content).toMatch(/export function label\(identifier:/);
			// Should NOT have a config parameter
			expect(content).not.toMatch(/export function label\(config/);
		});

		it('keeps config form for single-field-with-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(
				resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
				'utf-8'
			);
			// block has label (1 field) + children — must keep config form
			expect(content).toMatch(/export function block\(config/);
		});

		it('emits $with setter that calls factory with direct value', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(
				resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
				'utf-8'
			);
			// $with.identifier setter should call label(value) not label({...config, identifier: value})
			// Find the label factory and check its $with block
			const labelMatch = content.match(
				/export function label\(identifier:[\s\S]*?\n\}/
			);
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
			const content = readFileSync(
				resolve(import.meta.dirname, '../../../rust/src/from.ts'),
				'utf-8'
			);
			// labelFrom should call F.label(resolvedIdentifier) not F.label({ identifier: ... })
			// It should NOT have the config-object form for label
			expect(content).not.toMatch(/F\.label\(\{/);
		});
	});
});
