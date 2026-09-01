import type { AnyRule } from '../types/rule.ts';
import type { AssembledNode } from './model/node-map.ts';

const FLAG = 'SITTIR_TRACE';

function tracedKinds(): readonly string[] {
	const env = typeof process !== 'undefined' && process?.env?.[FLAG];
	if (!env) return [];
	return env
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

export function tracePhaseRules(phase: string, rules: Record<string, AnyRule> | undefined | null): void {
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

export function traceAssembleNodes(phase: string, nodes: Map<string, AssembledNode>): void {
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
		const slots = node.slots;
		if (slots.length > 0) console.error(`  slots=${JSON.stringify(slots.map((f) => f.name))}`);
	}
}
