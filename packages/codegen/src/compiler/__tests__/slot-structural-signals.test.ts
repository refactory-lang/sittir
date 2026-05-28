import { describe, expect, it } from 'vitest';
import { seq } from '../evaluate.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import { link } from '../link.ts';
import { optimize } from '../optimize.ts';
import { assemble } from '../assemble.ts';
import type { RawGrammar } from '../types.ts';
import type { AssembledBranch, AssembledNonterminal } from '../node-map.ts';
import { classifyChildFactorySurface, classifyFactoryShape, resolveSingleFieldFactorySlot } from '../../emitters/shared.ts';
import { hasSingularNativeChildrenTransport } from '../../emitters/render-module.ts';
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
		references: [],
	};
	return assemble(optimize(link(raw)));
}

function getBranch(nodeMap: ReturnType<typeof buildNodeMap>, kind: string): AssembledBranch {
	const node = nodeMap.nodes.get(kind);
	expect(node?.modelType).toBe('branch');
	if (!node || node.modelType !== 'branch') {
		throw new Error(`expected '${kind}' to assemble as a branch`);
	}
	return node;
}

function setSlotSource(slot: AssembledNonterminal, source: AssembledNonterminal['source']): void {
	(slot as unknown as { source: AssembledNonterminal['source'] }).source = source;
}

describe('slot structural signals', () => {
	it('treats fieldless slots as unnamed without consulting origin', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.fieldName).toBeUndefined();
		expect(slot?.isUnnamed).toBe(true);
	});

	it('projects unnamed-slot parseNames from per-value parseKind, not slot aliasSources', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'alias',
				content: { type: 'symbol', name: 'interface_body' },
				named: true,
				value: 'object_type',
			}),
			interface_body: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(slot?.values.map((value) => value.parseKind?.name)).toEqual(['object_type']);
		expect(slot?.parseNames).toEqual(['object_type']);
	});

	it('behavior-facing emitters honor isUnnamed even if source drifts', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(resolveSingleFieldFactorySlot(box, nodeMap)).toBeUndefined();
		expect(hasSingularNativeChildrenTransport(box)).toBe(true);

		setSlotSource(slot!, 'grammar');

		expect(slot?.isUnnamed).toBe(true);
		expect(resolveSingleFieldFactorySlot(box, nodeMap)).toBeUndefined();
		expect(hasSingularNativeChildrenTransport(box)).toBe(true);
	});

	it('shared factory classifiers key unnamed-child direct surfaces off isUnnamed', () => {
		const nodeMap = buildNodeMap({
			box: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(classifyFactoryShape(box, nodeMap)).toBe('direct');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('direct');

		setSlotSource(slot!, 'grammar');

		expect(classifyFactoryShape(box, nodeMap)).toBe('direct');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('direct');
	});

	it('shared factory classifiers key unnamed-child spread surfaces off isUnnamed', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'repeat1',
				content: { type: 'symbol', name: 'identifier' },
			}),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const box = getBranch(nodeMap, 'box');
		const slot = box.fields[0];
		expect(slot?.isUnnamed).toBe(true);
		expect(classifyFactoryShape(box, nodeMap)).toBe('spread');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('spread');

		setSlotSource(slot!, 'grammar');

		expect(classifyFactoryShape(box, nodeMap)).toBe('spread');
		expect(classifyChildFactorySurface(box, nodeMap)).toBe('spread');
	});

	it('template preservation treats unnamed alias-carried helper slots structurally', () => {
		const nodeMap = buildNodeMap({
			box: seq({
				type: 'alias',
				content: { type: 'symbol', name: '_helper' },
				named: true,
				value: 'obj',
			}),
			_helper: seq({ type: 'symbol', name: 'identifier' }),
			identifier: { type: 'pattern', value: '[a-z_]\\w*' },
		});
		const slot = getBranch(nodeMap, 'box').fields[0];
		expect(slot?.isUnnamed).toBe(true);

		setSlotSource(slot!, 'grammar');

		const templates = runTemplateEmitter({ grammar: 'synth', nodeMap });
		expect(templates.bodies.get('box')).toContain('{{ obj }}');
	});
});
