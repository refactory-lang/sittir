export interface EnvelopeClaims {
	readonly display: number;
	readonly extras: readonly number[];
}

const KEYWORD_IDS = [7, ...Array.from({ length: 21 }, (_, i) => 30 + i)];
const PROPERTY_IDENTIFIER_DISPLAY = 462;

export const ENVELOPE_EXTRA_IDS: Readonly<Record<string, Readonly<Record<string, EnvelopeClaims>>>> = {
	typescript: {
		'MemberExpressionPropertyTransportSlot.PropertyIdentifier': { display: PROPERTY_IDENTIFIER_DISPLAY, extras: KEYWORD_IDS },
		'TypeQueryMemberExpressionInTypeAnnotationPropertyTransportSlot.PropertyIdentifier': {
			display: PROPERTY_IDENTIFIER_DISPLAY,
			extras: KEYWORD_IDS
		},
		'TypeQueryMemberExpressionPropertyTransportSlot.PropertyIdentifier': { display: PROPERTY_IDENTIFIER_DISPLAY, extras: KEYWORD_IDS }
	}
};

const sorted = (ids: readonly number[]): number[] => [...ids].sort((a, b) => a - b);

export function assertEnvelopeExtrasPinned(
	grammar: string,
	actual: ReadonlyMap<string, EnvelopeClaims>,
	printedEnums: ReadonlySet<string>
): void {
	const pinned = ENVELOPE_EXTRA_IDS[grammar] ?? {};
	for (const [variant, claims] of actual) {
		const pin = pinned[variant];
		const added = sorted(claims.extras).filter((id) => pin === undefined || !pin.extras.includes(id));
		if (added.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} claims kind ids ${added.join(', ')} beyond its display id, which no pin allows; a new id is a ruling, never a raised pin`
			);
		}
	}
	for (const [variant, pin] of Object.entries(pinned)) {
		const claims = actual.get(variant);
		if (claims === undefined) {
			if (printedEnums.has(variant.slice(0, variant.indexOf('.')))) {
				throw new Error(`envelope claims: ${grammar} ${variant} is no longer an envelope variant; remove its pin in envelope-claims.ts`);
			}
			continue;
		}
		if (claims.display !== pin.display) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} displays as kind id ${claims.display}, not its pinned ${pin.display}; update the pin in envelope-claims.ts`
			);
		}
		const dropped = sorted(pin.extras).filter((id) => !claims.extras.includes(id));
		if (dropped.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} no longer claims kind ids ${dropped.join(', ')}; lower the pin in envelope-claims.ts`
			);
		}
	}
}
