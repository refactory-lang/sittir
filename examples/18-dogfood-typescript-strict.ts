import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

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
//     `engine.build.typeAnnotation.strict(type)`, never `.strict({ type })`.
//   - A namespaced form is reached as `engine.build.<kind>.<form>.strict(…)`;
//     `engine.build.<kind>.<form>(…)` is its coercing twin.
//   - A leaf's text is its own node: a string literal is built from its
//     fragment (`engine.build.string.single.strict({ elements: [fragment] })`), where
//     the coercer takes the quoted text whole.
//   - A determined slot takes the stamped enum member on the strict surface
//     (`engine.kinds.TypeKeyword`), where the coercer takes its text (`'type'`).
//   - A hoisted arm is reached through its parent's sub-factory, which builds
//     the PARENT: `engine.build.importStatement.clauseFrom.strict(…)` takes the import
//     statement's own config. The arm's `importClause` key is also the
//     statement's, so the arm's config sits whole under the `fromClause`
//     slot instead of being merged into the statement's keys.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => engine.build.identifier(text);
const ann = (type: string) => engine.build.typeAnnotation.strict(id(type));

/** `import type { FormatRecord, FormatTrivia } from '@sittir/types';` */
export function importTypesStrict() {
	return engine.build.importStatement.clauseFrom.strict({
		importClause: engine.kinds.TypeKeyword,
		fromClause: {
			importClause: engine.build.importClause.namedImports(
				engine.build.namedImports.strict(
					engine.build.importSpecifier.name({ name: 'FormatRecord' }),
					engine.build.importSpecifier.name({ name: 'FormatTrivia' })
				)
			),
			source: engine.build.string.single.strict(engine.build.unescapedSingleStringFragment('@sittir/types')),
		},
	});
}

/** The JSDoc block that leads `applyFormat`. */
export function applyFormatDocStrict() {
	return engine.build.comment.block(
		'*\n * Apply a {@link FormatRecord} to a canonical render string.\n *\n * @param canonicalRender - The template-canonical rendered string.\n * @param format - The format record to apply.\n * @returns The reconstructed string with boundary, trivia, slots, and\n *   literals applied.\n '
	);
}

function param(name: string, type: string) {
	return engine.build.requiredParameter.strict({ pattern: engine.build.lhsExpression.strict(id(name)), type: ann(type) });
}

/** `let <name> = <value>;` — the `;` is the terminator option's default. */
function letStrict(name: string, value: string) {
	return engine.build.lexicalDeclaration.strict({
		kind: engine.kinds.LetKeyword,
		declarators: [engine.build.variableDeclarator.plain.strict({ name: id(name), value: id(value) })],
	});
}

/** `function applyFormat(canonicalRender: string, format: FormatRecord): string { … }` */
export function applyFormatStrict() {
	return engine.build.declaration.function.strict({
		name: id('applyFormat'),
		parameters: engine.build.formalParameters.strict(param('canonicalRender', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: engine.build.statementBlock.strict({
			statements: [letStrict('result', 'canonicalRender'), returnResultStrict()],
		}),
	});
}

/** `function applyBoundary(s: string, format: FormatRecord): string { … }` */
export function applyBoundaryStrict() {
	return engine.build.declaration.function.strict({
		name: id('applyBoundary'),
		parameters: engine.build.formalParameters.strict(param('s', 'string'), param('format', 'FormatRecord')),
		returnType: ann('string'),
		body: engine.build.statementBlock.strict({
			statements: [letStrict('result', 's'), returnResultStrict()],
		}),
	});
}

/** `return result;` */
export function returnResultStrict() {
	return engine.build.returnStatement.strict(id('result'));
}

/** `format.boundary` */
export function formatBoundaryStrict() {
	return engine.build.memberExpression.strict({ object: id('format'), separator: engine.kinds.Dot, property: id('boundary') });
}

export function rebuildFormatStrict() {
	return engine.build.program.strict({
		statements: [
			importTypesStrict(),
			applyFormatStrict().$trivia.leading(applyFormatDocStrict()),
			applyBoundaryStrict(),
		],
	});
}
