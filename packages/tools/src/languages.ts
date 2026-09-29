import type { Language, LanguageAPI } from '@sittir/types';
import type { PythonAPI } from '@sittir/python';
import type { RegexAPI } from '@sittir/regex';
import type { RustAPI } from '@sittir/rust';
import type { ScmAPI } from '@sittir/scm';
import type { TypescriptAPI } from '@sittir/typescript';

export interface LanguageApis {
	readonly python: PythonAPI;
	readonly regex: RegexAPI;
	readonly rust: RustAPI;
	readonly scm: ScmAPI;
	readonly typescript: TypescriptAPI;
}

export function languageByName<G extends keyof LanguageApis>(name: G): Promise<Language<LanguageApis[G]>>;
export function languageByName(name: string): Promise<Language<LanguageAPI>>;
export async function languageByName(name: string): Promise<Language<LanguageAPI>> {
	const mod = (await import(`@sittir/${name}`)) as { readonly default?: Language<LanguageAPI> };
	if (mod.default === undefined) throw new Error(`@sittir/${name} exports no language descriptor`);
	return mod.default;
}
