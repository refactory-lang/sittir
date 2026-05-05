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
});
