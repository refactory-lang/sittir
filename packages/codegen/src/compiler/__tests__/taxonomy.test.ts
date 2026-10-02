import { describe, it, expect, beforeAll } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { soleSlotFacts } from '../../emitters/shared.ts';
import type { NodeMap } from '../types.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

let nodeMap: NodeMap;

beforeAll(async () => {
	const raw = await evaluatePackage(grammarPackage('rust'), { base: true });
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	nodeMap = assemble(AssembleCtx.from(normalized));
	// Mirror the generate() pipeline: determined slots leave the record
	// before any classification runs.
}, FULL_PIPELINE_TIMEOUT);

describe('soleSlotFacts — the structural sole slot', () => {
	it('is null for a kind with 2+ slots', () => {
		expect(soleSlotFacts(nodeMap.nodes.get('function_item')!, nodeMap)).toBeNull();
		expect(soleSlotFacts(nodeMap.nodes.get('parameters')!, nodeMap)).toBeNull();
		expect(soleSlotFacts(nodeMap.nodes.get('reference_expression')!, nodeMap)).toBeNull();
	});

	it('is the single required slot of a one-slot kind', () => {
		const facts = soleSlotFacts(nodeMap.nodes.get('label')!, nodeMap)!;
		expect(facts.multiple).toBe(false);
		expect(facts.required).toBe(true);
	});

	it('is the repeated slot of a repeated-only kind', () => {
		const facts = soleSlotFacts(nodeMap.nodes.get('closure_parameters')!, nodeMap)!;
		expect(facts.multiple).toBe(true);
	});

	it('is the sole slot left after references to a literal are stripped', () => {
		const facts = soleSlotFacts(nodeMap.nodes.get('mut_pattern')!, nodeMap)!;
		expect(facts.slot.name).toBe('pattern');
		expect(facts.multiple).toBe(false);
	});
});
