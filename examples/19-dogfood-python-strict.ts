import { ir } from '@sittir/python';

// The strict half of the python dogfood: the same items through `.strict`
// alone, so each gap is attributed to the layer that owns it.
//
// What the split shows for Python:
//   - The suite defect is a FACTORY one: `function_definition.body` and
//     `if_statement.consequence` reject a `block` through `.strict` exactly as
//     they do through the coercer, so no statement carrying an indented suite
//     is constructible by any public path.
//   - The statement LIST behaves the other way round. `ir.module({ statements })`
//     accepts a comment; `ir.module.strict({ statements })` rejects the same
//     value ("$type property missing in StatementTransport"), and `block.strict`
//     does too. Here the coercer is doing work the factory layer cannot, so a
//     strict rebuild cannot even assemble the statements the loose one does.

/** An empty module — the only whole-file shape the strict layer reaches. */
export function rebuildProbeSweepStrict() {
	// GAP D (factory): `module.strict(...statements)` rejects the same
	// statement values the coercer accepts, so the strict rebuild is empty. The
	// strict layer is positional — its arguments are the module's children.
	return ir.module.strict();
}

/** `f()` — composes at the strict layer once every node is explicit. */
export function callStatementStrict() {
	// GAP D (factory): `expression_statement.strict` rejects a call in its own
	// `content` slot; only the coercer routes it. The loose form is what builds.
	return ir.simpleStatement.expression(
		ir.call.strict({ function: ir.identifier('main'), arguments: ir.argumentList.strict() })
	);
}
