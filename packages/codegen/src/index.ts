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
import { toIrKey, toFactoryName } from './naming.ts';
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
import { structuralNodes } from './emitters/utils.ts';
import type { OverridesConfig, OverrideFieldDef, OverrideTypeRef } from './overrides.ts';
import { RESERVED_FIELD_NAMES } from './overrides.ts';

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
	/** wrap.ts — lazy tree node hydration via readNode + promote/drillIn */
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
	/** type-test — compile-time assertions that *Config ≡ NodeConfig<K> */
	typeTests: string;
	/** vitest.config.ts source */
	config: string;
	/** node-model.json5 — serialized pre-computed grammar model */
	nodeModel: string;
}

/**
 * Auto-generate tuple child overrides with two tiers:
 *
 * Tier 1 (auto): Unique-kind children — field name = kind (e.g., visibility_modifier).
 * Tier 2 (placeholder): Same-kind positional or anonymous discriminator tokens —
 *   field name = NEEDS_NAME with a console warning for human review.
 *
 * Pure REPEAT nodes (single slot, multiple) are skipped — they use $$$CHILDREN.
 */
function generateTupleChildOverrides(nodes: HydratedNodeModel[]): OverridesConfig {
	const overrides: OverridesConfig = {};

	for (const node of structuralNodes(nodes)) {
		if (!node.children) continue;

		const fields: Record<string, OverrideFieldDef> = {};

		if (isTupleChildren(node.children)) {
			const slots = node.children as readonly { multiple: boolean; required?: boolean; name?: string | null; kinds: readonly { kind: string; modelType?: string }[] }[];

			for (let i = 0; i < slots.length; i++) {
				const slot = slots[i]!;

				// Skip pure REPEAT slots that are the only slot
				if (slots.length === 1 && slot.multiple) continue;

				// Build types array from slot kinds
				// Only token models are truly anonymous — keywords are named nodes
				const types: OverrideTypeRef[] = slot.kinds.map(k => {
					const mt = (k as any).modelType;
					return { type: k.kind, named: mt !== 'token' };
				});

				// Use the slot name from grammar's nameChildSlots when available
				const slotName = slot.name;
				let fieldName: string;

				if (slotName && !slotName.startsWith('NEEDS_NAME') && !RESERVED_FIELD_NAMES.has(slotName)) {
					fieldName = slotName;
				} else if (RESERVED_FIELD_NAMES.has(slotName ?? '')) {
					// Skip reserved field names — can't be used as override field names
					continue;
				} else {
					fieldName = slotName ?? `NEEDS_NAME_${i}`;
					const kindList = slot.kinds.map(k => k.kind).join(', ');
					console.warn(`[overrides] ${node.kind}: ${fieldName} — position ${i} (${kindList}) needs a field name`);
				}

				fields[fieldName] = {
					types,
					multiple: slot.multiple,
					required: slot.required ?? false,
					position: i,
				};
			}
		} else {
			// SINGLE child slot — generate override if the kind is a concrete named type
			// (not a supertype/hidden rule starting with _). Nodes whose sole content IS
			// the child (wrappers like parenthesized_expression) keep $CHILDREN.
			const slot = node.children as { multiple: boolean; required?: boolean; name?: string | null; kinds: readonly { kind: string; modelType?: string }[] };

			// Skip pure REPEAT (list children) — these are $$CHILDREN content
			if (slot.multiple) { /* keep as $$$CHILDREN */ }
			// Skip if kinds include any supertype/hidden (starts with _) — too abstract to name
			else if (slot.kinds.some(k => k.kind.startsWith('_'))) { /* keep as $CHILDREN */ }
			// Single concrete kind → promote to named override field
			// Only when we can derive a meaningful name (single kind → kind-as-name)
			else if (slot.kinds.length === 1) {
				const fieldName = slot.kinds[0]!.kind;
				// Skip reserved field names
				if (RESERVED_FIELD_NAMES.has(fieldName)) { /* keep as $CHILDREN */ }
				else {
					const types: OverrideTypeRef[] = slot.kinds.map(k => {
						const mt = (k as any).modelType;
						return { type: k.kind, named: mt !== 'token' };
					});

					fields[fieldName] = {
						types,
						multiple: slot.multiple,
						required: slot.required ?? false,
						position: 0,
					};
				}
			}
		}

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
 * Merge auto-generated overrides into the on-disk overrides.json.
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
			// New kind — add entirely from auto-generation
			disk[kind] = entry;
			changed = true;
		} else {
			// Kind exists on disk — update types/multiple/required/position from auto
			// while preserving human-curated field names.
			const diskFields = disk[kind]!.fields;
			const autoFields = entry.fields;

			// Match by position: auto-generated fields carry position, disk fields
			// may have been renamed but share the same position.
			const autoByPos = new Map<number, [string, OverrideFieldDef]>();
			for (const [name, def] of Object.entries(autoFields)) {
				autoByPos.set(def.position, [name, def]);
			}

			for (const [diskName, diskDef] of Object.entries(diskFields)) {
				const auto = autoByPos.get(diskDef.position);
				if (auto) {
					const [, autoDef] = auto;
					// Update mechanical facts from grammar
					if (JSON.stringify(diskDef.types) !== JSON.stringify(autoDef.types)) {
						diskDef.types = autoDef.types;
						changed = true;
					}
					if (diskDef.multiple !== autoDef.multiple) {
						diskDef.multiple = autoDef.multiple;
						changed = true;
					}
					if (diskDef.required !== autoDef.required) {
						diskDef.required = autoDef.required;
						changed = true;
					}
				}
			}
		}
	}

	if (changed) {
		// Sort keys for stable output
		const sorted: OverridesConfig = {};
		for (const key of Object.keys(disk).sort()) {
			sorted[key] = disk[key]!;
		}
		writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n');
	}
	return changed;
}

/**
 * Generate typed factory code from a tree-sitter grammar definition.
 */
export function generate(cfg: CodegenConfig): GeneratedFiles {
	// First pass: detect tuple children needing overrides
	const firstPass = buildGrammarModel(cfg.grammar);
	const firstNodes = [...firstPass.newModel.models.values()];
	const autoOverrides = generateTupleChildOverrides(firstNodes);

	// Merge auto-generated overrides to disk, rebuild if changed
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
