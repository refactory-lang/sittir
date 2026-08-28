declare const OPAQUE_FACTS: unique symbol;

export type OpaqueFacts = { readonly [OPAQUE_FACTS]: true };

export function opaqueFacts(facts: Readonly<Record<string, unknown>>): OpaqueFacts {
	return facts as unknown as OpaqueFacts;
}

export function readFacts<T extends Record<string, unknown>>(facts: OpaqueFacts): Readonly<T> {
	return facts as unknown as Readonly<T>;
}
