import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ bindingsInventory: vi.fn().mockResolvedValue(0) }));
import { bindingsInventory as bindingsInventoryCmd } from '../../../src/commands/tool/bindings-inventory.ts';
import { bindingsInventory as runBindingsInventory } from '@sittir/tools';

const parse = async (args: readonly string[]): Promise<void> => {
	vi.clearAllMocks();
	const program = new Command();
	bindingsInventoryCmd.register(program);
	await program.parseAsync(['bindings-inventory', ...args], { from: 'user' });
};

describe('tool bindings-inventory command', () => {
	it('passes the grammars --grammar names, so a grammar outside the stable default can be written and checked', async () => {
		await parse(['--write', '--grammar', 'csharp', 'java']);
		expect(vi.mocked(runBindingsInventory)).toHaveBeenCalledWith({ grammars: ['csharp', 'java'], check: false, members: false, write: true });
	});

	it('leaves the grammars to the default when --grammar is absent', async () => {
		await parse(['--check']);
		expect(vi.mocked(runBindingsInventory)).toHaveBeenCalledWith({ check: true, members: false, write: false });
	});
});
