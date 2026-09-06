import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the underlying codegen validate modules so tests don't run live validation.
vi.mock('../src/validate/from.ts', () => ({
	validateFrom: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 5,
		pass: 5,
		fail: 0,
		skip: 0,
		undefinedCount: 0,
		divergentCount: 0,
		errors: []
	}),
	formatFromReport: vi.fn().mockReturnValue('mock from report')
}));
vi.mock('../src/validate/factory-render-parse.ts', () => ({
	validateFactoryRenderParse: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 5,
		pass: 5,
		fail: 0,
		skip: 0,
		astMatchPass: 5,
		errors: [],
		astMismatches: []
	}),
	formatFactoryRenderParseReport: vi.fn().mockReturnValue('mock factory report')
}));
vi.mock('../src/validate/read-render-parse.ts', () => ({
	validateReadRenderParse: vi.fn().mockResolvedValue({
		grammar: 'rust',
		total: 5,
		pass: 5,
		fail: 0,
		skip: 0,
		astMatchPass: 5,
		errors: [],
		astMismatches: []
	}),
	formatReadRenderParseReport: vi.fn().mockReturnValue('mock rt report')
}));
vi.mock('../src/validate/template-coverage.ts', () => ({
	validateTemplateCoverage: vi.fn().mockReturnValue({ grammar: 'rust', total: 5, pass: 5, fail: 0, issues: [] })
}));

import {
	runFrom,
	runRt,
	runCoverage,
	runFactory,
	formatFromReport,
	formatFactoryRenderParseReport,
	formatReadRenderParseReport
} from '../src/run.ts';
import { validateFrom } from '../src/validate/from.ts';
import { validateFactoryRenderParse } from '../src/validate/factory-render-parse.ts';
import { validateReadRenderParse } from '../src/validate/read-render-parse.ts';
import { validateTemplateCoverage } from '../src/validate/template-coverage.ts';

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

	it('runRt wraps validateReadRenderParse with { backend } option object', async () => {
		await runRt('rust');
		expect(vi.mocked(validateReadRenderParse)).toHaveBeenCalledWith('rust', { backend: 'native' });
	});

	it('runFactory forwards (grammar, backend) to validateFactoryRenderParse', async () => {
		await runFactory('python');
		expect(vi.mocked(validateFactoryRenderParse)).toHaveBeenCalledWith('python', 'native');
	});

	it('runCoverage forwards to validateTemplateCoverage', () => {
		runCoverage('rust');
		expect(vi.mocked(validateTemplateCoverage)).toHaveBeenCalledWith('rust');
	});
});
