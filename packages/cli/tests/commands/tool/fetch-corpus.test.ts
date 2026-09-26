import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({
	fetchUpstreamCorpus: vi.fn().mockResolvedValue({ files: [], repository: 'r', ref: 'v', commit: 'c' })
}));
import { fetchCorpus } from '../../../src/commands/tool/fetch-corpus.ts';
import { fetchUpstreamCorpus } from '@sittir/tools';

function program(): Command {
	const root = new Command().exitOverride().configureOutput({ writeErr: () => {}, writeOut: () => {} });
	fetchCorpus.register(root);
	for (const cmd of root.commands) cmd.exitOverride().configureOutput({ writeErr: () => {}, writeOut: () => {} });
	return root;
}

describe('tool fetch-corpus command', () => {
	it('fetches each named grammar', async () => {
		vi.clearAllMocks();
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		await program().parseAsync(['fetch-corpus', '--grammar', 'rust', 'python'], { from: 'user' });
		expect(vi.mocked(fetchUpstreamCorpus).mock.calls.map(([opts]) => opts.grammar)).toEqual(['rust', 'python']);
	});

	it.each(['rusty', '../rust', 'rust/../../etc'])('rejects %j before fetching anything', async (name) => {
		vi.clearAllMocks();
		await expect(program().parseAsync(['fetch-corpus', '--grammar', 'rust', name], { from: 'user' })).rejects.toThrow(
			/invalid/i
		);
		expect(vi.mocked(fetchUpstreamCorpus)).not.toHaveBeenCalled();
	});
});
