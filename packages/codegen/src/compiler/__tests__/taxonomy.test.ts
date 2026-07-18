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
	const normalized = normalizeGrammar(linked);
	nodeMap = assemble(AssembleCtx.from(normalized));
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

	it('returns singleSlot multiple for branch with repeated children', () => {
		// closure_parameters has a sole repeated user-facing slot (its
		// parameter choice), so it classifies singleSlot/multiple.
		//
		// This case originally used `parameters`, expecting its
		// attribute_item child to be filtered as auto-stamped. Under the
		// kind-named-slots unification (docs/superpowers/specs/
		// 2026-05-17-kind-named-slots-design.md) unnamed positional slots
		// get real kind-derived names, and the old "container" shape was
		// absorbed into branch (specs/022-binding-simplify-assemble/
		// data-model.md: "AssembledBranch absorbs Container + Multi").
		// `parameters` now genuinely carries 2 user-facing slots
		// (attribute_item is optional+repeated, so never auto-stamped —
		// stamps only apply to required singular constant slots) and is
		// intentionally multiSlot; the shipped node-model.json5 agrees.
		const node = nodeMap.nodes.get('closure_parameters')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('multiple');
		}
		// The old fixture is now genuinely multi-slot:
		expect(classifyBranchSlots(nodeMap.nodes.get('parameters')!, nodeMap).tag).toBe('multiSlot');
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
		// mut_pattern has child 'mutable_specifier' (required singular
		// constant → auto-stamped) + child 'pattern' (non-stamp). After
		// filtering, only 'pattern' survives → singleSlot singular,
		// required.
		//
		// This case originally used `reference_expression`, but under the
		// kind-named-slots unification its unnamed optional
		// choice(const, mutable_specifier) prefix became a real user-facing
		// `content` slot (two distinct kinds — not a single
		// keyword-presence toggle, so no filter removes it), making
		// reference_expression intentionally multiSlot; the shipped
		// node-model.json5 agrees (slots: content + value).
		const node = nodeMap.nodes.get('mut_pattern')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('singular');
			expect(result.optional).toBe(false);
		}
		// The old fixture is now genuinely multi-slot:
		expect(classifyBranchSlots(nodeMap.nodes.get('reference_expression')!, nodeMap).tag).toBe('multiSlot');
	});

	it('returns multiSlot for non-branch/group model types', () => {
		// _expression is a supertype — not branch or group.
		const node = nodeMap.nodes.get('_expression')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('multiSlot');
	});

	it('returns singleSlot multiple+required for repeated-only branch', () => {
		// tuple_type's sole user-facing slot is its repeated 'type' slot
		// → singleSlot with array multiplicity, required.
		//
		// This case originally used `block`, expecting its label /
		// trailing-expression children to be filtered as auto-stamped.
		// They are optional (never stamped — stamps only apply to required
		// singular constant slots), and under the kind-named-slots
		// unification each is a real named slot (label, statement,
		// trailing_expression), so block is intentionally multiSlot now;
		// the shipped node-model.json5 agrees.
		const node = nodeMap.nodes.get('tuple_type')!;
		expect(node).toBeDefined();
		const result = classifyBranchSlots(node, nodeMap);
		expect(result.tag).toBe('singleSlot');
		if (result.tag === 'singleSlot') {
			expect(result.arity).toBe('multiple');
			expect(result.optional).toBe(false);
		}
		// The old fixture is now genuinely multi-slot:
		expect(classifyBranchSlots(nodeMap.nodes.get('block')!, nodeMap).tag).toBe('multiSlot');
	});
});
