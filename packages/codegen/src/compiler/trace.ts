/**
 * Permanent diagnostic trace logging for the compiler pipeline.
 *
 * Enable by setting `SITTIR_TRACE=<kind1>,<kind2>,...` in the environment.
 * Each listed kind is emitted as structured JSON after every pipeline
 * phase (Evaluate, Link, Optimize, Assemble), letting authors see exactly
 * where a rule changes shape — or fails to.
 *
 *   SITTIR_TRACE=import_statement,_import_list npx tsx cli.ts --grammar python --all
 *
 * Noise-free when unset: the env-var lookup is O(1) and returns early.
 */
import type { Rule } from "./rule.ts";

const FLAG = "SITTIR_TRACE";

function tracedKinds(): readonly string[] {
	const env = typeof process !== "undefined" && process?.env?.[FLAG];
	if (!env) return [];
	return env
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Emit the shape of each traced kind from a rules map after a pipeline
 * phase. Rules listed in `SITTIR_TRACE` that don't exist in the current
 * map are silently skipped — the same rule set won't necessarily exist
 * in every phase (Link may classify a kind into a synthetic type;
 * Optimize may inline single-use hidden rules, removing the entry).
 */
export function tracePhaseRules(
	phase: string,
	rules: Record<string, Rule> | undefined | null,
): void {
	const kinds = tracedKinds();
	if (kinds.length === 0 || !rules) return;
	for (const k of kinds) {
		const rule = rules[k];
		if (rule === undefined) {
			console.error(`[sittir-trace] ${phase}: '${k}' (not present in this phase)`);
			continue;
		}
		console.error(`[sittir-trace] ${phase}: '${k}'`);
		console.error(JSON.stringify(rule, null, 2));
	}
}

/**
 * Emit NodeMap-level state (post-Assemble) for each traced kind. The
 * structure is different from raw rules — branches carry fields/children
 * derivations, polymorphs carry forms — so we format the essentials
 * rather than full JSON (which pulls in parent-map cycles).
 */
export function traceAssembleNodes(
	phase: string,
	nodes: Map<
		string,
		{ kind: string; modelType: string; typeName: string; rule?: Rule } & Record<string, unknown>
	>,
): void {
	const kinds = tracedKinds();
	if (kinds.length === 0) return;
	for (const k of kinds) {
		const node = nodes.get(k);
		if (!node) {
			console.error(`[sittir-trace] ${phase}: '${k}' (not in NodeMap)`);
			continue;
		}
		console.error(`[sittir-trace] ${phase}: '${k}'`);
		console.error(`  modelType=${node.modelType} typeName=${node.typeName}`);
		// Lazy-access the derivation getters if present. AssembledBranch's
		// `fields` / `children` are computed on access.
		const fields = (node as unknown as { fields?: Array<{ name: string }> }).fields;
		const children = (node as unknown as { children?: Array<{ name: string; values?: unknown[] }> })
			.children;
		if (fields) console.error(`  fields=${JSON.stringify(fields.map((f) => f.name))}`);
		if (children)
			console.error(
				`  children=${JSON.stringify(children.map((c) => ({ name: c.name, slots: c.values?.length ?? 0 })))}`,
			);
	}
}
