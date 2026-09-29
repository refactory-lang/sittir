import type { Language, LanguageAPI } from '@sittir/types';

export async function languageByName(name: string): Promise<Language<LanguageAPI>> {
	const mod = (await import(`@sittir/${name}`)) as { readonly default?: Language<LanguageAPI> };
	if (mod.default === undefined) throw new Error(`@sittir/${name} exports no language descriptor`);
	return mod.default;
}
