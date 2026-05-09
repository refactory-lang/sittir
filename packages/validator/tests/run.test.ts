import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the underlying codegen validate modules so tests don't run live validation.
vi.mock('@sittir/codegen/validate/from', () => ({
	validateFrom: vi.fn().mockResolvedValue({
		grammar: 'rust', total: 5, pass: 5, fail: 0, skip: 0, undefinedCount: 0, divergentCount: 0, errors: [],
	}),
	formatFromReport: vi.fn().mockReturnValue('mock from report'),
}));
vi.mock('@sittir/codegen/validate/factory-render-parse', () => ({
	validateFactoryRenderParse: vi.fn().mockResolvedValue({
		grammar: 'rust', total: 5, pass: 5, fail: 0, skip: 0, astMatchPass: 5, errors: [], astMismatches: [],
	}),
	formatFactoryRenderParseReport: vi.fn().mockReturnValue('mock factory report'),
}));
vi.mock('@sittir/codegen/validate/read-render-parse', () => ({
	validateReadRenderParse: vi.fn().mockResolvedValue({
		grammar: 'rust', total: 5, pass: 5, fail: 0, skip: 0, astMatchPass: 5, errors: [], astMismatches: [],
	}),
	formatReadRenderParseReport: vi.fn().mockReturnValue('mock rt report'),
}));
vi.mock('@sittir/codegen/validate/template-coverage', () => ({
	validateTemplateCoverage: vi.fn().mockReturnValue({ grammar: 'rust', total: 5, pass: 5, fail: 0, issues: [] }),
}));

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
import { validateFrom } from '@sittir/codegen/validate/from';
import { validateFactoryRenderParse } from '@sittir/codegen/validate/factory-render-parse';
import { validateReadRenderParse } from '@sittir/codegen/validate/read-render-parse';
import { validateTemplateCoverage } from '@sittir/codegen/validate/template-coverage';

describe('@sittir/validator run surface — exports', () => {
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

	it('defaultTemplatesPath resolves to packages/<grammar>/templates', () => {
		const p = defaultTemplatesPath('rust');
		expect(typeof p).toBe('string');
		expect(p).toMatch(/packages[/\\]rust[/\\]templates$/);
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

describe('@sittir/validator run surface — forwarding behavior', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('runFrom forwards (grammar, backend) to validateFrom', async () => {
		await runFrom('rust');
		expect(vi.mocked(validateFrom)).toHaveBeenCalledWith('rust', 'native');
	});

	it('runFrom passes an explicit backend override', async () => {
		await runFrom('python', 'typescript');
		expect(vi.mocked(validateFrom)).toHaveBeenCalledWith('python', 'typescript');
	});

	it('runRt wraps validateReadRenderParse with { backend } option object', async () => {
		await runRt('rust', '/templates/path');
		expect(vi.mocked(validateReadRenderParse)).toHaveBeenCalledWith('rust', '/templates/path', { backend: 'native' });
	});

	it('runRt passes an explicit backend in the option object', async () => {
		await runRt('typescript', '/some/templates', 'typescript');
		expect(vi.mocked(validateReadRenderParse)).toHaveBeenCalledWith('typescript', '/some/templates', { backend: 'typescript' });
	});

	it('runFactory forwards (grammar, templatesPath, backend) to validateFactoryRenderParse', async () => {
		await runFactory('python', '/tmpl');
		expect(vi.mocked(validateFactoryRenderParse)).toHaveBeenCalledWith('python', '/tmpl', 'native');
	});

	it('runFactory passes an explicit backend', async () => {
		await runFactory('rust', '/tmpl', 'typescript');
		expect(vi.mocked(validateFactoryRenderParse)).toHaveBeenCalledWith('rust', '/tmpl', 'typescript');
	});

	it('runCoverage forwards to validateTemplateCoverage', () => {
		runCoverage('rust', '/tmpl');
		expect(vi.mocked(validateTemplateCoverage)).toHaveBeenCalledWith('rust', '/tmpl');
	});
});
