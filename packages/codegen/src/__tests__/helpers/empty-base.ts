import type { GrammarJson } from '../../grammar-shapes/grammar-json.ts';

export const emptyBase: GrammarJson = { name: 'empty', rules: {} };

export function baseOf(rules: Record<string, unknown>): GrammarJson {
	return { name: 'base', rules } as GrammarJson;
}
