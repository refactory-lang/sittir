export type * from './attribute.ts';
export type * from './declaration.ts';
export type * from './pattern.ts';

/** Rust's declarations: `mut` bindings, `let … else`, signature modifiers and attribute inputs. */
export interface RustDeclarations {
	readonly 'rust-declarations': true;
}
