import { readNodeModelFile } from '../validate/common.ts';

export interface ModelSlot {
	readonly name: string;
	readonly propertyName: string;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly storage: string;
	readonly kinds: readonly string[];
	readonly terminals: readonly string[];
}

export interface ModelNode {
	readonly kind: string;
	readonly modelType: string;
	readonly slots: readonly ModelSlot[];
	readonly subtypes: readonly string[];
	readonly enumValues: readonly string[];
	readonly text: string | null;
}

export type SlotModel = ReadonlyMap<string, ModelNode>;

interface RawValue {
	readonly kind?: string;
	readonly value?: string;
}

interface RawSlot {
	readonly name: string;
	readonly propertyName: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly storage?: string;
	readonly kinds?: readonly string[];
	readonly values?: readonly RawValue[];
}

interface RawNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly slots?: readonly RawSlot[];
	readonly subtypes?: readonly string[];
	readonly values?: readonly string[];
	readonly text?: string;
}

interface RawModel {
	readonly nodes: readonly RawNode[] | Record<string, RawNode>;
}

export function loadSlotModel(grammar: string): SlotModel {
	const raw = readNodeModelFile(grammar);
	if (raw === undefined) throw new Error(`bindings-inventory: no node model for ${grammar}`);
	const parsed = JSON.parse(raw) as RawModel;
	const nodes: readonly RawNode[] = Array.isArray(parsed.nodes) ? parsed.nodes : Object.values(parsed.nodes);
	const out = new Map<string, ModelNode>();
	for (const n of nodes) {
		out.set(n.kind, {
			kind: n.kind,
			modelType: n.modelType ?? 'branch',
			slots: (n.slots ?? []).map((s) => ({
				name: s.name,
				propertyName: s.propertyName,
				required: s.required ?? false,
				multiple: s.multiple ?? false,
				storage: s.storage ?? 'verbatim',
				kinds: s.kinds ?? [],
				terminals: (s.values ?? []).flatMap((v) => (v.kind === 'terminal' && v.value !== undefined ? [v.value] : []))
			})),
			subtypes: n.subtypes ?? [],
			enumValues: n.values ?? [],
			text: n.text ?? null
		});
	}
	return out;
}
