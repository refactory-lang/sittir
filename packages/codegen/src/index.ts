/**
 * IR Code Generator
 *
 * Reads tree-sitter grammar definitions from node-types.json
 * and generates:
 * 1. Grammar type literal (grammar.ts)
 * 2. Type projections (types.ts)
 * 3. Self-contained builder classes (nodes/*.ts)
 * 4. Builder namespace with leaf helpers (builder.ts)
 * 5. Barrel re-exports (index.ts)
 * 6. Test scaffolding (*.test.ts)
 * 7. Vitest config (vitest.config.ts)
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 */

import { readGrammarNode, listNodeKinds, listLeafKinds, listOperatorContexts, listKeywords, listOperatorTokens, listSupertypes, listEnumValues } from './grammar-reader.ts';
import { resolveFileNames, toIrKey, toFactoryName } from './naming.ts';
import { emitGrammar } from './emitters/grammar.ts';
import { emitTypes } from './emitters/types.ts';
import { emitBuilder } from './emitters/builder.ts';
import { emitFluent } from './emitters/fluent.ts';
import { emitConsts } from './emitters/consts.ts';
import { emitTest, emitLeafTests } from './emitters/test.ts';
import { emitConfig } from './emitters/config.ts';
import { emitIndex } from './emitters/index-file.ts';

export { readGrammarNode, listNodeKinds, listLeafKinds, listOperatorContexts, listKeywords, listOperatorTokens, loadRawEntries, registerGrammarPath, collectRequiredTokens, listSupertypes, listEnumValues } from './grammar-reader.ts';

export interface CodegenConfig {
	/** Grammar language (e.g., 'rust', 'typescript', 'python') */
	grammar: string;
	/** Node kinds to generate builders for. If empty, uses listNodeKinds() to auto-discover. */
	nodes?: string[];
	/** Output directory */
	outputDir: string;
	/** Alias map for field renames */
	aliases?: Record<string, Record<string, string>>;
	/** Fields that should be optional in builder config */
	defaultableFields?: string[];
	/** Import path for the builder module in generated tests (default: '../src/builder.js') */
	testSourceImportPath?: string;
}

export interface GeneratedFiles {
	/** grammar.ts — TypeScript type literal from node-types.json */
	grammar: string;
	/** types.ts — NodeType/BuilderConfig projections + discriminated union */
	types: string;
	/** node kind -> nodes/*.ts builder source */
	builders: Map<string, string>;
	/** builder.ts — ir namespace re-exporting all builders + leaf helpers */
	builder: string;
	/** node kind -> test .ts source */
	tests: Map<string, string>;
	/** leaf-nodes.test.ts — leaf builder regression tests */
	leafTests: string;
	/** vitest.config.ts source */
	config: string;
	/** consts.ts — discoverable arrays and maps */
	consts: string;
	/** index.ts barrel re-exports */
	index: string;
}

/**
 * Generate IR builder code from a tree-sitter grammar definition.
 */
export function generate(config: CodegenConfig): GeneratedFiles {
	const nodeKinds = config.nodes && config.nodes.length > 0
		? config.nodes
		: listNodeKinds(config.grammar);

	const leafKinds = listLeafKinds(config.grammar);
	const operatorContexts = listOperatorContexts(config.grammar);
	const keywords = listKeywords(config.grammar);
	const operatorTokens = listOperatorTokens(config.grammar);
	const supertypes = listSupertypes(config.grammar);

	// Discover enum-like leaf kinds (nodes with a fixed set of string values)
	const enumKinds = leafKinds
		.map(kind => ({ kind, values: listEnumValues(config.grammar, kind) }))
		.filter(ek => ek.values.length > 0);

	const nodes = nodeKinds.map((kind) =>
		readGrammarNode(config.grammar, kind),
	);

	const fileNames = resolveFileNames(nodeKinds);

	// Compute ir namespace property keys (mirrors fluent emitter logic)
	const irKeyCounts = new Map<string, number>();
	for (const kind of nodeKinds) {
		const key = toIrKey(kind);
		irKeyCounts.set(key, (irKeyCounts.get(key) ?? 0) + 1);
	}
	const irPropertyKeys = new Map<string, string>();
	for (const kind of nodeKinds) {
		const key = toIrKey(kind);
		const isDuplicate = (irKeyCounts.get(key) ?? 0) > 1;
		irPropertyKeys.set(kind, isDuplicate ? toFactoryName(kind) : key);
	}

	const builders = new Map<string, string>();
	const tests = new Map<string, string>();

	for (const node of nodes) {
		builders.set(node.kind, emitBuilder({ grammar: config.grammar, node, nodeKinds, leafKinds, supertypes }));
		tests.set(node.kind, emitTest({
			grammar: config.grammar,
			node,
			fileName: fileNames.get(node.kind),
			irPropertyKey: irPropertyKeys.get(node.kind),
			sourceImportPath: config.testSourceImportPath,
		}));
	}

	return {
		grammar: emitGrammar({ grammar: config.grammar }),
		types: emitTypes({ grammar: config.grammar, nodeKinds, leafKinds, supertypes }),
		builders,
		builder: emitFluent({ grammar: config.grammar, nodeKinds, leafKinds, operatorContexts, nodes, supertypes }),
		consts: emitConsts({ grammar: config.grammar, nodeKinds, leafKinds, keywords, operators: operatorTokens, nodes, enumKinds }),
		tests,
		leafTests: emitLeafTests({ leafKinds, nodeKinds, sourceImportPath: config.testSourceImportPath }),
		config: emitConfig({ grammar: config.grammar }),
		index: emitIndex({ grammar: config.grammar, nodeKinds }),
	};
}
