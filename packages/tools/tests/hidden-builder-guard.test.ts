import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { compileGrammar } from '../../codegen/src/compiler/compile.ts';
import { loadGeneratedIdTables } from '../../codegen/src/compiler/generated-metadata.ts';
import { grammarPackage, type GrammarName } from '../../codegen/src/grammars.ts';
import { loadNodeModel } from '../src/validate/common.ts';
import python from '../../python/src/index.ts';
import regex from '../../regex/src/index.ts';
import rust from '../../rust/src/index.ts';
import scm from '../../scm/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const ENGINES = {
	python: () => createEngine(python),
	regex: () => createEngine(regex),
	rust: () => createEngine(rust),
	scm: () => createEngine(scm),
	typescript: () => createEngine(typescript)
} as const;

// A kind is never a node when the parser never shows it: it is hidden on the surface, is not a
// supertype, and no named alias in a parent rule uses it as content, so no alias site gives it a CST
// node. A builder for such a kind is a builder for nothing the parser produces, so there must be none.
// Builders at alias sites stay, since their kinds are real nodes.
async function neverNodeBuilders(grammar: keyof typeof ENGINES): Promise<string[]> {
	const engine = await ENGINES[grammar]();
	const { builderPaths } = await loadNodeModel(grammar);
	const compilation = await compileGrammar({
		package: grammarPackage(grammar as GrammarName),
		generatedIdTables: await loadGeneratedIdTables(grammar)
	});
	const neverNode = (kind: string): boolean => {
		const node = compilation.nodeMap.nodes.get(kind);
		return node !== undefined && node.surfaceHidden === true && node.modelType !== 'supertype' && !compilation.linked.parentAliasedKinds?.has(kind);
	};
	const offending: string[] = [];
	for (const [kind, path] of Object.entries(builderPaths)) {
		const builder = path.reduce<unknown>((at, segment) => (at as Record<string, unknown> | undefined)?.[segment], engine.build);
		if (typeof builder === 'function' && neverNode(kind)) offending.push(`${path.join('.')} (kind ${kind})`);
	}
	return offending;
}

describe('hidden-kind builders', () => {
	for (const grammar of Object.keys(ENGINES) as (keyof typeof ENGINES)[]) {
		it(`${grammar}: no builder exists for a kind the parser never shows as a node`, async () => {
			const offending = await neverNodeBuilders(grammar);
			expect(offending, `${grammar} builders for never-node kinds:\n${offending.join('\n')}`).toEqual([]);
		}, 240_000);
	}
});
