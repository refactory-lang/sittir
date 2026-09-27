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

/**
 * The interior of a token spelled out in full: `text` without the literal
 * delimiters it opens and closes with, or `text` itself when it does not carry
 * both. A builder that takes its kind's interior uses this to accept the full
 * spelling as well (`'// note'` as much as `' note'`).
 */
export function spelledInterior(text: string, open: string, close: string): string {
	const spelled = text.length >= open.length + close.length && text.startsWith(open) && text.endsWith(close);
	return spelled ? text.slice(open.length, text.length - close.length) : text;
}

export function refuseSiblingLead(interior: string, siblings: readonly (readonly [lead: RegExp, builder: string])[]): string {
	for (const [lead, builder] of siblings) {
		if (lead.test(interior)) {
			throw new Error(`${JSON.stringify(interior)} starts the way ${builder} does, so it would not read back as this arm; build it with ${builder}`);
		}
	}
	return interior;
}
