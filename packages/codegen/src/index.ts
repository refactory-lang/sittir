/**
 * IR Code Generator
 *
 * Reads tree-sitter grammar definitions and generates:
 * 1. Grammar type literal (grammar.ts)
 * 2. Type projections + const enums + navigation types (types.ts)
 * 3. YAML render templates (templates.yaml)
 * 4. Unified factory functions (factories.ts)
 * 5. ir namespace (ir.ts)
 * 7. Constants (consts.ts)
 * 8. Barrel re-exports (index.ts)
 * 9. Test scaffolding (*.test.ts)
 * 10. Vitest config (vitest.config.ts)
 *
 * Usage:
 *   sittir --grammar rust --all --output src/
 */

import { toIrKey, toFactoryName } from './naming.ts';
import { emitGrammar } from './emitters/grammar.ts';
import { emitTypes } from './emitters/types.ts';
import { emitTemplatesYaml } from './emitters/rules.ts';
import { emitFactories } from './emitters/factories.ts';
import { emitAssign } from './emitters/assign.ts';
import { emitFrom } from './emitters/from.ts';
import { emitClientUtils } from './emitters/client-utils.ts';
import { emitConsts } from './emitters/consts.ts';
import { emitIrNamespace } from './emitters/ir-namespace.ts';
import { emitTests } from './emitters/test-new.ts';
import { emitTypeTests } from './emitters/type-test.ts';
import { emitConfig } from './emitters/config.ts';
import { emitIndex } from './emitters/index-file.ts';
import { buildGrammarModel } from './grammar-model.ts';
import type { HydratedNodeModel } from './node-model.ts';

export { listBranchKinds, listLeafKinds, listKeywordTokens, listOperatorTokens, loadRawEntries, registerGrammarPath, collectRequiredTokens, listSupertypes, listLeafValues } from './grammar-reader.ts';

export interface CodegenConfig {
	/** Grammar language (e.g., 'rust', 'typescript', 'python') */
	grammar: string;
	/** Node kinds to generate for. If empty, generates for all. */
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
	/** templates.yaml — YAML render templates with clauses and per-rule joinBy */
	templatesYaml: string;
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
export function generate(cfg: CodegenConfig): GeneratedFiles {
	const { model, serialized: nodeModel, newModel } = buildGrammarModel(cfg.grammar);

	// Use new pipeline's HydratedNodeModel[] for emitters
	const allNewNodes = [...newModel.models.values()];
	const nodes: HydratedNodeModel[] = cfg.nodes && cfg.nodes.length > 0
		? allNewNodes.filter(n => cfg.nodes!.includes(n.kind))
		: allNewNodes;

	return {
		grammar: emitGrammar({ grammar: cfg.grammar }),
		types: emitTypes({ grammar: cfg.grammar, nodes }),
		templatesYaml: emitTemplatesYaml({ grammar: cfg.grammar, nodes, grammarSha: '' }),
		factories: emitFactories({ grammar: cfg.grammar, nodes }),
		assign: emitAssign({ grammar: cfg.grammar, nodes }),
		utils: emitClientUtils({ nodes }),
		from: emitFrom({ grammar: cfg.grammar, nodes }),
		irNamespace: emitIrNamespace({ grammar: cfg.grammar, nodes }),
		consts: emitConsts({ grammar: cfg.grammar, nodes }),
		index: emitIndex({ grammar: cfg.grammar, nodes }),
		tests: emitTests({ grammar: cfg.grammar, nodes }),
		typeTests: emitTypeTests({ nodes }),
		config: emitConfig({ grammar: cfg.grammar }),
		nodeModel,
	};
}
