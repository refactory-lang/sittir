import { describe, expect, it } from 'vitest';
import { seq } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import type { RawGrammar } from '../types.ts';
import type { AssembledBranch } from '../model/node-map.ts';
import {
	classifyChildFactorySurface,
	classifyFactoryShape,
	resolveSingleFieldFactorySlot
} from '../../emitters/shared.ts';
import { runTemplateEmitter } from '../../emitters/templates.ts';

function buildNodeMap(rules: Record<string, unknown>) {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	const raw: RawGrammar = {
		name: 'synth',
		rules: catalogRules,
		ruleCatalog,
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	};
	const normalized = normalizeGrammar(link(raw));
	return assemble(AssembleCtx.from(normalized));
}

function getBranch(nodeMap: ReturnType<typeof buildNodeMap>, kind: string): AssembledBranch {
	const node = nodeMap.nodes.get(kind);
	expect(node?.modelType).toBe('branch');
	if (!node || node.modelType !== 'branch') {
		throw new Error(`expected '${kind}' to assemble as a branch`);
	}
	return node;
}

describe('slot structural signals', () => {
	it('treats fieldless slots as unnamed without consulting origin', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'SYMBOL', name: 'identifier' }),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.fieldName).toBeUndefined();
		expect(slot?.isUnnamed).toBe(true);
	});

	it('projects unnamed-slot parseNames from per-value parseKind, not slot aliasSources', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'ALIAS',
				content: { type: 'SYMBOL', name: 'interface_body' },
				named: true,
				value: 'object_type'
			}),
			interface_body: seq({ type: 'SYMBOL', name: 'identifier' }),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(slot?.values.map((value) => value.parseKind?.name)).toEqual(['object_type']);
		expect(slot?.parseNames).toEqual(['object_type']);
	});

	it('behavior-facing emitters honor isUnnamed', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'SYMBOL', name: 'identifier' }),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(resolveSingleFieldFactorySlot(box, nodeMap)).toBeUndefined();
	});

	it('shared factory classifiers key unnamed-child direct surfaces off isUnnamed', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'SYMBOL', name: 'identifier' }),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(classifyFactoryShape(box, nodeMap)).toBe('direct');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('direct');
	});

	it('shared factory classifiers key unnamed-child spread surfaces off isUnnamed', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'REPEAT1',
				content: { type: 'SYMBOL', name: 'identifier' }
			}),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(classifyFactoryShape(box, nodeMap)).toBe('spread');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('spread');
	});

	it('template preservation treats unnamed alias-carried helper slots structurally', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'ALIAS',
				content: { type: 'SYMBOL', name: '_helper' },
				named: true,
				value: 'obj'
			}),
			_helper: seq({ type: 'SYMBOL', name: 'identifier' }),
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.isUnnamed).toBe(true);

		const templates = runTemplateEmitter({ grammar: 'synth', nodeMap });
		expect(templates.bodies.get('box')).toContain('{{ obj }}');
	});
});
