import { ir } from '@sittir/rust';

// The strict half of the rust dogfood: rebuilds the same items as
// `17-dogfood-rust.ts` through `.strict` alone — the factory layer with no
// coercion in front of it. Comparing the two isolates which layer each gap
// belongs to.
//
// Measured result: the FACTORIES build every shape the coercion surface could
// not. Called directly, their builders render `/// doc` and `//! doc`,
// `#[derive(Debug, Clone, PartialEq, Eq)]`, a comma-terminated match arm
// (`x,`), a `call();` statement and `write!(f, …)` — all correctly.
//
// GAP A (exposure, cross-cutting): `attributeArm`, `matchArmWithComma`,
// `implItemPositiveClause`, `implItemBody` and `closureExpressionBlock` have
// no `ir` entry, and the package exports no `build*` function at all, so no
// public path constructs them. The missing capability there is exposure, not
// construction.
//
// Doc comments and semicolon-terminated expression statements are NOT in that
// set: the namespaced constructors reach them as `ir.lineComment.doc` and
// `ir.expressionStatement.withSemi`.

/** `use crate::types::Edit;` */
export function useEditStrict() {
	return ir.useDeclaration.strict({
		argument: ir.scopedIdentifier.strict({
			path: ir.scopedIdentifier.strict({ path: ir.crate(), name: ir.identifier('types') }),
			name: ir.identifier('Edit'),
		}),
	});
}

/** `pub enum SpliceError { InvalidRange, OutOfBounds, NonCharBoundary }` */
export function spliceErrorEnumStrict() {
	return ir.statement.enum.strict({
		visibilityModifier: ir.visibilityModifier.pub(),
		name: ir.identifier('SpliceError'),
		// GAP A (exposure): the struct bodies need `field_declaration_list`
		// elements, which build fine but whose attributed-element wrapper has no
		// public constructor; unit variants are what the public surface reaches.
		body: ir.enumVariantList.strict(
			ir.enumVariant.strict({ name: ir.identifier('InvalidRange') }),
			ir.enumVariant.strict({ name: ir.identifier('OutOfBounds') }),
			ir.enumVariant.strict({ name: ir.identifier('NonCharBoundary') })
		),
	});
}

export function rebuildSpliceStrict() {
	return ir.sourceFile.strict({
		statements: [useEditStrict(), spliceErrorEnumStrict()],
	});
}
