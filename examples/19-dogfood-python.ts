import { ir } from '@sittir/python';

// Rebuilds packages/tools/scripts/probe-sweep.py with the construction surface
// alone. This module uses the COERCION surface; `19-dogfood-python-strict.ts`
// rebuilds the same items through `.strict`, so each gap lands on the layer
// that owns it.
//
// Python is the weakest of the three surfaces: no statement that carries a
// suite can be built at either layer.
//
// GAP D (factory, cross-cutting): every slot that holds an indented suite
// rejects a `block` — `function_definition.body`, `if_statement.consequence`
// and their siblings all fail with "unknown kind id 160 in
// …BodyTransportSlot". A function definition therefore cannot be constructed
// by any path, loose or strict.
//
// GAP A (exposure): `import_statement` routes its name through the hidden
// `_import_list`, which the coercer cannot resolve and whose element wrapper
// has no public constructor.

/** The module docstring and shebang, which the reader carries as comments. */
export function header() {
	return [
		ir.synonym.comment('#!/usr/bin/env python3'),
		ir.synonym.comment('# """Cross-tree probe-kind sweep for regression diffing."""'),
	];
}

/** `import argparse` … — GAP A (exposure): unbuildable, kept as comments. */
export function imports() {
	return ['argparse', 'difflib', 'json', 'os', 're', 'subprocess', 'sys'].map((name) =>
		ir.synonym.comment(`# import ${name}`)
	);
}

/** `f()` — a call statement is the one statement shape that composes. */
export function callStatement() {
	return ir.expressionStatement(ir.call({ function: ir.identifier('main'), arguments: ir.argumentList.strict() }));
}

export function rebuildProbeSweep() {
	// GAP D (factory): the module's statement list rejects an
	// `expression_statement` — kind 122 is not a member of `StatementTransport`,
	// so a call statement renders fine alone (`main()`) but cannot be placed in a
	// module. `pass` is one of the few statements the list does admit, and is
	// what this rebuild is reduced to.
	return ir.module({ statements: [ir.passStatement()] });
}
