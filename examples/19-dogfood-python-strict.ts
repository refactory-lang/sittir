import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const engine = await createEngine(python);

// The strict python dogfood: rebuilds `packages/tools/scripts/probe-sweep.py`
// through `.strict` alone, so each gap is attributed to the layer that owns it.
//
// What rebuilds here is the file's skeleton: real `import` statements, a
// `def main()` carrying an indented suite, and a module holding them. The
// suite holds one call statement; the real function bodies and the helper
// functions are not written.
//
// Two spellings carry most of the difficulty, because getting either wrong
// reads as a missing feature rather than a wrong call:
//
//   - A thin wrapper's factory is POSITIONAL, and a statement list is
//     VARIADIC — `engine.build.module.strict(simpleStatements)`, never
//     `.strict({ statements })`; `engine.build.expressionStatement.strict(call)`, never
//     `.strict({ content: call })`.
//   - A form whose seat holds the child's ARGUMENT TUPLE takes an array
//     there, and that array IS the child's argument list — so the suite's
//     statements go in directly rather than pre-wrapped in a block:
//     `engine.build.functionDefinition.block.strict({ …, body: [line] })`. A bare node
//     in that position is a type error, and the runtime diagnostic when the
//     types are bypassed is opaque.
//
// A python statement reaches a module through `simple_statements`, which is
// the line: `module` holds lines, and a line holds one or more simple
// statements.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => engine.build.identifier(text);

/** The shebang and module docstring, which the reader carries as comments. */
export function headerStrict() {
	return [
		engine.build.synonym.comment('!/usr/bin/env python3'),
		engine.build.synonym.comment(' """Cross-tree probe-kind sweep for regression diffing."""'),
	];
}

/** `import argparse`, `import difflib`, … — one statement per module. */
export function importsStrict() {
	return ['argparse', 'difflib', 'json', 'os', 're', 'subprocess', 'sys'].map((name) =>
		engine.build.simpleStatements.strict(engine.build.importStatement.strict(engine.build.importList.strict(engine.build.dottedName.strict(id(name)))))
	);
}

/** `main()` as its own line. */
export function callStatementStrict() {
	return engine.build.simpleStatements.strict(
		engine.build.expressionStatement.strict(engine.build.call.strict({ function: id('main'), arguments: engine.build.argumentList.strict() }))
	);
}

/** `def main():` with an indented suite. */
export function mainDefStrict() {
	return engine.build.functionDefinition.strict({
		name: id('main'),
		parameters: engine.build.parameters.strict(),
		body: engine.build.suite.block.strict(callStatementStrict()),
	});
}

export function rebuildProbeSweepStrict() {
	return engine.build.module
		.strict(...importsStrict(), mainDefStrict(), callStatementStrict())
		.$trivia.leading(...headerStrict());
}
