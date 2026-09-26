import type * as TS from 'web-tree-sitter';

const INIT = Symbol.for('sittir.web-tree-sitter.init');

interface InitSlot {
	[INIT]?: Promise<void>;
}

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
	const slot: typeof Parser & InitSlot = Parser;
	await (slot[INIT] ??= Parser.init());
	return { Parser, Language };
}
