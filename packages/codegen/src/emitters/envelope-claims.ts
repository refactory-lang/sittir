export interface EnvelopeClaims {
	readonly display: number;
	readonly extras: readonly number[];
}

export interface EnvelopePin {
	readonly display: string;
	readonly extras: readonly string[];
}

export interface PinnableKind {
	readonly kind: string;
	readonly id: number;
}

const KEYWORD_KINDS = [
	'type_keyword',
	'declare_keyword',
	'namespace_keyword',
	'public_keyword',
	'private_keyword',
	'protected_keyword',
	'override_keyword',
	'readonly_keyword',
	'module_keyword',
	'any_keyword',
	'number_keyword',
	'boolean_keyword',
	'string_keyword',
	'symbol_keyword',
	'export_keyword',
	'object_keyword',
	'new_keyword',
	'get_keyword',
	'set_keyword',
	'async_keyword',
	'static_keyword',
	'let_keyword'
];
const PROPERTY_IDENTIFIER_DISPLAY = '_property_identifier';

export const ENVELOPE_PINS: Readonly<Record<string, Readonly<Record<string, EnvelopePin>>>> = {
	typescript: {
		'MemberExpressionPropertyTransportSlot.PropertyIdentifier': { display: PROPERTY_IDENTIFIER_DISPLAY, extras: KEYWORD_KINDS }
	}
};

const sorted = (names: readonly string[]): string[] => [...names].sort();

export function assertEnvelopeExtrasPinned(
	grammar: string,
	pins: Readonly<Record<string, EnvelopePin>> | undefined,
	actual: ReadonlyMap<string, EnvelopeClaims>,
	printedEnums: ReadonlySet<string>,
	kinds: readonly PinnableKind[]
): void {
	if (pins === undefined) return;
	const idOf = new Map(kinds.map((entry) => [entry.kind, entry.id]));
	const nameOf = new Map(kinds.map((entry) => [entry.id, entry.kind]));
	const named = (id: number): string => nameOf.get(id) ?? `#${id}`;
	for (const [variant, pin] of Object.entries(pins)) {
		const enumName = variant.slice(0, variant.indexOf('.'));
		if (!printedEnums.has(enumName)) {
			throw new Error(`envelope claims: ${grammar} ${variant} pins an enum codegen does not print; remove its pin in envelope-claims.ts`);
		}
		for (const kind of [pin.display, ...pin.extras]) {
			if (!idOf.has(kind)) {
				throw new Error(`envelope claims: ${grammar} ${variant} pins kind '${kind}', which the grammar does not have; fix its pin in envelope-claims.ts`);
			}
		}
	}
	for (const [variant, claims] of actual) {
		const pin = pins[variant];
		const added = sorted(claims.extras.map(named)).filter((kind) => pin === undefined || !pin.extras.includes(kind));
		if (added.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} claims kinds ${added.join(', ')} beyond its display kind, which no pin allows; a new kind is a ruling, never a raised pin`
			);
		}
	}
	for (const [variant, pin] of Object.entries(pins)) {
		const claims = actual.get(variant);
		if (claims === undefined) {
			throw new Error(`envelope claims: ${grammar} ${variant} is no longer an envelope variant; remove its pin in envelope-claims.ts`);
		}
		if (named(claims.display) !== pin.display) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} displays as kind ${named(claims.display)}, not its pinned ${pin.display}; update the pin in envelope-claims.ts`
			);
		}
		const claimed = claims.extras.map(named);
		const dropped = sorted(pin.extras).filter((kind) => !claimed.includes(kind));
		if (dropped.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} no longer claims kinds ${dropped.join(', ')}; lower the pin in envelope-claims.ts`
			);
		}
	}
}
