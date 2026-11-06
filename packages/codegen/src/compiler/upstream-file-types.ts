import { upstreamGrammarEntry, type GrammarPackage } from '../grammars.ts';

export const NO_FILE_TYPES: readonly string[] = Object.freeze([]);

export function upstreamFileTypes(pkg: GrammarPackage): readonly string[] {
	const { entry, configPath } = upstreamGrammarEntry(pkg);
	const declared = entry['file-types'];
	if (declared === undefined || declared === null) return [];
	if (!Array.isArray(declared) || declared.some((type) => typeof type !== 'string')) {
		throw new Error(`upstreamFileTypes: the file-types of "${pkg.name}" in ${configPath} are not a list of strings`);
	}
	return declared as readonly string[];
}
