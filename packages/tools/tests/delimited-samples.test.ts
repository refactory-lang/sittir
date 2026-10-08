import { describe, expect, it } from 'vitest';
import { createEngine, hostTemplateFor, applyHost } from '@sittir/common';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { compileGrammar } from '../../codegen/src/compiler/compile.ts';
import { loadGeneratedIdTables } from '../../codegen/src/compiler/generated-metadata.ts';
import { grammarPackage } from '@sittir/codegen/grammars';
import { AbstractAssembledCompound, AssembledPattern, AssembledSupertype } from '../../codegen/src/compiler/model/node-map.ts';
import { patternDfa, shortestAccepted } from '../../codegen/src/compiler/model/pattern-automaton.ts';

const pascal = (kind: string) => kind.replace(/(^|_)([a-z])/g, (_m, _s, c: string) => c.toUpperCase());

describe.each(['python', 'rust', 'typescript'])('%s: every delimited kind, written with its sample delimiters, parses in its host', (grammar) => {
	it('shows the kind spanning the whole sample', async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables: await loadGeneratedIdTables(grammar) });
		const engine: any = await createEngine((await import(`@sittir/${grammar}`)).default);
		const { REPARSE_HOSTS } = await requireGrammarModule(grammar, 'reparse-hosts.ts');
		const supertypes = new Map<string, string[]>();
		for (const node of nodeMap.nodes.values()) {
			if (node instanceof AssembledSupertype) for (const sub of node.subtypeNames) supertypes.set(sub, [...(supertypes.get(sub) ?? []), node.kind]);
		}
		const sampleOf = (end: { text?: string; slot?: string }, rule: unknown): string => {
			if (end.text !== undefined) return end.text;
			const leaf = nodeMap.nodes.get((rule as { name: string }).name);
			return shortestAccepted(patternDfa((leaf as AssembledPattern).textPattern!)!)!;
		};
		let checked = 0;
		for (const [kind, node] of nodeMap.nodes) {
			if (!(node instanceof AbstractAssembledCompound) || node.delimited === undefined) continue;
			const members = (node.renderRule as { members: unknown[] }).members;
			const text = `${sampleOf(node.delimited.open, members[0])}test${sampleOf(node.delimited.close, members.at(-1))}`;
			const template = hostTemplateFor(kind, REPARSE_HOSTS, supertypes, { root: nodeMap.root }) ?? '$r';
			const hosted = applyHost(template, text);
			const root = engine.parse(hosted.text);
			expect(root.$errors, `${kind}: ${JSON.stringify(hosted.text)}`).toHaveLength(0);
			const id = Number(Object.entries(engine.kinds).find(([, name]) => name === pascal(kind))![0]);
			const found = [...engine.query(root).$descendants.ofType(id), ...(root.$trivia?.inner?.() ?? []).filter((n: { $type: number }) => n.$type === id)].find(
				(n: { $span: { start: number } }) => n.$span.start === hosted.offset
			);
			expect(found, `${kind} at ${hosted.offset} in ${JSON.stringify(hosted.text)}`).toBeDefined();
			expect(found.$span.end).toBe(hosted.offset + text.length);
			checked++;
		}
		expect(checked).toBeGreaterThan(0);
	}, 120_000);
});
