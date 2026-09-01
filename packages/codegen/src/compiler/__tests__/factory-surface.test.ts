import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { existsSync } from 'node:fs';
import { resolveGrammarJsPath, resolveOverridesPath } from '../resolve-grammar.ts';
import type { NodeMap } from '../types.ts';
import type { AssembledNode } from '../model/node-map.ts';
import {
	factoryTakesSpreadChildren,
	wrapExposesChildren,
	classifyFactoryShape,
	resolveFactoryFieldNames,
	soleSlotFacts
} from '../../emitters/shared.ts';
import { buildFactoryMap } from '../../emitters/factory-map.ts';

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
let typescriptNodeMap: NodeMap;
let pythonNodeMap: NodeMap;

// Same entry-path resolution the real pipeline uses (see
// regen-templates-rs.ts): the grammar.sittir.ts overrides entry when it
// exists, raw grammar.js otherwise. The factory surface under test is the
// override-resolved one — the raw grammar lacks override-declared fields
// (e.g. rust self_parameter's `reference`), which changes shape
// classification.
async function assembleGrammar(grammar: string): Promise<NodeMap> {
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : resolveGrammarJsPath(grammar);
	const raw = await evaluate(entryPath);
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
	expect(wrapExposesChildren(node, nodeMap)).toBe(true);
	expect(factoryTakesSpreadChildren(node, nodeMap)).toBe(false);
}

describe('child factory surface classification', () => {
	it('detects spread child factories from inferred-only branches', () => {
		// array_expression is a committed direct container (single unnamed
		// child, the _array_expression_* group). _token_tree_paren used to be
		// the committed spread exemplar, but the token-tree repeats are now
		// FIELDED (grammar.sittir.ts: `{ '0/1': field('tokens') }` etc.) so
		// the native read keys every element into one ordered array instead
		// of per-kind buckets — a named slot, hence no child surface (the
		// spread shape itself stays pinned via python string_content below).
		// declaration_list's sole slot is a NAMED list (declaration_statements):
		// a sole slot's arity decides the surface regardless of field-name
		// presence, so it is a spread child surface.
		expectDirect(nodeMap.nodes.get('array_expression')!, nodeMap);
		expect(wrapExposesChildren(nodeMap.nodes.get('_token_tree_paren')!, nodeMap)).toBe(false);
		expect(factoryTakesSpreadChildren(nodeMap.nodes.get('declaration_list')!, nodeMap)).toBe(true);
	});

	it('detects direct unnamed-child factories from inferred single-slot branches', () => {
		// Originally asserted 'direct' for attribute. attribute's slots are
		// now real named fields (path/value/arguments — see the committed
		// node-model.json5 factoryFields), so it takes a config object, not
		// a direct unnamed child. expression_statement is a current
		// inferred single-unnamed-slot branch.
		expectDirect(nodeMap.nodes.get('expression_statement')!, nodeMap);
		expect(wrapExposesChildren(nodeMap.nodes.get('attribute')!, nodeMap)).toBe(false);
	});

	it('excludes field-backed direct factories from the child surface', () => {
		expect(wrapExposesChildren(nodeMap.nodes.get('reference_expression')!, nodeMap)).toBe(false);
	});

	it('keeps the config surface when markers accompany a sole named user slot', () => {
		// The factories emitter only emits a direct-value signature when the
		// sole user slot is also the node's ONLY non-stamped field — a
		// keyword-presence marker (reference/move_marker/mutable_specifier)
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
		// field_pattern's slots are [ref_marker, mutable_specifier, content]:
		// three slots, so the kind is a branch with a config surface, never a
		// container that positions one child.
		expect(soleSlotFacts(nodeMap.nodes.get('field_pattern')!, nodeMap)).toBeNull();
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
		// 'content' joined 'value' when reference_expression's unnamed
		// optional choice(const, mutable_specifier) prefix became a real
		// user-facing slot under the kind-named-slots unification (two
		// distinct kinds — not a single keyword-presence toggle, so no
		// filter removes it). Matches the committed node-model.json5
		// factoryFields and the generated buildReferenceExpression config.
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('reference_expression')!)).toEqual(['content', 'value']);
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
		expect(map.factoryFields.reference_expression).toEqual(['content', 'value']);
		expect(map.factoryFields.binary_expression).toEqual(['left', 'operator', 'right']);
		expect(map.factoryFields.attribute).toEqual(['path', 'attribute_arm']);
	});
});

describe('terminated separated lists', () => {
	it('rust tuple_expression_elements asserts the single-element trailing delimiter (terminated-list invariant)', () => {
		const src = emitFactories({ grammar: 'rust', nodeMap });
		const fnStart = src.indexOf('function _buildTupleExpressionElements(');
		expect(fnStart).toBeGreaterThan(-1);
		const body = src.slice(fnStart, src.indexOf('\n}\n', fnStart));
		expect(body).toContain(
			'elements.length === 1 && ((options.delimiter ?? Delimiter.None) & Delimiter.Trailing) === 0'
		);
		expect(body).toContain('requires a trailing delimiter');
		// A prefix-style list (optional trailing comma, no mandatory head) must NOT carry the assert.
		const tt = src.indexOf('function _buildTupleTypeElements(');
		expect(src.slice(tt, src.indexOf('\n}\n', tt))).not.toContain('requires a trailing delimiter');
	});
});
