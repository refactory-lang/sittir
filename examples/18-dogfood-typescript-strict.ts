import { ir } from '@sittir/typescript';

// The strict half of the typescript dogfood: rebuilds the same items as
// `18-dogfood-typescript.ts` through `.strict` alone, so each gap is attributed
// to the layer that owns it.
//
// What the split shows for TypeScript:
//   - `function_declaration`, `member_expression` and `program` build cleanly
//     through the factory layer; their loose-call failures were coercion only.
//   - `return_statement` renders `return;` from the STRICT builder too, with
//     its expression supplied. Dropping the expression is a factory/render
//     defect, not a coercion one — the same call through the coercer merely
//     inherits it.
//   - `type_annotation` and `variable_declarator` fail inside the factory layer
//     as well: their content slots reject the nodes their own rules name.

const id = (name: string) => ir.from.identifier(name);

/** `function applyFormat(canonicalRender, format) { }` */
export function applyFormatStrict() {
	return ir.functionDeclaration.strict({
		name: id('applyFormat'),
		// GAP B (factory): `type_annotation.strict` rejects a type node in its own
		// `type` slot ("$type property missing in TypeTransport"), so the
		// parameters carry no annotations.
		parameters: ir.formalParameters.strict(
			ir.requiredParameter.strict({ pattern: id('canonicalRender') }),
			ir.requiredParameter.strict({ pattern: id('format') })
		),
		// GAP D (factory): `variable_declarator.strict` rejects the name/value its
		// own rule names ("$type property missing in
		// VariableDeclaratorContentTransportSlot"), so the body is empty.
		body: ir.statementBlock.strict(),
	});
}

/** `format.boundary` — composes once the separator is supplied by hand. */
export function formatBoundaryStrict() {
	return ir.memberExpression.strict({ object: id('format'), separator: '.', property: id('boundary') });
}

/**
 * `return result;` — renders `return;`.
 *
 * GAP D (factory): the expression is dropped by the builder itself, not by any
 * coercion in front of it.
 */
export function returnResultStrict() {
	return ir.returnStatement.strict({ expression: id('result'), semicolon: ';' });
}

export function rebuildFormatStrict() {
	return ir.program.strict({ statements: [applyFormatStrict()] });
}
