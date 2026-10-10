import { join } from 'node:path';
import { VOCABULARY_DIR } from './facts.ts';
import { REGENERATE_BINDINGS_COMMAND } from './hash.ts';
import { tsname } from './names.ts';

export const FLAGS_PATH = join(VOCABULARY_DIR, 'flags.ts');

export const FLAG_BITS = 31;

export function printFlagsModule(names: Iterable<string>): string {
	const ordered = [...new Set(names)].sort();
	if (ordered.length > FLAG_BITS)
		throw new Error(`bindings-inventory: the vocabulary declares ${ordered.length} flags, and one bitflag word holds ${FLAG_BITS}`);
	return `// Generated from the vocabulary's Flag declarations by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.
export enum Flags {
${ordered.map((name, bit) => `\t${tsname(name)} = 1 << ${bit}`).join(',\n')}
}
`;
}
