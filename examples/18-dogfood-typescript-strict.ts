import typescript from '@sittir/typescript';

const ts = await typescript.createEngine();

// The strict typescript dogfood: rebuilds `packages/tools/tests/emit/__fixtures__/dogfood-typescript.ts`
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
//     `ts.build.typeAnnotation.strict(type)`, never `.strict({ type })`.
//   - A namespaced form is reached as `ts.build.<kind>.<form>.strict(…)`;
//     `ts.build.<kind>.<form>(…)` is its coercing twin.
//   - A leaf's text is its own node: a string literal is built from its
//     fragment (`ts.build.string.single.strict({ elements: [fragment] })`), where
//     the coercer takes the quoted text whole.
//   - A determined slot takes the stamped enum member on the strict surface
//     (`ts.kinds.TypeKeyword`), where the coercer takes its text (`'type'`).
//   - A hoisted arm is reached through its parent's sub-factory, which builds
//     the PARENT: `ts.build.importStatement.clauseFrom.strict(…)` takes the import
//     statement's own config. The arm's `importClause` key is also the
//     statement's, so the arm's config sits whole under the `fromClause`
//     slot instead of being merged into the statement's keys.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => ts.build.identifier(text);
const ann = (type: string) => ts.build.typeAnnotation.strict(id(type));

/** `import type { FormatRecord, FormatTrivia } from '@sittir/types';` */
export function importTypesStrict() {
	return ts.build.importStatement.clauseFrom.strict({
		importClause: ts.kinds.TypeKeyword,
		fromClause: {
			importClause: ts.build.importClause.namedImports(
				ts.build.namedImports.strict(
					ts.build.importSpecifier.name({ name: 'FormatRecord' }),
					ts.build.importSpecifier.name({ name: 'FormatTrivia' })
				)
			),
			source: ts.build.string.single.strict(ts.build.unescapedSingleStringFragment('@sittir/types')),
		},
	});
}

/** The JSDoc block that leads `applyFormat`. */
export function applyFormatDocStrict() {
	return ts.build.comment.block(
		'*\n * Apply a {@link FormatRecord} to a canonical render string.\n *\n * @param canonicalRender - The template-canonical rendered string.\n * @param format - The format record to apply.\n * @returns The reconstructed string with boundary, trivia, slots, and\n *   literals applied.\n '
	);
}

function param(name: string, type: string) {
	return ts.build.requiredParameter.strict({ pattern: ts.build.lhsExpression.strict(id(name)), type: ann(type) });
}

/** `let <name> = <value>;` — the `;` is the terminator option's default. */
function letStrict(name: string, value: string) {
	return ts.build.lexicalDeclaration.strict({
		kind: ts.kinds.LetKeyword,
		declarators: [ts.build.variableDeclarator.plain.strict({ name: id(name), value: id(value) })],
	});
}

/** `function applyFormat(canonicalRender: string, format: FormatRecord): string { … }` */
export function applyFormatStrict() {
	return ts.build.declaration.function.strict({
		name: id('applyFormat'),
		parameters: ts.build.formalParameters.strict(param('canonicalRender', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: ts.build.statementBlock.strict(letStrict('result', 'canonicalRender'), returnResultStrict()),
	});
}

/** `function applyBoundary(s: string, format: FormatRecord): string { … }` */
export function applyBoundaryStrict() {
	return ts.build.declaration.function.strict({
		name: id('applyBoundary'),
		parameters: ts.build.formalParameters.strict(param('s', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: ts.build.statementBlock.strict(letStrict('result', 's'), returnResultStrict()),
	});
}

/** `return result;` */
export function returnResultStrict() {
	return ts.build.returnStatement.strict(id('result'));
}

/** `format.boundary` */
export function formatBoundaryStrict() {
	return ts.build.memberExpression.strict({ object: id('format'), separator: ts.kinds.Dot, property: id('boundary') });
}

export function rebuildFormatStrict() {
	return ts.build.program.strict({
		statements: [
			importTypesStrict(),
			applyFormatStrict().$trivia.leading(applyFormatDocStrict()),
			applyBoundaryStrict(),
		],
	});
}
