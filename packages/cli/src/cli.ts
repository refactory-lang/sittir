#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { registerValidate } from './commands/validate/index.ts';
import { registerTools } from './commands/tool/index.ts';
import { gen } from './commands/gen.ts';

/** Build the fully-registered sittir program WITHOUT parsing argv. */
export function buildProgram(): Command {
	const program = new Command().name('sittir').description('Unified sittir command-line surface');
	gen.register(program);
	registerValidate(program);
	registerTools(program);
	return program;
}

// Only parse when executed directly (not when imported by the glossary generator
// / tests). Resolve both sides through realpath so this holds when launched via
// the `node_modules/.bin/sittir` symlink (and pnpm's symlinked store), where
// `process.argv[1]` is the symlink while `import.meta.url` is the real dist file.
const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	try {
		return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return false;
	}
})();
if (isMain) {
	await buildProgram().parseAsync(process.argv);
}
