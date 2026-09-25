import { ir, TSKindId } from '@sittir/typescript';

// The strict typescript dogfood: rebuilds `packages/common/src/format.ts`
// through `.strict` alone, so each gap is attributed to the layer that owns it. Every call is the strict surface — `.strict` on
// branch kinds, `.<form>.strict` on a namespaced form, and the bare factory on
// leaves (leaves have no `.strict`; they are already it).
//
// What rebuilds here is the file's skeleton: the import with its type
// modifier and both function declarations with parameter and return
// annotations. Each body holds two statements (`let result = …;` and
// `return result;`); the real bodies are not written. Every shape below is
// constructible on this surface.
//
// Five spellings are worth naming, because getting one wrong reads as a
// missing feature rather than a wrong call:
//
//   - A thin wrapper's factory is POSITIONAL, not a config bag —
//     `ir.typeAnnotation.strict(type)`, never `.strict({ type })`.
//   - A namespaced form is reached as `ir.<kind>.<form>.strict(…)`;
//     `ir.<kind>.<form>(…)` is its coercing twin.
//   - A leaf's text is its own node: a string literal is built from its
//     fragment (`ir.string.single.strict({ elements: [fragment] })`), where
//     the coercer takes the quoted text whole.
//   - A determined slot takes the stamped enum member on the strict surface
//     (`TSKindId.TypeKeyword`), where the coercer takes its text (`'type'`).
//   - A hoisted arm is reached through its parent's sub-factory, which builds
//     the PARENT: `ir.importStatement.clauseFrom.strict(…)` takes the import
//     statement's own config. The arm's `importClause` key is also the
//     statement's, so the arm's config sits whole under the `fromClause`
//     slot instead of being merged into the statement's keys.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => ir.identifier.identifier(text);
const ann = (type: string) => ir.typeAnnotation.strict(id(type));

/** `import type { FormatRecord, FormatTrivia } from '@sittir/types';` */
export function importTypesStrict() {
	return ir.importStatement.clauseFrom.strict({
		importClause: TSKindId.TypeKeyword,
		fromClause: {
			importClause: ir.importClause.namedImports(
				ir.namedImports.strict(
					ir.importSpecifier.name({ name: 'FormatRecord' }),
					ir.importSpecifier.name({ name: 'FormatTrivia' })
				)
			),
			source: ir.string.single.strict(ir.unescapedSingleStringFragment('@sittir/types')),
		},
	});
}

/** The JSDoc block that leads `applyFormat`. */
export function applyFormatDocStrict() {
	return ir.comment.block(
		'*\n * Apply a {@link FormatRecord} to a canonical render string.\n *\n * @param canonicalRender - The template-canonical rendered string.\n * @param format - The format record to apply.\n * @returns The reconstructed string with boundary, trivia, slots, and\n *   literals applied.\n '
	);
}

function param(name: string, type: string) {
	return ir.requiredParameter.strict({ pattern: id(name), type: ann(type) });
}

/** `let <name> = <value>;` — the `;` is the terminator option's default. */
function letStrict(name: string, value: string) {
	return ir.lexicalDeclaration.strict({
		kind: 'let',
		declarators: [ir.variableDeclarator.plain.strict({ name: id(name), value: id(value) })],
	});
}

/** `function applyFormat(canonicalRender: string, format: FormatRecord): string { … }` */
export function applyFormatStrict() {
	return ir.declaration.function.strict({
		name: id('applyFormat'),
		parameters: ir.formalParameters.strict(param('canonicalRender', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: ir.statementBlock.strict({
			statements: [letStrict('result', 'canonicalRender'), returnResultStrict()],
		}),
	});
}

/** `function applyBoundary(s: string, format: FormatRecord): string { … }` */
export function applyBoundaryStrict() {
	return ir.declaration.function.strict({
		name: id('applyBoundary'),
		parameters: ir.formalParameters.strict(param('s', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: ir.statementBlock.strict({
			statements: [letStrict('result', 's'), returnResultStrict()],
		}),
	});
}

/** `return result;` */
export function returnResultStrict() {
	return ir.returnStatement.strict(id('result'));
}

/** `format.boundary` */
export function formatBoundaryStrict() {
	return ir.memberExpression.strict({ object: id('format'), separator: '.', property: id('boundary') });
}

export function rebuildFormatStrict() {
	return ir.program.strict({
		statements: [
			importTypesStrict(),
			applyFormatStrict().$trivia.leading(applyFormatDocStrict()),
			applyBoundaryStrict(),
		],
	});
}
