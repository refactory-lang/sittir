import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { resolveGrammarJsPath } from '../resolve-grammar.ts';
import type { NodeMap } from '../types.ts';
import { classifyChildFactorySurface, classifyFactoryShape, resolveFactoryFieldNames } from '../../emitters/shared.ts';
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

beforeAll(async () => {
	const rustGrammar = resolveGrammarJsPath('rust');
	const rustRaw = await evaluate(rustGrammar);
	const rustLinked = link(rustRaw);
	const rustNormalized = normalizeGrammar(rustLinked);
	nodeMap = assemble(AssembleCtx.from(rustNormalized));

	const typescriptGrammar = resolveGrammarJsPath('typescript');
	const typescriptRaw = await evaluate(typescriptGrammar);
	const typescriptLinked = link(typescriptRaw);
	const typescriptNormalized = normalizeGrammar(typescriptLinked);
	typescriptNodeMap = assemble(AssembleCtx.from(typescriptNormalized));

	const pythonGrammar = resolveGrammarJsPath('python');
	const pythonRaw = await evaluate(pythonGrammar);
	const pythonLinked = link(pythonRaw);
	const pythonNormalized = normalizeGrammar(pythonLinked);
	pythonNodeMap = assemble(AssembleCtx.from(pythonNormalized));
});

describe('child factory surface classification', () => {
	it('detects spread child factories from inferred-only branches', () => {
		// Originally asserted 'spread' for array_expression. Under the
		// repeat(seq) group synthesis + kind-named-slots unification,
		// array_expression's inner alternatives became their own group
		// kinds (_array_expression_list/_array_expression_semi) and its
		// surface is no longer a repeated-children spread — the generated
		// buildArrayExpression takes a single direct child. declaration_list
		// is a current inferred-only repeated-children branch.
		expect(classifyChildFactorySurface(nodeMap.nodes.get('declaration_list')!, nodeMap)).toBe('spread');
		expect(classifyChildFactorySurface(nodeMap.nodes.get('array_expression')!, nodeMap)).toBeNull();
	});

	it('detects direct unnamed-child factories from inferred single-slot branches', () => {
		// Originally asserted 'direct' for attribute. attribute's slots are
		// now real named fields (path/value/arguments — see the committed
		// node-model.json5 factoryFields), so it takes a config object, not
		// a direct unnamed child. expression_statement is a current
		// inferred single-unnamed-slot branch.
		expect(classifyChildFactorySurface(nodeMap.nodes.get('expression_statement')!, nodeMap)).toBe('direct');
		expect(classifyChildFactorySurface(nodeMap.nodes.get('attribute')!, nodeMap)).toBeNull();
	});

	it('excludes field-backed direct factories from the child surface', () => {
		expect(classifyChildFactorySurface(nodeMap.nodes.get('reference_expression')!, nodeMap)).toBeNull();
	});

	it('keeps spread shape when only filtered fields remain alongside visible children', () => {
		// Originally asserted 'spread' for typescript lexical_declaration.
		// Its 'kind' slot (let|const) is now a per-slot enum field on the
		// factory surface (universal per-slot enums) rather than a filtered
		// keyword toggle, so lexical_declaration is genuinely config-shaped
		// (slots: kind, variable_declarator, semicolon). python
		// comparison_operator preserves the original intent: its repeated
		// 'operators' slot is filtered as a keyword-presence field, leaving
		// only the visible repeated children -> spread.
		expect(classifyFactoryShape(pythonNodeMap.nodes.get('comparison_operator')!, pythonNodeMap)).toBe('spread');
		expect(classifyFactoryShape(typescriptNodeMap.nodes.get('lexical_declaration')!, typescriptNodeMap)).toBe(
			'config'
		);
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
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('reference_expression')!, nodeMap)).toEqual([
			'content',
			'value'
		]);
	});

	it('keeps enum-valued operator fields in validator field metadata', () => {
		// Originally expected 'operator' to be filtered as keyword-presence.
		// Under universal per-slot enums, binary_expression's operator is a
		// kind-enum field on the factory surface (the generated
		// buildBinaryExpression takes config.operator via
		// coerceKindEnumStorage), so it belongs in the metadata. Matches the
		// committed node-model.json5 factoryFields.
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('binary_expression')!, nodeMap)).toEqual([
			'left',
			'operator',
			'right'
		]);
	});

	it('propagates the shared field metadata into factory-map output', () => {
		const map = buildFactoryMap(nodeMap);
		// Expectations updated to the current factory surfaces (see the two
		// cases above); attribute gained real named fields under the
		// kind-named-slots unification. All three match the committed
		// node-model.json5 factoryFields.
		expect(map.factoryFields.reference_expression).toEqual(['content', 'value']);
		expect(map.factoryFields.binary_expression).toEqual(['left', 'operator', 'right']);
		expect(map.factoryFields.attribute).toEqual(['path', 'value', 'arguments']);
	});
});
