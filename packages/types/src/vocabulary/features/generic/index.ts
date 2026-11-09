import type { ParametricPolymorphism } from '../parametric-polymorphism/index.ts';
import type { BoundedQuantification } from '../parametric-polymorphism/bounded-quantification/index.ts';

/** Generic programming: type parameters and their bounds. */
export interface Generic extends ParametricPolymorphism, BoundedQuantification {
	readonly generic: true;
}
