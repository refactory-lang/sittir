#!/usr/bin/env node
import { Command } from 'commander';
import { registerValidate } from './commands/validate/index.ts';
import { registerTools } from './commands/tool/index.ts';
import { gen } from './commands/gen.ts';

const program = new Command()
	.name('sittir')
	.description('Unified sittir command-line surface');

gen.register(program);
registerValidate(program);
registerTools(program);

await program.parseAsync(process.argv);
