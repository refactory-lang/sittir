import type { ErrorRegion } from '@sittir/types';

/**
 * Thrown by `engine.parse(source, { errors: 'throw' })` when the source did
 * not parse cleanly.
 */
export class ParseErrors extends Error {
	/** Every region of the source that did not parse, in source order, as the root's `$errors` lists them. */
	readonly errors: readonly ErrorRegion[];

	/**
	 * @param errors - The parse's ERROR and MISSING regions; at least one.
	 */
	constructor(errors: readonly ErrorRegion[]) {
		super(
			`the source did not parse: ${errors
				.map(({ kind, span }) => (kind === 'missing' ? `missing token at ${span.start}` : `error at ${span.start}..${span.end}`))
				.join(', ')}`
		);
		this.name = 'ParseErrors';
		this.errors = errors;
	}
}
