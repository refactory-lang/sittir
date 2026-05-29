import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ phantomKinds: vi.fn().mockResolvedValue(0) }));
import { phantomKinds as phantomKindsCmd } from '../../../src/commands/tool/phantom-kinds.ts';
import { phantomKinds as runPhantomKinds } from '@sittir/tools';

describe('tool phantom-kinds command', () => {
	it('registers command named phantom-kinds', () => {
		const program = new Command();
		phantomKindsCmd.register(program);
		const cmd = program.commands.find((c) => c.name() === 'phantom-kinds');
		expect(cmd).toBeDefined();
		expect(cmd!.name()).toBe('phantom-kinds');
	});

	it('passes grammar positionals to the tool run()', async () => {
		vi.clearAllMocks();
		const program = new Command();
		phantomKindsCmd.register(program);
		await program.parseAsync(['phantom-kinds', 'rust', 'python'], { from: 'user' });
		expect(vi.mocked(runPhantomKinds)).toHaveBeenCalledWith({ grammars: ['rust', 'python'] });
	});

	it('passes empty grammars when none provided', async () => {
		vi.clearAllMocks();
		const program = new Command();
		phantomKindsCmd.register(program);
		await program.parseAsync(['phantom-kinds'], { from: 'user' });
		expect(vi.mocked(runPhantomKinds)).toHaveBeenCalledWith({ grammars: [] });
	});
});
