#!/usr/bin/env node
import { Command } from 'commander';
import { registerValidate } from './commands/validate/index.ts';
import { gen } from './commands/gen.ts';

const program = new Command()
	.name('sittir')
	.description('Unified sittir command-line surface');

registerValidate(program);
gen.register(program);

await program.parseAsync(process.argv);
