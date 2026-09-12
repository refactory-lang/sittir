import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { collectCatalogKinds, collectKindEntries } from '../kind-discriminant.ts';
import { evaluate } from '../../compiler/evaluate.ts';
import { link } from '../../compiler/link.ts';
import { normalizeGrammar } from '../../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../../compiler/resolve-grammar.ts';
import { loadGrammarJsonAliasMap } from '../../compiler/inline-sets.ts';
import { deriveGeneratedIdTablesFromParserCSource } from '../../compiler/generated-metadata.ts';

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url)).replace(/\/$/, '');

describe('is_text_kind', () => {
	it('names every pattern and enum kind and no token kind', async () => {
		const grammar = 'rust';
		const overridesPath = resolveOverridesPath(grammar);
		const entryPath = existsSync(overridesPath) ? overridesPath : resolveGrammarJsPath(grammar);
		const raw = await evaluate(entryPath);
		const parserCPath = resolve(repoRoot, 'packages', grammar, '.sittir', 'src', 'parser.c');
		const generatedIdTables = await deriveGeneratedIdTablesFromParserCSource(
			readFileSync(parserCPath, 'utf8'),
			`packages/${grammar}/.sittir/src/parser.c`
		);
		const linked = link(raw, { generatedIdTables });
		const nodeMap = assemble(
			AssembleCtx.from(normalizeGrammar(linked), generatedIdTables, undefined, loadGrammarJsonAliasMap(grammar))
		);
		const entries = collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables);
		const idOf = (kind: string): number => {
			const id = entries.find((entry) => entry.kind === kind)?.id;
			if (id === undefined) throw new Error(`no kind entry for ${kind}`);
			return id;
		};

		const source = emitKindIdRust({ grammar, nodeMap, generatedIdTables });
		expect(source).toContain('pub fn is_text_kind(kind: KindId) -> bool {');
		const arms = source.slice(source.indexOf('pub fn is_text_kind'));
		const ids = new Set(
			(arms.slice(arms.indexOf('matches!(kind.0,'), arms.indexOf(')\n}')).match(/\d+/g) ?? []).map(Number)
		);
		// identifier is `pattern`-modeled: free text with nothing else to render from.
		expect(ids.has(idOf('identifier'))).toBe(true);
		// fragment_specifier is `enum`-modeled: its content is which literal it holds.
		expect(ids.has(idOf('fragment_specifier'))).toBe(true);
		// mutable_specifier is `token`-modeled: it renders its declared literal.
		expect(ids.has(idOf('mutable_specifier'))).toBe(false);
		// function_item is a branch: it rebuilds from its slots.
		expect(ids.has(idOf('function_item'))).toBe(false);
	});
});
