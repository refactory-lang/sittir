import { ir } from '@sittir/python';

// The strict half of the python dogfood: the same items through `.strict`
// alone, so each gap is attributed to the layer that owns it.
//
// The whole shape rebuilds here — real `import` statements, a `def` carrying an
// indented suite, and a module holding them. The coercion half renders the
// imports as comments and the module as a single call line; none of that is a
// surface limit.
//
// Two spellings carry most of the difficulty, because getting either wrong
// reads as a missing feature rather than a wrong call:
//
//   - A thin wrapper's factory is POSITIONAL, and a statement list is
//     VARIADIC — `ir.module.strict(simpleStatements)`, never
//     `.strict({ statements })`; `ir.expressionStatement.strict(call)`, never
//     `.strict({ content: call })`.
//   - A form whose seat holds the child's ARGUMENT TUPLE takes an array
//     there, and that array IS the child's argument list — so the suite's
//     statements go in directly rather than pre-wrapped in a block:
//     `ir.functionDefinition.block.strict({ …, body: [line] })`. A bare node
//     in that position is a type error, and the runtime diagnostic when the
//     types are bypassed is opaque.
//
// A python statement reaches a module through `simple_statements`, which is
// the line: `module` holds lines, and a line holds one or more simple
// statements.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => ir.identifier(text);

/** The shebang and module docstring, which the reader carries as comments. */
export function headerStrict() {
	return [
		ir.synonym.comment('#!/usr/bin/env python3'),
		ir.synonym.comment('# """Cross-tree probe-kind sweep for regression diffing."""'),
	];
}

/** `import argparse`, `import difflib`, … — one statement per module. */
export function importsStrict() {
	return ['argparse', 'difflib', 'json', 'os', 're', 'subprocess', 'sys'].map((name) =>
		ir.simpleStatements.strict(ir.importStatement.strict(ir.dottedName.strict(id(name))))
	);
}

/** `main()` as its own line. */
export function callStatementStrict() {
	return ir.simpleStatements.strict(
		ir.expressionStatement.strict(ir.call.strict({ function: id('main'), arguments: ir.argumentList.strict() }))
	);
}

/** `def main():` with an indented suite. */
export function mainDefStrict() {
	return ir.functionDefinition.block.strict({
		name: id('main'),
		parameters: ir.parameters.strict(),
		body: [callStatementStrict()],
	});
}

export function rebuildProbeSweepStrict() {
	return ir.module
		.strict(...importsStrict(), mainDefStrict(), callStatementStrict())
		.$trivia({ leading: headerStrict() });
}
