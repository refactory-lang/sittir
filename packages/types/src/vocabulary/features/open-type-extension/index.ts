export type * from './declaration.ts';

/** Open type extension: methods added to a type away from its declaration. */
export interface OpenTypeExtension {
	readonly 'open-type-extension': true;
}
