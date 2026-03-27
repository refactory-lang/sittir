/**
 * IR Code Generator
 *
 * Reads tree-sitter grammar definitions and generates:
 * 1. Grammar type literal (grammar.ts)
 * 2. Type projections + const enums + navigation types (types.ts)
 * 3. S-expression render templates (rules.ts / rules.scm)
 * 4. Unified factory functions (factories.ts)
 * 5. ir namespace (ir.ts)
 * 6. JoinBy separator map (joinby.ts)
 * 7. Constants (consts.ts)
 * 8. Barrel re-exports (index.ts)
 * 9. Test scaffolding (*.test.ts)
 * 10. Vitest config (vitest.config.ts)
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 */

import { listOperatorContexts } from './grammar-reader.ts';
import { toIrKey, toFactoryName } from './naming.ts';
import { emitGrammar } from './emitters/grammar.ts';
import { emitTypes } from './emitters/types.ts';
import { emitRules, emitRule } from './emitters/rules.ts';
import { emitFactories } from './emitters/factories.ts';
import { emitAssign } from './emitters/assign.ts';
import { emitFrom } from './emitters/from.ts';
import { emitClientUtils } from './emitters/client-utils.ts';
import { emitConsts } from './emitters/consts.ts';
import { emitIrNamespace } from './emitters/ir-namespace.ts';
import { emitJoinBy } from './emitters/joinby.ts';
import { emitTests } from './emitters/test-new.ts';
import { emitTypeTests } from './emitters/type-test.ts';
import { emitConfig } from './emitters/config.ts';
import { emitIndex } from './emitters/index-file.ts';
import { buildGrammarModel, type GrammarModel, type BranchModel, type LeafWithChildrenModel, type LeafModel, type KeywordModel } from './grammar-model.ts';

export { readGrammarKind, listBranchKinds, listLeafKinds, listOperatorContexts, listKeywordTokens, listOperatorTokens, loadRawEntries, registerGrammarPath, collectRequiredTokens, listSupertypes, listLeafValues } from './grammar-reader.ts';

export interface CodegenConfig {
	/** Grammar language (e.g., 'rust', 'typescript', 'python') */
	grammar: string;
	/** Branch kinds to generate for. If empty, uses listBranchKinds() to auto-discover. */
	nodes?: string[];
	/** Output directory */
	outputDir: string;
	/** Alias map for field renames */
	aliases?: Record<string, Record<string, string>>;
}

export interface GeneratedFiles {
	/** grammar.ts — TypeScript type literal from node-types.json */
	grammar: string;
	/** types.ts — const enums + construction types + navigation types + supertype unions */
	types: string;
	/** rules.ts — S-expression render templates + joinBy map */
	rules: string;
	/** factories.ts — pure factory functions (typed fields in → typed node out) */
	factories: string;
	/** assign.ts — assignByKind table, per-kind assign functions, edit() */
	assign: string;
	/** utils.ts — shared client-side resolution utilities (isNodeData, _inferBranch, types) */
	utils: string;
	/** from.ts — .from() resolution functions (tree-shakeable, separate from factories) */
	from: string;
	/** ir.ts — ir namespace re-exporting all factories with short names */
	irNamespace: string;
	/** joinby.ts — separator map for list children */
	joinBy: string;
	/** consts.ts — discoverable arrays and maps */
	consts: string;
	/** index.ts barrel re-exports */
	index: string;
	/** tests — single test file for all node kinds */
	tests: string;
	/** type-test — compile-time assertions that *Fields ≡ NodeFields<K> */
	typeTests: string;
	/** vitest.config.ts source */
	config: string;
	/** node-model.json5 — serialized pre-computed grammar model */
	nodeModel: string;
}

/**
 * Generate typed factory code from a tree-sitter grammar definition.
 */
export function generate(config: CodegenConfig): GeneratedFiles {
	// Build the model — single source of truth
	const { model, serialized: nodeModel } = buildGrammarModel(config.grammar);
	const { nodes } = model;

	// Derive collections from the model
	const branchNodes: (BranchModel | LeafWithChildrenModel)[] = [];
	const branchKinds: string[] = [];
	const leafKinds: string[] = [];
	const keywordKinds = new Map<string, string>();
	const keywordTokens: string[] = [];
	const operatorTokens: string[] = [];
	const supertypeEntries: { name: string; subtypes: string[] }[] = [];
	const leafValues = new Map<string, string[]>();
	const enumKinds: { kind: string; values: string[] }[] = [];

	for (const node of Object.values(nodes)) {
		switch (node.modelType) {
			case 'branch':
			case 'leafWithChildren':
				branchNodes.push(node);
				branchKinds.push(node.kind);
				break;
			case 'leaf':
				leafKinds.push(node.kind);
				if (node.values && node.values.length > 0) {
					leafValues.set(node.kind, node.values);
					enumKinds.push({ kind: node.kind, values: node.values });
				}
				break;
			case 'keyword':
				leafKinds.push(node.kind);
				keywordKinds.set(node.kind, node.text);
				break;
			case 'token':
				if (/^[a-z_]+$/i.test(node.kind)) {
					keywordTokens.push(node.kind);
				} else {
					operatorTokens.push(node.kind);
				}
				break;
			case 'supertype':
				supertypeEntries.push({ name: node.kind, subtypes: node.subtypes });
				break;
		}
	}

	// Filter branchKinds if config.nodes specified
	const filteredBranchNodes = config.nodes && config.nodes.length > 0
		? branchNodes.filter(n => config.nodes!.includes(n.kind))
		: branchNodes;
	const filteredBranchKinds = filteredBranchNodes.map(n => n.kind);

	return {
		grammar: emitGrammar({ grammar: config.grammar }),
		types: emitTypes({ grammar: config.grammar, nodeKinds: filteredBranchKinds, leafKinds, supertypes: supertypeEntries }),
		rules: emitRules({ grammar: config.grammar, nodes: filteredBranchNodes }),
		factories: emitFactories({
			grammar: config.grammar,
			nodes: filteredBranchNodes,
			leafKinds,
			keywordKinds,
			leafValues,
			keywordTokens,
			operatorTokens,
			supertypes: supertypeEntries,
		}),
		assign: emitAssign({ grammar: config.grammar, nodes: filteredBranchNodes, leafKinds, keywordKinds }),
		utils: emitClientUtils({ nodes: filteredBranchNodes, leafKinds }),
		from: emitFrom({
			grammar: config.grammar,
			nodes: filteredBranchNodes,
			leafKinds,
			keywordKinds,
			leafValues,
			supertypes: supertypeEntries,
		}),
		irNamespace: emitIrNamespace({ grammar: config.grammar, branchKinds: filteredBranchKinds, leafKinds, keywordKinds, operatorContexts: listOperatorContexts(config.grammar), supertypes: supertypeEntries }),
		joinBy: emitJoinBy({ grammar: config.grammar, nodes: filteredBranchNodes }),
		consts: emitConsts({ grammar: config.grammar, nodeKinds: filteredBranchKinds, leafKinds, keywords: keywordTokens, operators: operatorTokens, nodes: filteredBranchNodes, enumKinds }),
		index: emitIndex({ grammar: config.grammar, nodeKinds: filteredBranchKinds }),
		tests: emitTests({ grammar: config.grammar, nodes: filteredBranchNodes, leafKinds, keywordKinds, leafValues }),
		typeTests: emitTypeTests({ nodes: filteredBranchNodes }),
		config: emitConfig({ grammar: config.grammar }),
		nodeModel,
	};
}
