import { isPreference } from '../primitives/preference.ts';
import { parsePreferencePath } from '../primitives/preference-path.ts';

export interface PathDeclaration {
	readonly path: string;
	readonly arm: string;
}

export interface AddressBinding {
	readonly address: string;
	readonly label: string;
}

export interface OptionsDeclarations {
	readonly declarations: readonly PathDeclaration[];
	readonly bindings: readonly AddressBinding[];
}

export type OptionsConfig = Record<string, unknown>;

const BINDINGS_KEY = '_bindings';

export function readOptionsBlock(options: OptionsConfig, kinds: ReadonlySet<string>): OptionsDeclarations {
	const declarations: PathDeclaration[] = [];
	const declared = new Set<string>();

	for (const [kind, relatives] of Object.entries(options)) {
		if (kind === BINDINGS_KEY) continue;
		if (!relatives || typeof relatives !== 'object') {
			throw new Error(`options: '${kind}' takes a map of paths relative to it`);
		}
		for (const [relative, value] of Object.entries(relatives as Record<string, unknown>)) {
			const path = `${kind}/${relative}`;
			if (!isPreference(value)) throw new Error(`options: '${path}' takes preference(arm)`);
			parsePreferencePath(path);
			if (declared.has(path)) throw new Error(`options: '${path}' declared twice`);
			declared.add(path);
			declarations.push({ path, arm: value.default });
		}
	}

	const bindings: AddressBinding[] = [];
	const bound = new Set<string>();
	for (const [address, label] of Object.entries((options[BINDINGS_KEY] ?? {}) as Record<string, string>)) {
		parsePreferencePath(address);
		if (bound.has(address)) throw new Error(`options: _bindings declares '${address}' twice`);
		bound.add(address);
		if (!declared.has(label)) throw new Error(`options: _bindings '${address}' names no label '${label}'`);
		const root = parsePreferencePath(label)[0];
		if (root !== undefined && root.kind === 'name' && kinds.has(root.name)) {
			throw new Error(`options: label '${label}' names the kind '${root.name}' — a label's kind is virtual`);
		}
		bindings.push({ address, label });
	}

	return { declarations, bindings };
}
