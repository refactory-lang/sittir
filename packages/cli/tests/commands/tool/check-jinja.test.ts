import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ checkJinja: vi.fn().mockResolvedValue(0) }));
import { checkJinja as checkJinjaCmd } from '../../../src/commands/tool/check-jinja.ts';
import { checkJinja as runCheckJinja } from '@sittir/tools';

describe('tool check-jinja command', () => {
	it('registers the check-jinja command', () => {
		const program = new Command();
		checkJinjaCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'check-jinja')!;
		expect(cmd).toBeDefined();
	});

	it('calls the tool run() with no options', async () => {
		vi.clearAllMocks();
		const program = new Command();
		checkJinjaCmd.register(program);
		await program.parseAsync(['check-jinja'], { from: 'user' });
		expect(vi.mocked(runCheckJinja)).toHaveBeenCalledWith({});
	});
});
