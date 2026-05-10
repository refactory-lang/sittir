import { afterEach, describe, expect, it, vi } from 'vitest';
import { TOOL_NAMES, dispatch } from '../src/cli.ts';

describe('tools cli dispatcher', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('registers expected tool names', () => {
		expect(TOOL_NAMES.has('probe-kind')).toBe(true);
		expect(TOOL_NAMES.has('counts')).toBe(true);
		expect(TOOL_NAMES.has('profile')).toBe(true);
		expect(TOOL_NAMES.has('profile-factory')).toBe(true);
		expect(TOOL_NAMES.has('list-kinds')).toBe(true);
		expect(TOOL_NAMES.has('walk')).toBe(true);
		expect(TOOL_NAMES.has('exercise')).toBe(true);
	});

	it('returns 0 for --help', async () => {
		const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		await expect(dispatch(['--help'])).resolves.toBe(0);
		expect(stdout).toHaveBeenCalled();
	});

	it('returns 1 for unknown subcommand', async () => {
		const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

		await expect(dispatch(['nonexistent-tool'])).resolves.toBe(1);
		expect(stderr).toHaveBeenCalled();
	});
});
