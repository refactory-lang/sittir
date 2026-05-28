#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command()
	.name('sittir')
	.description('Unified sittir command-line surface');

// Namespaces are registered in later tasks.

await program.parseAsync(process.argv);
