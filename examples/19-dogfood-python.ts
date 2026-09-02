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

/** `main()` — a call statement, placed in the module as a simple-statements line. */
export function callStatement() {
	return ir.simpleStatement.expression(ir.call({ function: ir.identifier('main'), arguments: ir.argumentList.strict() }));
}

export function rebuildProbeSweep() {
	// A bare simple statement routes to the module's `_simple_statements` arm
	// (the one arm whose elements admit it) and becomes its own line; the
	// shebang, docstring and import stand-ins ride along as leading trivia.
	// GAP A: the imports themselves stay comments (see `imports`).
	return ir.module({ statements: [callStatement()] }).$trivia(...header(), ...imports());
}
