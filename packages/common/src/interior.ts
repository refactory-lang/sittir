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
 * A token's text spelled out in full: the interior between one of the
 * delimiters it may open with and one it may close with, and which of each it
 * used. `undefined` when `text` does not carry both.
 */
export function spelledForm<Open extends string, Close extends string>(
	text: string,
	opens: readonly Open[],
	closes: readonly Close[]
): { readonly interior: string; readonly open: Open; readonly close: Close } | undefined {
	for (const open of opens) {
		if (!text.startsWith(open)) continue;
		for (const close of closes) {
			if (text.length >= open.length + close.length && text.endsWith(close)) {
				return { interior: text.slice(open.length, text.length - close.length), open, close };
			}
		}
	}
	return undefined;
}

/**
 * The interior of a token spelled out in full, or `text` itself when it does
 * not carry both delimiters, or when `accepts` (the interior's anchored
 * pattern) rejects what stripping leaves but takes `text` whole. A builder
 * that takes its kind's interior uses this to accept the full spelling as well
 * (`'// note'` as much as `' note'`).
 */
export function spelledInterior(text: string, open: string, close: string, accepts?: RegExp): string {
	const interior = spelledForm(text, [open], [close])?.interior;
	if (interior === undefined) return text;
	return accepts !== undefined && !accepts.test(interior) && accepts.test(text) ? text : interior;
}

/**
 * The interior of a token given in its full spelling. Unlike
 * {@link spelledInterior} nothing is detected: the text must carry both
 * delimiters, and the caller has said that it does.
 *
 * @param text - The token's full text.
 * @param open - The fixed text the token starts with.
 * @param close - The fixed text the token ends with.
 * @param kind - The kind being built, named in the error.
 * @returns The text between the delimiters.
 * @throws When the text does not start with `open` and end with `close`.
 */
export function unaffixed(text: string, open: string, close: string, kind: string): string {
	const interior = spelledForm(text, [open], [close])?.interior;
	if (interior === undefined) {
		throw new Error(`${kind}: text given with its affixes must be ${JSON.stringify(open)}…${JSON.stringify(close)}, got ${JSON.stringify(text)}`);
	}
	return interior;
}

export function refuseSiblingLead(interior: string, siblings: readonly (readonly [lead: RegExp, builder: string])[]): string {
	for (const [lead, builder] of siblings) {
		if (lead.test(interior)) {
			throw new Error(`${JSON.stringify(interior)} starts the way ${builder} does, so it would not read back as this arm; build it with ${builder}`);
		}
	}
	return interior;
}
