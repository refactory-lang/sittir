/**
 * @sittir/cli — library surface.
 *
 * The executable lives in `cli.ts` (the `sittir` bin); this module exposes the
 * program builder and framework primitives for programmatic use and tooling
 * (e.g. the command glossary generator).
 */

export { buildProgram } from './cli.ts';
export { allCommandNames, renderGlossary } from './glossary.ts';
export type { CommandModule } from './framework/command-module.ts';
export { registerNamespace } from './framework/command-module.ts';
export {
	withGrammar,
	withBackend,
	withRecursive,
	withOutput,
	GRAMMARS,
	BACKENDS
} from './framework/options.ts';
