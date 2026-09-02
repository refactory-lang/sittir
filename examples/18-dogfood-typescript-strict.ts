import { ir } from '@sittir/typescript';

// The strict half of the typescript dogfood: rebuilds the same items as
// `18-dogfood-typescript.ts` through `.strict` alone, so each gap is attributed
// to the layer that owns it. Every call is the strict surface — `.strict` on
// branch kinds, the bare factory on leaves (leaves have no `.strict`; they are
// already it) — and no local wrapper stands between the example and the API.
//
// GAP C: `ir.identifier` is callable in rust and python but is a supertype
// GROUP in typescript (the `identifier` supertype carries both the `undefined`
// keyword kind and the `identifier` leaf), so the leaf is reached one level
// down as `ir.identifier.identifier(…)`. The same construct is spelled
// differently per grammar.
//
// What the split shows for TypeScript:
//   - `function_declaration`, `member_expression` and `program` build cleanly
//     through the factory layer; their loose-call failures were coercion only.
//   - `type_annotation` and `variable_declarator` fail inside the factory layer
//     as well: their content slots reject the nodes their own rules name.

const id = (name: string) => ir.identifier(name);

/** `function applyFormat(canonicalRender, format) { }` */
export function applyFormatStrict() {
	return ir.declaration.function.strict({
		name: ir.identifier.identifier('applyFormat'),
		// GAP B (factory): `type_annotation.strict` rejects a type node in its own
		// `type` slot ("$type property missing in TypeTransport"), so the
		// parameters carry no annotations.
		parameters: ir.formalParameters.strict(
			ir.requiredParameter.strict({ pattern: ir.identifier.identifier('canonicalRender') }),
			ir.requiredParameter.strict({ pattern: ir.identifier.identifier('format') })
		),
		// GAP D (factory): `variable_declarator.strict` rejects the name/value its
		// own rule names ("$type property missing in
		// VariableDeclaratorContentTransportSlot"), so the body is empty.
		body: ir.statementBlock.strict(),
	});
}

/** `format.boundary` — composes once the separator is supplied by hand. */
export function formatBoundaryStrict() {
	return ir.memberExpression.strict({ object: ir.identifier.identifier('format'), separator: '.', property: ir.identifier.identifier('boundary') });
}

/** `return result;` */
export function returnResultStrict() {
	return ir.statement.return.strict({ expression: ir.identifier.identifier('result'), semicolon: ';' });
}

export function rebuildFormatStrict() {
	return ir.program.strict({ statements: [applyFormatStrict()] });
}
