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
});
