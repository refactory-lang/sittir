import { join } from 'node:path';
import { PACKAGES_DIR } from '../grammars.ts';
import { tsname } from './names.ts';

export const FLAGS_PATH = join(PACKAGES_DIR, 'common', 'src', 'portable', 'flags.ts');

export const FLAG_BITS = 31;

export interface FlagMember {
	readonly name: string;
	readonly bit: number;
}

export function flagMembers(names: Iterable<string>): FlagMember[] {
	const ordered = [...new Set(names)].sort();
	if (ordered.length > FLAG_BITS)
		throw new Error(
			`bindings-inventory: the vocabulary declares ${ordered.length} flags, and one bitflag word holds ${FLAG_BITS}: no bit for ${ordered.slice(FLAG_BITS).join(', ')}`
		);
	return ordered.map((name, bit) => ({ name: tsname(name), bit }));
}
