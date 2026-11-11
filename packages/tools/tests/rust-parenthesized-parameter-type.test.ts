import { describe, expect, it } from 'vitest';
import { languageAt, loadLanguageForGrammar, treeParser, upstreamWasmPath } from '../src/validate/common.ts';

async function parse(source: string): Promise<{ sittir: string; upstream: string }> {
	using sittirParser = treeParser(await loadLanguageForGrammar('rust'));
	using upstreamParser = treeParser(await languageAt(upstreamWasmPath('rust')!));
	using sittir = sittirParser.parse(source);
	using upstream = upstreamParser.parse(source);
	return { sittir: sittir.root.toString(), upstream: upstream.root.toString() };
}

describe('rust reads a parenthesized primitive parameter as a type, as upstream does', () => {
	it.each(['fn f((u8)) {}', 'fn f((u8,)) {}'])('parses `%s` as a tuple_type over primitive_type', async (source) => {
		const { sittir, upstream } = await parse(source);
		expect(upstream).toContain('(parameters (tuple_type (primitive_type)))');
		expect(sittir).not.toContain('ERROR');
		expect(sittir).toContain('(attributed_parameter (tuple_type types: (types item: (primitive_type))))');
	});
});
