import { type Command, Option } from 'commander';

/** Grammar names accepted across the CLI. */
export const GRAMMARS = ['rust', 'typescript', 'python'] as const;

/** Add `-g, --grammar <name>` (choices: rust|typescript|python). Returns the command for chaining. */
export function withGrammar(cmd: Command): Command {
	return cmd.addOption(new Option('-g, --grammar <name>', 'Grammar to operate on').choices([...GRAMMARS]));
}

/** Add `-r, --recursive` boolean flag, default false. */
export function withRecursive(cmd: Command): Command {
	return cmd.addOption(new Option('-r, --recursive', 'Use recursive deep-read instead of shallow').default(false));
}

/** Add `-o, --output <dir>` output directory. */
export function withOutput(cmd: Command): Command {
	return cmd.addOption(new Option('-o, --output <dir>', 'Output directory'));
}
