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

type ApiOf<G extends string> = { readonly [K in keyof LanguageApis]: [G] extends [K] ? LanguageApis[K] : never }[keyof LanguageApis];

export type LanguageOf<G extends string> = [ApiOf<G>] extends [never] ? Language<LanguageAPI> : Language<ApiOf<G>>;

export async function languageByName<G extends string>(name: G): Promise<LanguageOf<G>> {
	const mod = (await import(`@sittir/${name}`)) as { readonly default?: LanguageOf<G> };
	if (mod.default === undefined) throw new Error(`@sittir/${name} exports no language descriptor`);
	return mod.default;
}

