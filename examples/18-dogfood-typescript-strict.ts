import { ir, TSKindId } from '@sittir/typescript';

// The strict half of the typescript dogfood: rebuilds the same items as
// `18-dogfood-typescript.ts` through `.strict` alone, so each gap is attributed
// to the layer that owns it. Every call is the strict surface — `.strict` on
// branch kinds, `.<form>.strict` on a namespaced form, and the bare factory on
// leaves (leaves have no `.strict`; they are already it).
//
// The whole file rebuilds here: the import with its type modifier, both
// function declarations with parameter and return annotations, and real
// statement bodies. The coercion half renders the same functions with empty
// bodies and no annotations; every one of those shapes is constructible below.
//
// Five spellings are worth naming, because getting one wrong reads as a
// missing feature rather than a wrong call:
//
//   - A thin wrapper's factory is POSITIONAL, not a config bag —
//     `ir.typeAnnotation.strict(type)`, never `.strict({ type })`.
//   - A namespaced form is reached as `ir.<kind>.<form>.strict(…)`;
//     `ir.<kind>.<form>(…)` is its coercing twin.
//   - A leaf's text is its own node: a string literal is built from its
//     fragment (`ir.string.single.strict({ elements2: [fragment] })`), where
//     the coercer takes the quoted text whole.
//   - A determined slot takes the stamped enum member on the strict surface
//     (`TSKindId.AnonType`), where the coercer takes its text (`'type'`).
//   - An ALIAS form yields its own kind rather than the parent's:
//     `ir.importStatement.arm.strict(…)` builds the arm, and the caller seats
//     it in `import_statement`'s `fromClause`. Rendered alone it carries
//     neither the `import` keyword nor the terminator, because those belong to
//     the parent's template.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => ir.identifier.identifier(text);
const ann = (type: string) => ir.typeAnnotation.strict(id(type));

/** `import type { FormatRecord, FormatTrivia } from '@sittir/types';` */
export function importTypesStrict() {
	return ir.importStatement.strict({
		importClause: TSKindId.AnonType,
		fromClause: ir.importStatement.arm.strict({
			importClause: ir.importClause.namedImports(
				ir.namedImports.strict(
					ir.importSpecifier({ content: 'FormatRecord' }),
					ir.importSpecifier({ content: 'FormatTrivia' })
				)
			),
			source: ir.string.single.strict({
				elements2: [ir.unescapedSingleStringFragment('@sittir/types')],
			}),
		}),
		semicolon: ';',
	});
}

/** The JSDoc block that leads `applyFormat`. */
export function applyFormatDocStrict() {
	return ir.comment(
		'/**\n * Apply a {@link FormatRecord} to a canonical render string.\n *\n * @param canonicalRender - The template-canonical rendered string.\n * @param format - The format record to apply.\n * @returns The reconstructed string with boundary, trivia, slots, and\n *   literals applied.\n */'
	);
}

function param(name: string, type: string) {
	return ir.requiredParameter.strict({ pattern: id(name), type: ann(type) });
}

/** `let <name> = <value>;` */
function letStrict(name: string, value: string) {
	return ir.lexicalDeclaration.semi({
		kind: 'let',
		declarators: [ir.variableDeclarator.arm1.strict({ name: id(name), value: id(value) })],
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

/** `return result;` — the `;` is filled by the form, not named by the caller. */
export function returnResultStrict() {
	return ir.returnStatement.semi({ expression: id('result') });
}

/** `format.boundary` */
export function formatBoundaryStrict() {
	return ir.memberExpression.strict({ object: id('format'), separator: '.', property: id('boundary') });
}

export function rebuildFormatStrict() {
	return ir.program.strict({
		statements: [
			importTypesStrict(),
			applyFormatStrict().$trivia({ leading: [applyFormatDocStrict()] }),
			applyBoundaryStrict(),
		],
	});
}
