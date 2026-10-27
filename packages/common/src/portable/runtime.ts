import type { Engine, LanguageAPI, PortableStructure } from '@sittir/types';
import { inLanguage } from '../language.ts';
import { portableBuilder } from './build.ts';
import { builtReadsAs, flagHolds, readsAs } from './classify.ts';
import { languageGuardOf, type PortableLanguage } from './language-guard.ts';
import { portableTrees, type LanguageGuard, type PortableGuardTree } from './tree.ts';
import { vocabularyFlags, vocabularyPaths } from './vocabulary-paths.ts';

const flagOf = new Map<string, readonly [path: string, flag: string]>(vocabularyFlags.map(([path, segment, flag]) => [`${path}.${segment}`, [path, flag]]));

const runtimeTrees = new WeakMap<PortableLanguage, PortableGuardTree<string, LanguageGuard>>();

export function portableRuntimeTree(language: PortableLanguage): PortableGuardTree<string, LanguageGuard> {
	let tree = runtimeTrees.get(language);
	if (tree === undefined) {
		const ofLanguage = inLanguage(language);
		const guardOf = (leaf: string): LanguageGuard => {
			const flagged = flagOf.get(leaf);
			if (flagged === undefined) return languageGuardOf(language, ofLanguage, (rows, value) => readsAs(rows, leaf, value));
			const [path, flag] = flagged;
			return languageGuardOf(language, ofLanguage, (rows, value) => readsAs(rows, path, value) && flagHolds(rows, value, flag));
		};
		runtimeTrees.set(language, (tree = portableTrees<string, LanguageGuard>([...vocabularyPaths, ...flagOf.keys()], guardOf).is));
	}
	return tree;
}

export interface PortableRuntime<API extends LanguageAPI> {
	readonly engine: Engine<API, 'strict'>;
	readonly is: PortableGuardTree<string, LanguageGuard>;
	readonly build: (structure: PortableStructure) => unknown;
}

export async function portableRuntime<API extends LanguageAPI>(engine: Engine<API, 'strict'>): Promise<PortableRuntime<API>> {
	const { language, portable: rows } = engine;
	const hooks = await language.load();
	if (rows === undefined || hooks.portableBuild === undefined) throw new Error(`language "${language.name}" has no portable surface: its grammar has no bindings`);
	const build = portableBuilder({
		language: language.name,
		table: await hooks.portableBuild(),
		builders: engine.build as object,
		kindName: (kind) => engine.trivia.kindName(kind as never),
		readsAs: (path, node) => builtReadsAs(rows, path, node)
	});
	return Object.freeze({ engine, is: portableRuntimeTree(language), build });
}
