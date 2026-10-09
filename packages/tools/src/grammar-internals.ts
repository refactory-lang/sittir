import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { grammarPackageDir, isGrammar } from '@sittir/codegen/grammars';
import type { ReparseHosts } from '@sittir/common';
import type { TokenInterior, TreeHandle } from '@sittir/common/utils';
import type { TriviaFacts } from '@sittir/types';

export type FactoryEntry = ((...args: any[]) => unknown) | number | object;
export type Hydrate = (value: unknown, tree: TreeHandle, depth?: number) => unknown;

export interface GrammarModules {
	'types.ts': {
		readonly TSKindId: Readonly<Record<string | number, string | number>>;
		readonly KIND_NAMES: ReadonlyMap<number, string>;
		readonly KIND_DISPLAY_NAMES: ReadonlyMap<number, string>;
		kindIdFromName(name: string): number;
		kindNameFromId(id: number): string;
	};
	'factories/raw.ts': Readonly<Record<string, unknown>> & { readonly _factoryMap: Record<string, FactoryEntry> };
	'factories/coerce.ts': { readonly _fromMap: Record<string, (input: unknown) => unknown> };
	'wrap.ts': {
		wrapNode(data: unknown, tree: TreeHandle): unknown;
		readonly hydrate: Hydrate;
	};
	'ir.ts': { readonly ir: Record<string, unknown> };
	'consts.ts': { readonly TOKEN_INTERIORS: Readonly<Record<string, TokenInterior>> };
	'reparse-hosts.ts': { readonly REPARSE_HOSTS: ReparseHosts };
	'utils.ts': { readonly triviaFacts: TriviaFacts };
}

export type GrammarFile = keyof GrammarModules | 'node-model.json5' | 'factories/bundle.ts';

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
	return path === undefined ? undefined : import(pathToFileURL(path).href);
}

export async function requireGrammarModule<K extends keyof GrammarModules>(
	grammar: string,
	file: K
): Promise<GrammarModules[K]> {
	const module = await importGrammarModule(grammar, file);
	if (module === undefined) throw new Error(`grammar '${grammar}' has no generated src/${file}`);
	return module;
}
