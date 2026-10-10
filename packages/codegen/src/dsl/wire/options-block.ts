import { isPreference } from '../primitives/preference.ts';
import { parsePreferencePath } from '../primitives/preference-path.ts';

export interface PathDeclaration {
	readonly path: string;
	readonly arm: string;
}

export interface AddressLabel {
	readonly address: string;
	readonly label: string;
}

export interface OptionsDeclarations {
	readonly declarations: readonly PathDeclaration[];
	readonly labels: readonly AddressLabel[];
	readonly indent: string | undefined;
}

export type OptionsConfig = Record<string, unknown>;

export const LABELS_KEY = '_labels';
export const INDENT_KEY = 'indent';

export function readOptionsBlock(options: OptionsConfig, kinds: ReadonlySet<string>): OptionsDeclarations {
	const declarations: PathDeclaration[] = [];
	const declared = new Set<string>();

	for (const [kind, relatives] of Object.entries(options)) {
		if (kind === LABELS_KEY || kind === INDENT_KEY) continue;
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

	const labels: AddressLabel[] = [];
	const bound = new Set<string>();
	for (const [address, label] of Object.entries((options[LABELS_KEY] ?? {}) as Record<string, string>)) {
		parsePreferencePath(address);
		if (bound.has(address)) throw new Error(`options: _labels declares '${address}' twice`);
		bound.add(address);
		if (!declared.has(label)) throw new Error(`options: _labels '${address}' names no label '${label}'`);
		const root = parsePreferencePath(label)[0];
		if (root !== undefined && root.kind === 'name' && kinds.has(root.name)) {
			throw new Error(`options: label '${label}' names the kind '${root.name}' — a label's kind is virtual`);
		}
		labels.push({ address, label });
	}

	const declaredIndent = options[INDENT_KEY];
	if (declaredIndent !== undefined && !isPreference(declaredIndent)) {
		throw new Error(`options: '${INDENT_KEY}' takes preference(unit)`);
	}

	return { declarations, labels, indent: isPreference(declaredIndent) ? declaredIndent.default : undefined };
}
