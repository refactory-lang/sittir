import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';
import { Delimiter } from '@sittir/common/utils';

const engine = await createEngine(rust);

// Rebuilds packages/tools/tests/emit/__fixtures__/dogfood-rust.rs through the FACTORY surface
// alone — every node is spelled with `.strict` or a namespaced form, never a
// loose config — so a coercion failure is never mistaken for a factory one.
// `17-dogfood-rust-loose.generated.ts` is the same target through the loose surface.
//
// Every gap marker names the layer that fails:
//   (exposure) the factory builds the shape correctly, but no public
//              constructor reaches it.
//   (coercion) the factory accepts the shape; the coercer will not resolve
//              the loose input into it.
//   (factory)  the builder itself cannot produce the shape.
//
// All six top-level items rebuild here with their real signatures,
// including `#[derive(…)]` and the `write!(f, …)` match arms.
// `apply_edits` holds its first two statements and an empty `sort_by`
// closure; the validation loop, the comparator and the apply loop are not
// written. The factory surface is currently the healthier of the two: the
// coercion rebuild renders those same arms as empty `{}` and drops the
// `sort_by` comparator, both of which are constructible below.
//
// A match arm is built through its variant, which carries the whole arm:
// `engine.build.matchArm.withComma({ pattern, value: expr })`. The parent kind is
// the pure choice of its variants and seats one of them.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => engine.build.identifier(text);
const tok = (content: Parameters<typeof engine.build.nonSpecialToken.strict>[0]) => engine.build.nonSpecialToken.strict(content);
const ns = (path: string, name: string) => engine.build.scopedIdentifier.strict({ path: id(path), name: id(name) });
const scopedTy = (path: Parameters<typeof engine.build.scopedTypeIdentifier.strict>[0]['path'], name: string) =>
	engine.build.scopedTypeIdentifier.strict({ path, name: id(name) });
const str = (text: string) =>
	engine.build.stringLiteral.strict({ stringOpen: engine.build.stringOpen('"'), elements: [engine.build.stringContent(text)] });

/** `use crate::types::Edit;` */
export function useEditStrict() {
	return engine.build.useDeclaration.strict({
		argument: engine.build.scopedIdentifier.strict({
			path: engine.build.scopedIdentifier.strict({ path: engine.build.crate, name: id('types') }),
			name: id('Edit'),
		}),
	});
}

/**
 * `#[derive(Debug, Clone, PartialEq, Eq)]`. The attribute's argument list
 * belongs to the `input` group, which is spliced onto `attribute`: its keys
 * (`value`, `arguments`) sit directly on the config and come as a whole.
 */
export function deriveStrict() {
	return engine.build.attributeItem.strict(
		engine.build.attribute.input.strict({
			path: id('derive'),
			arguments: engine.build.delimTokenTree.paren.strict(
				tok(id('Debug')),
				tok(engine.kinds.Comma),
				tok(id('Clone')),
				tok(engine.kinds.Comma),
				tok(id('PartialEq')),
				tok(engine.kinds.Comma),
				tok(id('Eq')),
			),
		})
	);
}

/** `pub enum SpliceError { InvalidRange { … }, OutOfBounds { … }, NonCharBoundary { … } }` */
function variantStrict(name: string, [first, second]: readonly [readonly [string, string], readonly [string, string]]) {
	const decl = ([field, type]: readonly [string, string]) =>
		engine.build.fieldDeclaration.strict({ name: id(field), type: id(type) });
	// A `repeat1` list will not take a spread of a possibly-empty array, so its
	// elements are named. That is the type doing its job: `<>` is not a legal node.
	return engine.build.enumVariant.strict({
		name: id(name),
		body: engine.build.fieldDeclarationList.strict(decl(first), decl(second)),
	});
}

export function spliceErrorEnumStrict() {
	return engine.build.statement.enum.strict({
		visibilityModifier: engine.build.visibilityModifier.pub(),
		name: id('SpliceError'),
		// The options object must be the first argument to a list factory.
		body: engine.build.enumVariantList.strict(
			{ delimiter: Delimiter.Trailing },
			variantStrict('InvalidRange', [
				['start', 'u32'],
				['end', 'u32'],
			] as const),
			variantStrict('OutOfBounds', [
				['end', 'u32'],
				['source_len', 'usize'],
			] as const),
			variantStrict('NonCharBoundary', [
				['start', 'u32'],
				['end', 'u32'],
			] as const)
		),
	});
}

/** `impl std::fmt::Display for SpliceError { fn fmt(…) { match self { … } } }` */
function armPattern(variant: string, [first, second]: readonly [string, string]) {
	return engine.build.matchPattern.strict({
		pattern: engine.build.structPattern.strict({
			type: scopedTy(id('SpliceError'), variant),
			fields: engine.build.structPatternElements.strict(
				engine.build.fieldPattern.shorthand.strict({ name: id(first) }),
				engine.build.fieldPattern.shorthand.strict({ name: id(second) })
			),
		}),
	});
}

function writeCall(format: string) {
	return engine.build.macroInvocation.strict({
		macro: id('write'),
		arguments: engine.build.delimTokenTree.paren.strict(tok(id('f')), tok(engine.kinds.Comma), tok(str(format))),
	});
}

export function displayImplStrict() {
	return engine.build.statement.impl.body.positiveClause.strict({
		traitClause: scopedTy(ns('std', 'fmt'), 'Display'),
		type: id('SpliceError'),
		declarationList: engine.build.declarationList.strict(
				engine.build.statement.function.strict({
					name: id('fmt'),
					parameters: engine.build.parameters.strict(
						engine.build.selfParameter.strict({ reference: true }),
						engine.build.parameter.strict({
							name: id('f'),
							type: engine.build.referenceType.strict({
								mutableSpecifier: true,
								type: engine.build.genericType.strict({
									type: scopedTy(ns('std', 'fmt'), 'Formatter'),
									typeArguments: engine.build.typeArguments.strict(engine.build.lifetime('_')),
								}),
							}),
						})
					),
					returnType: scopedTy(ns('std', 'fmt'), 'Result'),
					body: engine.build.block.strict({
						trailingExpression: engine.build.matchExpression.strict({
							value: engine.build.self,
							body: engine.build.matchBlock.strict({
								// A comma-terminated arm carrying a macro invocation: the arm
								// variant holds the whole arm, its pattern and its value.
								matchArm: [
									engine.build.matchArm.withComma({
										pattern: armPattern('InvalidRange', ['start', 'end'] as const),
										value: writeCall('invalid edit range: start={start}, end={end}'),
									}),
									engine.build.matchArm.withComma({
										pattern: armPattern('OutOfBounds', ['end', 'source_len'] as const),
										value: writeCall('edit out of bounds: end={end} > source length={source_len}'),
									}),
								],
								lastArm: engine.build.lastMatchArm.strict({
									pattern: armPattern('NonCharBoundary', ['start', 'end'] as const),
									value: writeCall('edit range not at UTF-8 char boundary: start={start}, end={end}'),
								}),
							}),
						}),
					}),
				})
		),
	});
}

/** `impl std::error::Error for SpliceError {}` */
export function errorImplStrict() {
	return engine.build.statement.impl.body.positiveClause.strict({
		traitClause: scopedTy(ns('std', 'error'), 'Error'),
		type: id('SpliceError'),
		declarationList: engine.build.declarationList.strict(),
	});
}

/** `pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError>` */
export function applyEditsFnStrict() {
	return engine.build.statement.function.strict({
		visibilityModifier: engine.build.visibilityModifier.pub(),
		name: id('apply_edits'),
		parameters: engine.build.parameters.strict(
			engine.build.parameter.strict({ name: id('source'), type: engine.build.referenceType.strict({ type: id('str') }) }),
			engine.build.parameter.strict({
				mutableSpecifier: true,
				name: id('edits'),
				type: engine.build.genericType.strict({ type: id('Vec'), typeArguments: engine.build.typeArguments.strict(id('Edit')) }),
			})
		),
		returnType: engine.build.genericType.strict({
			type: id('Result'),
			typeArguments: engine.build.typeArguments.strict(id('String'), id('SpliceError')),
		}),
		body: engine.build.block.strict({
			statements: [
				engine.build.statement.let.strict({
					pattern: id('source_len'),
					value: engine.build.callExpression.strict({
						function: engine.build.fieldExpression.strict({ value: id('source'), field: id('len') }),
						arguments: engine.build.arguments.strict(),
					}),
				}),
				engine.build.statement.expression.withSemi(
					engine.build.callExpression.strict({
						function: engine.build.fieldExpression.strict({ value: id('edits'), field: id('sort_by') }),
						arguments: engine.build.arguments.strict(
							// A config-merge form: the child block's own `body` key merges
							// into the closure's config rather than filling a `content` seat.
							engine.build.closureExpression.block({
								parameters: engine.build.closureParameters.strict(id('a'), id('b')),
								body: engine.build.block.strict(),
							})
						),
					})
				),
			],
		}),
	});
}

export function rebuildSpliceStrict() {
	return engine.build.sourceFile.strict({
		statements: [
			useEditStrict(),
			deriveStrict(),
			spliceErrorEnumStrict(),
			displayImplStrict(),
			errorImplStrict(),
			applyEditsFnStrict(),
		],
	});
}
