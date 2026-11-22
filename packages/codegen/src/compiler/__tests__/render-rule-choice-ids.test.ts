import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';

interface Node {
	readonly type: string;
	readonly id?: string;
	readonly members?: readonly Node[];
	readonly content?: Node;
	readonly separator?: { readonly value: Node };
}

const choicesWithoutId = (rules: Readonly<Record<string, Node>>): string[] => {
	const out: string[] = [];
	const visit = (node: Node, at: string): void => {
		if (node.type === 'CHOICE' && node.id === undefined) out.push(at);
		node.members?.forEach((member, i) => visit(member, `${at}/${i}`));
		if (node.content !== undefined) visit(node.content, `${at}/content`);
		if (node.separator !== undefined) visit(node.separator.value, `${at}/separator`);
	};
	for (const [kind, rule] of Object.entries(rules)) visit(rule, kind);
	return out;
};

describe('a choice in the render rules', () => {
	for (const grammar of allGrammars()) {
		it(
			`${grammar}: carries a rule id, so a fact stamped by the choice's id reaches it`,
			async () => {
				const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar) });
				expect(choicesWithoutId((nodeMap.normalizedRules ?? {}) as Record<string, Node>)).toEqual([]);
			},
			FULL_PIPELINE_TIMEOUT
		);
	}
});
