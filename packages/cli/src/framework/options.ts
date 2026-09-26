import { type Command, Option } from 'commander';
import { allGrammars } from '@sittir/codegen/grammars';

/** Add `-g, --grammar <name>` (choices: every grammar package on disk). Returns the command for chaining. */
export function withGrammar(cmd: Command): Command {
	return cmd.addOption(new Option('-g, --grammar <name>', 'Grammar to operate on').choices([...allGrammars()]));
}

/** Add `-g, --grammar <name...>` (each value one of every grammar package on disk). Returns the command for chaining. */
export function withGrammars(cmd: Command): Command {
	return cmd.addOption(new Option('-g, --grammar <name...>', 'Grammar(s) to operate on').choices([...allGrammars()]));
}

/** Add `-r, --recursive` boolean flag, default false. */
export function withRecursive(cmd: Command): Command {
	return cmd.addOption(new Option('-r, --recursive', 'Use recursive deep-read instead of shallow').default(false));
}

/** Add `-o, --output <dir>` output directory. */
export function withOutput(cmd: Command): Command {
	return cmd.addOption(new Option('-o, --output <dir>', 'Output directory'));
}
