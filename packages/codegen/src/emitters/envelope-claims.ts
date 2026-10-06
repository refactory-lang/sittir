const KEYWORD_IDS = [7, ...Array.from({ length: 21 }, (_, i) => 30 + i)];

export const ENVELOPE_EXTRA_IDS: Readonly<Record<string, Readonly<Record<string, readonly number[]>>>> = {
	typescript: {
		'MemberExpressionPropertyTransportSlot.PropertyIdentifier': KEYWORD_IDS,
		'TypeQueryMemberExpressionInTypeAnnotationPropertyTransportSlot.PropertyIdentifier': KEYWORD_IDS,
		'TypeQueryMemberExpressionPropertyTransportSlot.PropertyIdentifier': KEYWORD_IDS
	}
};

const sorted = (ids: readonly number[]): number[] => [...ids].sort((a, b) => a - b);

export function assertEnvelopeExtrasPinned(grammar: string, actual: ReadonlyMap<string, readonly number[]>): void {
	const pinned = ENVELOPE_EXTRA_IDS[grammar] ?? {};
	for (const [variant, ids] of actual) {
		const pin = pinned[variant];
		const added = sorted(ids).filter((id) => pin === undefined || !pin.includes(id));
		if (added.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} claims kind ids ${added.join(', ')} beyond its display id, which no pin allows; a new id is a ruling, never a raised pin`
			);
		}
	}
	for (const [variant, pin] of Object.entries(pinned)) {
		const claimed = actual.get(variant);
		if (claimed === undefined) continue;
		const dropped = sorted(pin).filter((id) => !claimed.includes(id));
		if (dropped.length > 0) {
			throw new Error(
				`envelope claims: ${grammar} ${variant} no longer claims kind ids ${dropped.join(', ')}; lower the pin in envelope-claims.ts`
			);
		}
	}
}
