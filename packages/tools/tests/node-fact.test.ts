// A node is an object holding a source stamp or a tree token, and nothing
// else makes one: every node read from a grammar's corpus is a node, while
// its string-key twin — the same `$type`, slots and text, without the stamp
// or the token — is not. Built nodes are pinned the same way, per kind, by
// each grammar's generated nodes test. Each wire a parse can be read through
// is one entry of `WIRES`.
import { describe, expect, it } from 'vitest';
import type { Language, LanguageAPI } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { isCoordinate, isNode } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries, walkWrappedTree } from '../src/validate/common.ts';

interface Parser {
	parse(source: string): unknown;
}

const GRAMMARS: readonly string[] = ['python', 'regex', 'rust', 'scm', 'typescript'];
const WIRES: Readonly<Record<string, (language: Language<LanguageAPI>) => Promise<Parser>>> = {
	object: (language) => createEngine(language)
};

function readNodeFact(
	engine: Parser,
	grammar: string
): { read: number; unrecognised: string[]; twinsRecognised: string[] } {
	const unrecognised: string[] = [];
	const twinsRecognised: string[] = [];
	let read = 0;
	for (const entry of loadCorpusEntries(grammar)) {
		walkWrappedTree(engine.parse(entry.source), (node) => {
			if (isCoordinate(node)) return;
			read++;
			const at = `${entry.name}: ${node.$type}`;
			if (!isNode(node)) unrecognised.push(at);
			if (isNode(Object.fromEntries(Object.entries(node)))) twinsRecognised.push(at);
		});
	}
	return { read, unrecognised, twinsRecognised };
}

for (const [wire, engineOf] of Object.entries(WIRES)) {
	describe(`the node fact over every read node of the corpus, ${wire} wire`, () => {
		for (const grammar of GRAMMARS) {
			it(`${grammar}: a read node is a node, and its string-key twin is not`, async () => {
				const { read, unrecognised, twinsRecognised } = readNodeFact(
					await engineOf(await languageByName(grammar)),
					grammar
				);
				expect(read).toBeGreaterThan(0);
				expect(unrecognised).toEqual([]);
				expect(twinsRecognised).toEqual([]);
			});
		}
	});
}
