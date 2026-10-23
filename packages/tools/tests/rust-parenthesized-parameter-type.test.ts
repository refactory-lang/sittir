import { describe, expect, it } from 'vitest';
import { loadLanguageForGrammar, upstreamWasmPath } from '../src/validate/common.ts';

async function parse(source: string): Promise<{ sittir: string; upstream: string }> {
	const { Parser, Language, lang } = await loadLanguageForGrammar('rust');
	const parser = new Parser();
	parser.setLanguage(lang);
	const sittir = parser.parse(source)!.rootNode.toString();
	parser.setLanguage(await Language.load(upstreamWasmPath('rust')!));
	const upstream = parser.parse(source)!.rootNode.toString();
	return { sittir, upstream };
}

describe('rust reads a parenthesized primitive parameter as a type, as upstream does', () => {
	it.each(['fn f((u8)) {}', 'fn f((u8,)) {}'])('parses `%s` as a tuple_type over primitive_type', async (source) => {
		const { sittir, upstream } = await parse(source);
		expect(upstream).toContain('(parameters (tuple_type (primitive_type)))');
		expect(sittir).not.toContain('ERROR');
		expect(sittir).toContain('(attributed_parameter (tuple_type types: (types item: (primitive_type))))');
	});
});
