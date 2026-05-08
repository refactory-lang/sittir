import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { AssembledBranch } from '../compiler/node-map.ts';
import { emitAll } from '../emitters/emit.ts';
import { TemplateEmitter } from '../emitters/templates.ts';

function makeNodeMap(): NodeMap {
	return {
		name: 'test',
		nodes: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		rules: {},
		externals: new Set(),
		word: undefined,
		polymorphFormKinds: new Set()
	} as unknown as NodeMap;
}

function makeBranch(kind: string, label: string): AssembledBranch {
	const rule: SeqRule = {
		type: 'seq',
		members: [{ type: 'string', value: label }]
	};
	return new AssembledBranch(kind, rule, rule);
}

describe('loop-driven emitters', () => {
	it('store collection state on the instance, not in module globals', () => {
		const nodeMap = makeNodeMap();
		const left = new TemplateEmitter({ grammar: 'rust', nodeMap });
		const right = new TemplateEmitter({ grammar: 'rust', nodeMap });

		left.emitBranch(makeBranch('left_kind', 'left'));
		right.emitBranch(makeBranch('right_kind', 'right'));

		expect(left.finalize().bodies.has('left_kind')).toBe(true);
		expect(left.finalize().bodies.has('right_kind')).toBe(false);
		expect(right.finalize().bodies.has('right_kind')).toBe(true);
		expect(right.finalize().bodies.has('left_kind')).toBe(false);
	});

	it('emitAll creates fresh loop-driven emitter instances per run', () => {
		const nodeMap = {
			name: 'test',
			nodes: new Map(),
			signatures: { signatures: new Map() },
			derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
			rules: {},
			externals: new Set(),
			word: undefined,
			polymorphFormKinds: new Set()
		} as any;

		const first = emitAll({ grammar: 'rust', nodeMap });
		const second = emitAll({ grammar: 'rust', nodeMap });

		expect(first.jinjaTemplates.bodies).not.toBe(second.jinjaTemplates.bodies);
	});
});
