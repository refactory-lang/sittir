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

import { readGrammarKind, listBranchKinds, listLeafKinds, listKeywordKinds, listOperatorContexts, listKeywordTokens, listOperatorTokens, listSupertypes, listLeafValues } from './grammar-reader.ts';
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
import { emitConfig } from './emitters/config.ts';
import { emitIndex } from './emitters/index-file.ts';

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
	/** vitest.config.ts source */
	config: string;
}

/**
 * Generate typed factory code from a tree-sitter grammar definition.
 */
export function generate(config: CodegenConfig): GeneratedFiles {
	const branchKinds = config.nodes && config.nodes.length > 0
		? config.nodes
		: listBranchKinds(config.grammar);

	const leafKinds = listLeafKinds(config.grammar);
	const keywordKinds = listKeywordKinds(config.grammar);
	const keywordTokens = listKeywordTokens(config.grammar);
	const operatorTokens = listOperatorTokens(config.grammar);
	const supertypes = listSupertypes(config.grammar);

	const leafValueKinds = leafKinds
		.map(kind => ({ kind, values: listLeafValues(config.grammar, kind) }))
		.filter(ek => ek.values.length > 0);

	const nodes = branchKinds.map((kind) =>
		readGrammarKind(config.grammar, kind),
	);

	return {
		grammar: emitGrammar({ grammar: config.grammar }),
		types: emitTypes({ grammar: config.grammar, nodeKinds: branchKinds, leafKinds, supertypes }),
		rules: emitRules({ grammar: config.grammar, nodes }),
		factories: emitFactories({
			grammar: config.grammar,
			nodes,
			leafKinds,
			keywordKinds,
			leafValues: new Map(leafValueKinds.map(lv => [lv.kind, lv.values])),
			keywordTokens,
			operatorTokens,
			supertypes,
		}),
		assign: emitAssign({ grammar: config.grammar, nodes, leafKinds, keywordKinds }),
		utils: emitClientUtils({ nodes, leafKinds }),
		from: emitFrom({
			grammar: config.grammar,
			nodes,
			leafKinds,
			keywordKinds,
			leafValues: new Map(leafValueKinds.map(lv => [lv.kind, lv.values])),
			supertypes,
		}),
		irNamespace: emitIrNamespace({ grammar: config.grammar, branchKinds, leafKinds, keywordKinds, operatorContexts: listOperatorContexts(config.grammar), supertypes }),
		joinBy: emitJoinBy({ grammar: config.grammar, nodes }),
		consts: emitConsts({ grammar: config.grammar, nodeKinds: branchKinds, leafKinds, keywords: keywordTokens, operators: operatorTokens, nodes, enumKinds: leafValueKinds }),
		index: emitIndex({ grammar: config.grammar, nodeKinds: branchKinds }),
		tests: emitTests({ grammar: config.grammar, nodes, leafKinds, keywordKinds }),
		config: emitConfig({ grammar: config.grammar }),
	};
}
