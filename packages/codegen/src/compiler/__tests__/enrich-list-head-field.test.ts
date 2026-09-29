import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FIELD, REPEAT, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { grammarPackage } from '../../grammars.ts';
import { packageEntryPath } from '../resolve-grammar.ts';
import { evaluate } from '../evaluate.ts';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';
import type { RawGrammar } from '../types.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const require = createRequire(import.meta.url);

type Node = { readonly type: string; readonly name?: string; readonly content?: Node; readonly members?: readonly Node[] };

const peelPrec = (rule: Node | undefined): Node | undefined => {
	let cursor = rule;
	while (cursor?.type.startsWith('PREC')) cursor = cursor.content;
	return cursor;
};

function headOnlyListFields(rules: RawGrammar['rules']): string[] {
	const found: string[] = [];
	const visit = (owner: string, rule: Node): void => {
		if (rule.type === SEQ) {
			rule.members!.forEach((member, i) => {
				if (member.type !== FIELD || peelPrec(member.content)?.type !== SYMBOL) return;
				const head = peelPrec(member.content)!.name;
				const repeat = peelPrec(rule.members![i + 1]);
				if (repeat === undefined || !repeat.type.startsWith(REPEAT)) return;
				const tail = peelPrec(repeat.content);
				const bareTail = tail?.type === SEQ && tail.members!.some((m) => peelPrec(m)?.type === SYMBOL && peelPrec(m)!.name === head);
				if (bareTail) found.push(`${owner}: '${member.name}' on ${head}`);
			});
		}
		for (const child of [...(rule.members ?? []), ...(rule.content ? [rule.content] : [])]) visit(owner, child);
	};
	for (const [name, rule] of Object.entries(rules)) visit(name, rule as unknown as Node);
	return found;
}

describe('enrich fields a separated list head together with its tail', () => {
	it('tree-sitter-go: statements carries one field on its head and on every tail element', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-go/grammar.js'), 'go');
		const statements = raw.rules['statements'] as unknown as Node;
		const [head, repeat] = statements.members!;
		const tailElement = repeat!.content!.members!.at(-1)!;
		expect([head!.type, head!.name]).toEqual([FIELD, 'statement']);
		expect([tailElement.type, tailElement.name]).toEqual([FIELD, 'statement']);
		expect(headOnlyListFields(raw.rules)).toEqual([]);
	}, 120_000);

	for (const grammar of ['rust', 'typescript', 'python', 'regex', 'scm']) {
		it(`${grammar}: no list head is fielded apart from its tail`, async () => {
			const raw = await evaluate(packageEntryPath(grammarPackage(grammar)), NO_FILE_TYPES);
			expect(headOnlyListFields(raw.rules)).toEqual([]);
		}, 120_000);
	}

	it('tree-sitter-c: no list head is fielded apart from its tail', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c');
		expect(headOnlyListFields(raw.rules)).toEqual([]);
	}, 120_000);
});
