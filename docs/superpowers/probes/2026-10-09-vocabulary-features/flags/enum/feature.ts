/** A feature module that adds a member to the enum by module augmentation. */
import type { Flag } from './flags.ts';

declare module './flags.ts' {
	export enum Flag {
		Async = 1 << 1,
	}
}

export type Added = Flag.Async;
