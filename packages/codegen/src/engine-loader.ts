import type * as TS from 'web-tree-sitter';

export async function loadWebTreeSitter(): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
}> {
	const mod = await import('web-tree-sitter');
	const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined);
	const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined);
	if (!Parser || !Language) {
		throw new Error('web-tree-sitter: could not locate `Parser` or `Language` export');
	}
	await Parser.init();
	return { Parser, Language };
}
