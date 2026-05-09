import { describe, it, expect } from 'vitest';
import {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	defaultTemplatesPath,
	formatFromReport,
	formatFactoryRenderParseReport,
	formatReadRenderParseReport,
} from '../src/run.ts';

describe('@sittir/validator run surface', () => {
	it('exports runFrom as a function', () => {
		expect(typeof runFrom).toBe('function');
	});

	it('exports runRt as a function', () => {
		expect(typeof runRt).toBe('function');
	});

	it('exports runCoverage as a function', () => {
		expect(typeof runCoverage).toBe('function');
	});

	it('exports runFactory as a function', () => {
		expect(typeof runFactory).toBe('function');
	});

	it('exports defaultTemplatesPath as a function', () => {
		expect(typeof defaultTemplatesPath).toBe('function');
	});

	it('defaultTemplatesPath returns a string containing the grammar name', () => {
		const p = defaultTemplatesPath('rust');
		expect(typeof p).toBe('string');
		expect(p).toContain('rust');
		expect(p).toContain('templates');
	});

	it('defaultTemplatesPath differs per grammar', () => {
		expect(defaultTemplatesPath('rust')).not.toBe(defaultTemplatesPath('typescript'));
		expect(defaultTemplatesPath('typescript')).not.toBe(defaultTemplatesPath('python'));
	});

	it('exports format helpers as functions', () => {
		expect(typeof formatFromReport).toBe('function');
		expect(typeof formatFactoryRenderParseReport).toBe('function');
		expect(typeof formatReadRenderParseReport).toBe('function');
	});
});
