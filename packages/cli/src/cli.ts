#!/usr/bin/env node
import { Command } from 'commander';
import { registerValidate } from './commands/validate/index.ts';

const program = new Command()
	.name('sittir')
	.description('Unified sittir command-line surface');

registerValidate(program);

await program.parseAsync(process.argv);
