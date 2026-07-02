import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { resolveGrammarJsPath } from '../resolve-grammar.ts';
import { classifyBranchSlots } from '../../emitters/shared.ts';
import type { NodeMap } from '../types.ts';

// Raw base grammars (no override() / variant() applied) still contain
// non-canonical shapes that would trip the derive-audit default. Switch
// to report mode for this file.
let _prevAudit: string | undefined;
beforeAll(() => {
	_prevAudit = process.env.SITTIR_AUDIT_DERIVE;
	process.env.SITTIR_AUDIT_DERIVE = '1';
});
afterAll(() => {
	if (_prevAudit === undefined) delete process.env.SITTIR_AUDIT_DERIVE;
	else process.env.SITTIR_AUDIT_DERIVE = _prevAudit;
});

let nodeMap: NodeMap;

beforeAll(async () => {
	const grammar = resolveGrammarJsPath('rust');
	const raw = await evaluate(grammar);
	const linked = link(raw);
	const optimized = normalizeGrammar(linked);
	nodeMap = assemble(optimized, AssembleCtx.from(optimized));
});

describe('classifyBranchSlots', () => {
	it('returns multiSlot for nodes with 2+ non-stamp slots', () => {
		// function_item has 5 user-facing fields (name, type_parameters,
		// parameters, return_type, body) — all 3 children are auto-stamped.
		const node = nodeMap.nodes.get('function_item')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('multiSlot');
	});

	it('returns singleSlot singular for single-child branch', () => {
		// label has 1 child (identifier) which is the sole user-facing slot.
		const node = nodeMap.nodes.get('label')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('singular');
			expect(result.optional).toBe(false);
		}
	});

	it('returns singleSlot multiple for container with repeated children', () => {
		// parameters has 2 children: attribute_item (auto-stamped) and
		// parameter (repeated, non-stamp) — sole user-facing slot.
		const node = nodeMap.nodes.get('parameters')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('multiple');
		}
	});

	it('returns multiSlot for nodes with fields + non-stamp children', () => {
		// tuple_struct_pattern has field 'type' + child 'pattern' — both
		// non-stamp, so it's multiSlot.
		const node = nodeMap.nodes.get('tuple_struct_pattern')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('multiSlot');
	});

	it('excludes auto-stamp children from slot count', () => {
		// reference_expression has field 'value' (non-stamp) + child
		// 'mutable_specifier' (auto-stamped). After filtering, only
		// 'value' survives → singleSlot singular, required.
		const node = nodeMap.nodes.get('reference_expression')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('singular');
			expect(result.optional).toBe(false);
		}
	});

	it('returns multiSlot for non-branch/group model types', () => {
		// _expression is a supertype — not branch or group.
		const node = nodeMap.nodes.get('_expression')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('multiSlot');
	});

	it('returns singleSlot multiple for container-shape branch', () => {
		// block has 3 children: label (stamped), statement (non-stamp,
		// repeated), expression (stamped). Sole user-facing slot is
		// 'statement' with array multiplicity.
		const node = nodeMap.nodes.get('block')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('multiple');
			expect(result.optional).toBe(false);
		}
	});
});
