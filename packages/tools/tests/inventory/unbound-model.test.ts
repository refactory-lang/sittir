import { describe, expect, it } from 'vitest';
import { grammarInput, resolveRoutes, type GrammarInput } from '@sittir/codegen/bindings';
import { compileNodeMap, evaluateGrammar, invoke } from '../../src/codegen-surface.ts';
import { loadInputs } from '../../src/inventory/index.ts';

const memberNames = (input: GrammarInput, kind: string): string[] =>
	(resolveRoutes(input).members.get(kind) ?? []).map((m) => m.name).sort();

describe('the unbound base grammar\'s model', () => {
	it('gives each claimed kind the members the bound model gives it, uncaptured slots included', async () => {
		const [bound] = await loadInputs(['python']);
		const base = await evaluateGrammar('python', { unbound: true });
		const unbound = await grammarInput('python', base, await invoke('nodeModel', 'buildNodeModel', await compileNodeMap('python', { unbound: true })));
		expect(unbound).toBeDefined();
		for (const kind of ['assignment_eq', 'assignment_typed']) expect(memberNames(unbound!, kind)).toEqual(memberNames(bound!, kind));
		expect(memberNames(unbound!, 'assignment_typed')).toContain('type');
		expect(memberNames(unbound!, 'assignment_eq')).not.toContain('type');
	}, 300_000);
});
