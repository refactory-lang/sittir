export interface InteriorSlot {
	readonly name: string;
	readonly configKey: string;
	readonly flag?: true;
}

export interface TokenInterior {
	readonly regex: string;
	readonly slots: readonly InteriorSlot[];
}

export type ProjectedInterior = Readonly<Record<string, string | boolean | undefined>>;

const compiled = new WeakMap<TokenInterior, RegExp>();

export function projectInterior(text: string, interior: TokenInterior, kind: string): ProjectedInterior {
	let re = compiled.get(interior);
	if (re === undefined) {
		re = new RegExp(interior.regex, 'su');
		compiled.set(interior, re);
	}
	const groups = re.exec(text)?.groups;
	if (groups === undefined) {
		throw new Error(`projectInterior: '${kind}' text ${JSON.stringify(text)} does not match its token interior ${interior.regex}`);
	}
	const out: Record<string, string | boolean | undefined> = {};
	for (const slot of interior.slots) {
		const value = groups[slot.name];
		out[slot.name] = slot.flag === true ? value !== undefined : value;
	}
	return out;
}

export function lexedConfig(text: string, interior: TokenInterior, kind: string): Record<string, string | true> {
	const projected = projectInterior(text, interior, kind);
	const out: Record<string, string | true> = {};
	for (const slot of interior.slots) {
		const value = projected[slot.name];
		if (value !== undefined && value !== false) out[slot.configKey] = value === true ? true : value;
	}
	return out;
}
