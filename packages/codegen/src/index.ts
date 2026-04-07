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

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { toIrKey, toFactoryName, camelToSnake } from './naming.ts';
import { emitGrammar } from './emitters/grammar.ts';
import { emitTypes } from './emitters/types.ts';
import { emitTemplatesYaml } from './emitters/rules.ts';
import { emitFactories } from './emitters/factories.ts';
import { emitWrap } from './emitters/wrap.ts';
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
import { isTupleChildren, eachChildSlot } from './node-model.ts';
import { structuralNodes, childSlotNames } from './emitters/utils.ts';
import { buildProjectionContext } from './emitters/kind-projections.ts';
import type { OverridesConfig } from './overrides.ts';

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
	/** wrap.ts — readNode entry point, per-kind wrap functions, edit() */
	wrap: string;
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
 * Detect tuple children that need auto-generated overrides.
 * Uses ProjectionContext + childSlotNames to compute the exact same
 * field names that the template/factory emitters will use.
 *
 * Returns an OverridesConfig with entries only for nodes whose tuple
 * child slots are not already covered by existing overrides.
 */
function generateTupleChildOverrides(nodes: HydratedNodeModel[]): OverridesConfig {
	const modelMap = new Map(nodes.map(n => [n.kind, n]));
	const ctx = buildProjectionContext(modelMap);
	const overrides: OverridesConfig = {};

	for (const node of structuralNodes(nodes)) {
		if (!node.children || !isTupleChildren(node.children)) continue;

		const slotNames = childSlotNames(node.children, ctx);
		// Check if any slot name differs from a simple 'children' — if so, we have named positions
		const hasNamedSlots = slotNames.some(n => n !== 'children');
		if (!hasNamedSlots) continue;

		// Check if existing fields already cover these slots (from disk overrides)
		const existingFieldNames = new Set(
			'fields' in node ? (node as any).fields?.map((f: any) => f.name) ?? [] : [],
		);

		const fields: Record<string, { anonymous?: boolean; multiple?: boolean }> = {};
		eachChildSlot(node.children, (slot, i) => {
			const rawName = camelToSnake(slotNames[i]!);
			if (!existingFieldNames.has(rawName)) {
				fields[rawName] = slot.multiple ? { multiple: true } : {};
			}
		});

		if (Object.keys(fields).length > 0) {
			overrides[node.kind] = { fields };
		}
	}

	return overrides;
}

/** Resolve the overrides.json path for a grammar. */
function overridesPath(grammar: string): string {
	const codegenDir = dirname(dirname(new URL(import.meta.url).pathname));
	const packagesDir = dirname(codegenDir);
	return join(packagesDir, grammar, 'overrides.json');
}

/**
 * Merge auto-generated tuple child overrides into the on-disk overrides.json.
 * Disk entries take priority — auto-generated entries are only added for
 * kinds/fields not already present.
 * Returns true if the file was updated.
 */
function mergeAutoOverridesToDisk(grammar: string, autoOverrides: OverridesConfig): boolean {
	const path = overridesPath(grammar);
	const disk: OverridesConfig = existsSync(path)
		? JSON.parse(readFileSync(path, 'utf-8'))
		: {};

	let changed = false;
	for (const [kind, entry] of Object.entries(autoOverrides)) {
		if (!disk[kind]) {
			disk[kind] = entry;
			changed = true;
		} else {
			// Merge fields — disk fields take priority
			for (const [fieldName, fieldDef] of Object.entries(entry.fields)) {
				if (!disk[kind]!.fields[fieldName]) {
					disk[kind]!.fields[fieldName] = fieldDef;
					changed = true;
				}
			}
		}
	}

	if (changed) {
		writeFileSync(path, JSON.stringify(disk, null, 2) + '\n');
	}
	return changed;
}

/**
 * Generate typed factory code from a tree-sitter grammar definition.
 */
export function generate(cfg: CodegenConfig): GeneratedFiles {
	// First pass: build models to detect tuple children needing overrides
	const firstPass = buildGrammarModel(cfg.grammar);
	const firstNodes = [...firstPass.newModel.models.values()];
	const autoOverrides = generateTupleChildOverrides(firstNodes);

	// Write auto-generated overrides to disk and re-run if any were added
	let nodeModel: string;
	let newModel: typeof firstPass.newModel;
	if (mergeAutoOverridesToDisk(cfg.grammar, autoOverrides)) {
		const secondPass = buildGrammarModel(cfg.grammar);
		nodeModel = secondPass.serialized;
		newModel = secondPass.newModel;
	} else {
		nodeModel = firstPass.serialized;
		newModel = firstPass.newModel;
	}

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
		wrap: emitWrap({ grammar: cfg.grammar, nodes }),
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
