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

beforeAll(async () => {
	const rustGrammar = resolveGrammarJsPath('rust');
	const rustRaw = await evaluate(rustGrammar);
	const rustLinked = link(rustRaw);
	const rustNormalized = normalizeGrammar(rustLinked);
	nodeMap = assemble(rustNormalized, AssembleCtx.from(rustNormalized));

	const typescriptGrammar = resolveGrammarJsPath('typescript');
	const typescriptRaw = await evaluate(typescriptGrammar);
	const typescriptLinked = link(typescriptRaw);
	const typescriptNormalized = normalizeGrammar(typescriptLinked);
	typescriptNodeMap = assemble(typescriptNormalized, AssembleCtx.from(typescriptNormalized));

});

describe('child factory surface classification', () => {
	it('detects spread child factories from inferred-only branches', () => {
		expect(classifyChildFactorySurface(nodeMap.nodes.get('array_expression')!, nodeMap)).toBe('spread');
	});

	it('detects direct unnamed-child factories from inferred single-slot branches', () => {
		expect(classifyChildFactorySurface(nodeMap.nodes.get('attribute')!, nodeMap)).toBe('direct');
	});

	it('excludes field-backed direct factories from the child surface', () => {
		expect(classifyChildFactorySurface(nodeMap.nodes.get('reference_expression')!, nodeMap)).toBeNull();
	});

	it('keeps spread shape when only filtered fields remain alongside visible children', () => {
		expect(classifyFactoryShape(typescriptNodeMap.nodes.get('lexical_declaration')!, typescriptNodeMap)).toBe('spread');
	});
});

describe('factory field metadata', () => {
	it('includes field-backed direct factories even when auto-stamp children are present', () => {
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('reference_expression')!, nodeMap)).toEqual(['value']);
	});

	it('filters keyword-presence fields out of validator field metadata', () => {
		expect(resolveFactoryFieldNames(nodeMap.nodes.get('binary_expression')!, nodeMap)).toEqual(['left', 'right']);
	});

	it('propagates the shared field metadata into factory-map output', () => {
		const map = buildFactoryMap(nodeMap);
		expect(map.factoryFields.reference_expression).toEqual(['value']);
		expect(map.factoryFields.binary_expression).toEqual(['left', 'right']);
		expect(map.factoryFields.attribute).toBeUndefined();
	});
});
