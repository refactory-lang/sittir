import { ir } from '@sittir/typescript';

// Rebuilds packages/common/src/format.ts with the construction surface alone.
//
// The TypeScript surface does not currently compose a real file. Every helper
// below is written the way the API asks for it, and each marked gap is a shape
// the grammar's own rule requires but the construction surface cannot express.
// The module therefore rebuilds only the fragments that cross the boundary;
// the contract assertions stay pinned until the classes close.
//
// GAP C (cross-cutting): grammatically fixed punctuation is demanded as author
// input — `return_statement.semicolon`, `member_expression.separator` and
// `object_type.opening` are all REQUIRED config slots. A determined slot is
// template text, not a value the caller supplies.
//
// GAP A (cross-cutting): the arms that carry a statement's real content are
// hidden and absent from the from map — `_import_statement_arm`,
// `_variable_declarator_arm1`/`arm2`, `_call_expression_call`,
// `_export_statement_default`. Import statements, variable declarators, call
// expressions and export statements therefore cannot be built at all.

/** `import type { FormatRecord, FormatTrivia } from '@sittir/types';` */
export function importTypes() {
	// GAP A: `import_statement` routes its clause through the hidden
	// `_import_statement_arm`, which the coercer cannot resolve; it also demands
	// a `semicolon` slot (GAP C). No legal shape reaches an import statement, so
	// the module's first line is carried as verbatim leading trivia on the first
	// declaration — a comment is not a statement, and `$trivia` takes its text.
	return "// import type { FormatRecord, FormatTrivia } from '@sittir/types';";
}

/** The JSDoc block that leads `applyFormat` — a `comment` node this time. */
export function applyFormatDoc() {
	return ir.comment(
		'/**\n * Apply a {@link FormatRecord} to a canonical render string.\n *\n * @param canonicalRender - The template-canonical rendered string.\n * @param format - The format record to apply.\n * @returns The reconstructed string with boundary, trivia, slots, and\n *   literals applied.\n */'
	);
}

/** `function applyFormat(canonicalRender: string, format: FormatRecord): string { … }` */
export function applyFormat() {
	return ir.declaration.function({
		name: 'applyFormat',
		parameters: ir.formalParameters.strict(
			ir.requiredParameter({ pattern: 'canonicalRender', type: { type: 'string' } }),
			ir.requiredParameter({ pattern: 'format', type: { type: 'FormatRecord' } })
		),
		// GAP B: `return_type` is a `type_annotation` wrapper whose own required
		// slot is also `type`; the coercer takes no bare type for it, so the
		// annotation is omitted.
		// GAP A: the body's three statements are `let result = …;`, two
		// reassignments and a `return result;`. `lexical_declaration` needs a
		// `_variable_declarator_arm`, assignment needs `_call_expression_call`,
		// and `return_statement` drops its expression (GAP D) — none of them
		// build, so the body is empty.
		body: ir.statementBlock.strict(),
	});
}

/** `function applyBoundary(s: string, format: FormatRecord): string { … }` */
export function applyBoundary() {
	return ir.declaration.function({
		name: 'applyBoundary',
		parameters: ir.formalParameters.strict(
			ir.requiredParameter({ pattern: 's', type: { type: 'string' } }),
			ir.requiredParameter({ pattern: 'format', type: { type: 'FormatRecord' } })
		),
		// GAP B: `return_type` is a `type_annotation` wrapper whose own required
		// slot is also `type`; the coercer takes no bare type for it, so the
		// annotation is omitted.
		body: ir.statementBlock.strict(),
	});
}

// GAP D: `return_statement` with both slots supplied renders `return;` — the
// `expression` is silently dropped rather than rendered before the semicolon.
export function returnResult() {
	return ir.statement.return({ expression: 'result', semicolon: ';' });
}

// A member expression composes once its separator is supplied by hand.
export function formatBoundary() {
	return ir.memberExpression({ object: 'format', separator: '.', property: 'boundary' });
}

export function rebuildFormat() {
	return ir.program({
		statements: [applyFormat().$trivia(importTypes(), applyFormatDoc()), applyBoundary()],
	});
}
