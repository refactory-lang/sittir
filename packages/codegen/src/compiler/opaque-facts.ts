/**
 * Opaque provenance/diagnostic facts attached to a model object.
 *
 * The compiler must NEVER read these facts to drive logic or emission
 * (feedback_metadata_not_behavior). This type enforces that AT THE TYPE LEVEL:
 * `OpaqueFacts` exposes no readable keys, so any compiler attempt to read a fact
 * (`slot.metadata.origin`) is a compile error ("Property 'origin' does not exist
 * on type 'OpaqueFacts'").
 *
 * There are exactly two seams:
 * - `opaqueFacts(record)` — the ONLY way to construct facts (write seam).
 * - `readFacts<T>(facts)` — the ONLY way to read them back, and it must be called
 *   ONLY from the validator / diagnostics, never from compiler logic or an
 *   emitter's branching path. The explicit generic + named call make every read
 *   site greppable.
 *
 * Behavior derives from STRUCTURAL facts (fieldName / kinds / multiplicity /
 * arity), not from anything in here.
 */
declare const OPAQUE_FACTS: unique symbol;

export type OpaqueFacts = { readonly [OPAQUE_FACTS]: true };

/** Construct opaque facts from a plain record — the single write seam. */
export function opaqueFacts(facts: Readonly<Record<string, unknown>>): OpaqueFacts {
	return facts as unknown as OpaqueFacts;
}

/**
 * Read opaque facts back as a typed record. VALIDATOR / DIAGNOSTICS ONLY —
 * never call from compiler logic or an emitter's branching path.
 */
export function readFacts<T extends Record<string, unknown>>(facts: OpaqueFacts): Readonly<T> {
	return facts as unknown as Readonly<T>;
}
