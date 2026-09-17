import { describe, it, expect } from 'vitest';
import { runCodegen, runFullRegen, type CodegenOptions } from '../src/run-codegen.ts';

describe('run-codegen library surface', () => {
	it('exports runCodegen and runFullRegen as functions', () => {
		expect(typeof runCodegen).toBe('function');
		expect(typeof runFullRegen).toBe('function');
	});
	it('CodegenOptions shape is accepted at the type level', () => {
		const opts: CodegenOptions = { grammar: 'rust', outputDir: 'packages/rust/src', all: true };
		expect(opts.grammar).toBe('rust');
	});

	it('restores SITTIR_INTERNAL_CODEGEN_RUN after a rejected call, so a manifest check made afterward is not skipped', async () => {
		const previous = process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
		delete process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
		try {
			await expect(runCodegen({ grammar: 'rust' } as CodegenOptions)).rejects.toThrow(
				'Missing required argument: --output'
			);
			expect(process.env['SITTIR_INTERNAL_CODEGEN_RUN']).toBeUndefined();
		} finally {
			if (previous === undefined) delete process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
			else process.env['SITTIR_INTERNAL_CODEGEN_RUN'] = previous;
		}
	});
});
