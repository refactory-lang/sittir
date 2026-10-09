import { beforeAll, describe, expect, it } from 'vitest';
import { REPARSE_HOSTS } from '../../../../rust/src/reparse-hosts.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import type { NodeMap } from '../types.ts';
import { AssembledList, type AssembledNode } from '../model/node-map.ts';
import {
	factoryTakesSpreadChildren,
	fromForwardsToChildFactory,
	classifyFactoryShape,
	resolveFactoryFieldNames,
	soleSlotFacts
} from '../../emitters/shared.ts';
import { buildFactoryMap } from '../../emitters/factory-map.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

let nodeMap: NodeMap;
let typescriptNodeMap: NodeMap;
let pythonNodeMap: NodeMap;

// Same entry-path resolution the real pipeline uses (see
// regen-templates-rs.ts): the grammar.sittir.ts overrides entry when it
// exists, raw grammar.js otherwise. The factory surface under test is the
// override-resolved one — the raw grammar lacks override-declared fields
// (e.g. rust self_parameter's `reference`), which changes shape
// classification.
async function assembleGrammar(grammar: string): Promise<NodeMap> {
	const raw = await evaluatePackage(grammarPackage(grammar));
	const normalized = normalizeGrammar(link(raw));
	const nodeMap = assemble(AssembleCtx.from(normalized));
	// Mirror the generate() pipeline: determined slots leave the record
	// before any classification runs.
	return nodeMap;
}

beforeAll(async () => {
	nodeMap = await assembleGrammar('rust');
	typescriptNodeMap = await assembleGrammar('typescript');
	pythonNodeMap = await assembleGrammar('python');
});

function expectDirect(node: AssembledNode, nodeMap: NodeMap): void {
	expect(fromForwardsToChildFactory(node, nodeMap)).toBe(true);
	expect(factoryTakesSpreadChildren(node, nodeMap)).toBe(false);
}

describe('child factory surface classification', () => {
	it('detects spread child factories from inferred-only branches', () => {
		// reference_expression_raw_const is a direct container: a flattened
		// variant whose only slot is its `value` field. token_tree_paren is a hoisted
		// arm whose sole slot is the fielded token repeat: a sole slot's arity
		// decides the surface regardless of field-name presence and of
		// hoisting, so it is a spread child surface like declaration_list,
		// whose sole slot is a NAMED list (declaration_statements).
		expectDirect(nodeMap.nodes.get('reference_expression_raw_const')!, nodeMap);
		expect(factoryTakesSpreadChildren(nodeMap.nodes.get('token_tree_paren')!, nodeMap)).toBe(true);
		expect(factoryTakesSpreadChildren(nodeMap.nodes.get('declaration_list')!, nodeMap)).toBe(true);
	});

	it('detects direct unnamed-child factories from inferred single-slot branches', () => {
		// Originally asserted 'direct' for attribute. attribute's slots are
		// now real named fields (path/value/arguments — see the committed
		// node-model.json5 factoryFields), so it takes a config object, not
		// a direct unnamed child. expression_statement is a current
		// inferred single-unnamed-slot branch.
		expectDirect(nodeMap.nodes.get('expression_statement')!, nodeMap);
		expect(fromForwardsToChildFactory(nodeMap.nodes.get('attribute')!, nodeMap)).toBe(false);
	});

	it('excludes field-backed direct factories from the child surface', () => {
		expect(fromForwardsToChildFactory(nodeMap.nodes.get('binary_expression')!, nodeMap)).toBe(false);
	});

	it('keeps the config surface when markers accompany a sole named user slot', () => {
		// The factories emitter only emits a direct-value signature when the
		// sole user slot is also the node's ONLY non-stamped field — a
		// keyword-presence marker (reference/move/mutable_specifier)
		// is caller-settable surface a direct signature has nowhere to
		// accept, so these kinds' generated factories take a config object.
		// The shape metadata must agree, or the validator (and any other
		// shape consumer) calls a config factory with a bare value and every
		// marker silently drops.
		expect(classifyFactoryShape(nodeMap.nodes.get('self_parameter')!, nodeMap)).toBe('config');
		expect(classifyFactoryShape(nodeMap.nodes.get('async_block')!, nodeMap)).toBe('config');
		expect(classifyFactoryShape(nodeMap.nodes.get('gen_block')!, nodeMap)).toBe('config');
		expect(classifyFactoryShape(nodeMap.nodes.get('reference_pattern')!, nodeMap)).toBe('config');
		// Marker-free single-field kinds keep the ergonomic direct shape
		// (mut_pattern's `mut` is determined — grammar-fixed template text).
		expect(classifyFactoryShape(nodeMap.nodes.get('await_expression')!, nodeMap)).toBe('direct');
		expect(classifyFactoryShape(nodeMap.nodes.get('mut_pattern')!, nodeMap)).toBe('direct');
	});

	it('has no sole slot when markers sit beside the payload', () => {
		// A field pattern's named variant carries the whole arm: ref,
		// mutable_specifier, name and pattern, so the kind is a branch with a
		// config surface, never a container that positions one child.
		expect(soleSlotFacts(nodeMap.nodes.get('_field_pattern_named')!, nodeMap)).toBeNull();
	});

	it('classifies multi-user-slot branches as config', () => {
		// python comparison_operator's surface is two real user slots
		// (left, comparators — its operators are a filtered keyword-presence
		// field), and typescript lexical_declaration's 'kind' slot (let|const)
		// is a per-slot enum field. Both are config-shaped; matches the
		// committed node-model.json5 factoryShape/factoryFields.
		expect(classifyFactoryShape(pythonNodeMap.nodes.get('comparison_operator')!, pythonNodeMap)).toBe('config');
		expect(classifyFactoryShape(typescriptNodeMap.nodes.get('lexical_declaration')!, typescriptNodeMap)).toBe('config');
		// Spread survives keyword-presence/hidden-infra filtering: python
		// string_content's non-payload entries are filtered slots, leaving
		// the repeated unnamed content children -> spread (committed shape).
		expect(classifyFactoryShape(pythonNodeMap.nodes.get('string_content')!, pythonNodeMap)).toBe('spread');
	});
});

describe('factory field metadata', () => {
	it('includes field-backed direct factories even when auto-stamp children are present', () => {
		// reference_expression_raw_mut carries the auto-stamped
		// mutable_specifier child beside its `value` field; the presence
		// toggle is filtered and the field remains.
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('reference_expression_raw_mut')!)).toEqual(['value']);
	});

	it('keeps enum-valued operator fields in validator field metadata', () => {
		// Originally expected 'operator' to be filtered as keyword-presence.
		// Under universal per-slot enums, binary_expression's operator is a
		// kind-enum field on the factory surface (the generated
		// buildBinaryExpression takes config.operator via
		// coerceKindEnumStorage), so it belongs in the metadata. Matches the
		// committed node-model.json5 factoryFields.
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('binary_expression')!)).toEqual(['left', 'operator', 'right']);
	});

	it('propagates the shared field metadata into factory-map output', () => {
		const map = buildFactoryMap(nodeMap);
		// Expectations updated to the current factory surfaces (see the two
		// cases above); attribute gained real named fields under the
		// kind-named-slots unification. All three match the committed
		// node-model.json5 factoryFields.
		expect(map.factoryFields.reference_expression_raw_mut).toEqual(['value']);
		expect(map.factoryFields.binary_expression).toEqual(['left', 'operator', 'right']);
		expect(map.factoryFields.attribute).toEqual(['path', 'input']);
	});
});

describe('terminated separated lists', () => {
	const needsTrailing = (kind: string, map: NodeMap = nodeMap): boolean => {
		const node = map.nodes.get(kind);
		return node instanceof AssembledList && node.singleElementNeedsTrailing;
	};

	it('a list whose first element carries a required separator needs it when it has one element', () => {
		expect(needsTrailing('expressions')).toBe(true);
	});

	it('the same list written as a choice after the first element needs it too', () => {
		expect(needsTrailing('expression_list', pythonNodeMap)).toBe(true);
		expect(needsTrailing('pattern_list', pythonNodeMap)).toBe(true);
	});

	it('a list with an optional trailing separator and no required one does not', () => {
		expect(needsTrailing('types')).toBe(false);
	});

	it('Python tuple pattern lists require the singleton comma', () => {
		expect(needsTrailing('tuple_pattern_elements', pythonNodeMap)).toBe(true);
	});

	it("the factory accepts one element; the requirement is the render template's", () => {
		expect(
			emitFactories({
				grammar: 'rust',
				nodeMap,
				reparseHosts: REPARSE_HOSTS,
				triviaKinds: ['block_comment', 'line_comment']
			})
		).not.toContain('requires a trailing delimiter');
	});
});
