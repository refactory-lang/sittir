import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('@sittir/tools', () => ({ probeParity: vi.fn().mockResolvedValue(0) }));
import { probeParity as probeParityCmd } from '../../../src/commands/tool/probe-parity.ts';
import { probeParity as runProbeParity } from '@sittir/tools';

describe('tool probe-parity command', () => {
it('registers command named probe-parity', () => {
const program = new Command();
probeParityCmd.register(program);
const cmd = program.commands.find((c) => c.name() === 'probe-parity');
expect(cmd).toBeDefined();
expect(cmd!.name()).toBe('probe-parity');
});

it('registers expected typed options', () => {
const program = new Command();
probeParityCmd.register(program);
const cmd = program.commands.find((c) => c.name() === 'probe-parity')!;
const longs = cmd.options.map((o) => o.long);
expect(longs).toEqual(expect.arrayContaining(['--grammar', '--target']));
});

it('passes parsed options to the tool run()', async () => {
vi.clearAllMocks();
const program = new Command();
probeParityCmd.register(program);
await program.parseAsync(['probe-parity', '--grammar', 'rust', '--target', 'visibility_modifier'], { from: 'user' });
expect(vi.mocked(runProbeParity)).toHaveBeenCalledWith({
grammar: 'rust',
target: 'visibility_modifier'
});
});
});
