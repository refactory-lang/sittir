import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { grammarPackageDir, isGrammar } from '@sittir/codegen/grammars';
import type { ReparseHosts } from '@sittir/common';
import type { TokenInterior, TreeHandle } from '@sittir/common/utils';
import type { QuerySlots, TriviaFacts } from '@sittir/types';

export type FactoryEntry = ((...args: any[]) => unknown) | number | object;
export type Hydrate = (value: unknown, tree: TreeHandle, depth?: number) => unknown;

export interface GrammarModules {
	'types.ts': {
		readonly TSKindId: Readonly<Record<string | number, string | number>>;
		readonly KIND_NAMES: ReadonlyMap<number, string>;
		readonly KIND_DISPLAY_NAMES: ReadonlyMap<number, string>;
		kindIdFromName(name: string): number;
	};
	'factories/raw.ts': Readonly<Record<string, unknown>> & { readonly _factoryMap: Record<string, FactoryEntry> };
	'factories/records.ts': Readonly<Record<string, unknown>>;
	'factories/coerce.ts': { readonly _fromMap: Record<string, (input: unknown) => unknown> };
	'wrap.ts': {
		wrapNode(data: unknown, tree: TreeHandle): unknown;
		readonly hydrate: Hydrate;
	};
	'ir.ts': { readonly ir: Record<string, unknown> };
	'consts.ts': { readonly TOKEN_INTERIORS: Readonly<Record<string, TokenInterior>> };
	'reparse-hosts.ts': { readonly REPARSE_HOSTS: ReparseHosts };
	'utils.ts': { readonly triviaFacts: TriviaFacts; readonly querySlots: QuerySlots };
}

const DECLARED_EXPORTS = {
	'types.ts': ['TSKindId', 'KIND_NAMES', 'KIND_DISPLAY_NAMES', 'kindIdFromName'],
	'factories/raw.ts': ['_factoryMap'],
	'factories/records.ts': ['_factoryMap'],
	'factories/coerce.ts': ['_fromMap'],
	'wrap.ts': ['wrapNode', 'hydrate'],
	'ir.ts': ['ir'],
	'consts.ts': ['TOKEN_INTERIORS'],
	'reparse-hosts.ts': ['REPARSE_HOSTS'],
	'utils.ts': ['triviaFacts', 'querySlots']
} as const satisfies { readonly [K in keyof GrammarModules]: readonly (keyof GrammarModules[K] & string)[] };

export type GrammarFile = keyof GrammarModules | 'node-model.json5' | 'factories/bundle.ts' | 'factories/objects.ts';

export function grammarModulePath(grammar: string, file: GrammarFile): string | undefined {
	if (!isGrammar(grammar)) return undefined;
	const path = join(grammarPackageDir(grammar), 'src', file);
	return existsSync(path) ? path : undefined;
}

export async function importGrammarModule<K extends keyof GrammarModules>(
	grammar: string,
	file: K
): Promise<GrammarModules[K] | undefined> {
	const path = grammarModulePath(grammar, file);
	if (path === undefined) return undefined;
	const module: Readonly<Record<string, unknown>> = await import(pathToFileURL(path).href);
	const missing = DECLARED_EXPORTS[file].find((name) => module[name] === undefined);
	if (missing !== undefined) throw new Error(`grammar '${grammar}' src/${file} has no export '${missing}'`);
	return module as GrammarModules[K];
}

export async function requireGrammarModule<K extends keyof GrammarModules>(
	grammar: string,
	file: K
): Promise<GrammarModules[K]> {
	const module = await importGrammarModule(grammar, file);
	if (module === undefined) throw new Error(`grammar '${grammar}' has no generated src/${file}`);
	return module;
}
