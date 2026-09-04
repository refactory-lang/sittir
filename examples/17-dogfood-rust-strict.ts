import { Delimiter, ir } from '@sittir/rust';

// Rebuilds rust/crates/sittir-core/src/splice.rs through the FACTORY surface
// alone — every node is spelled with `.strict` or a namespaced form, never a
// loose config — so a coercion failure is never mistaken for a factory one.
// `17-dogfood-rust.ts` rebuilds the same items through the coercion surface.
//
// Every gap marker names the layer that fails:
//   (exposure) the factory builds the shape correctly, but no public
//              constructor reaches it.
//   (coercion) the factory accepts the shape; the coercer will not resolve
//              the loose input into it.
//   (factory)  the builder itself cannot produce the shape.
//
// All six top-level items rebuild here, including `#[derive(…)]` and the
// `write!(f, …)` match arms. The factory surface is currently the healthier of
// the two: the coercion rebuild renders those same arms as empty `{}` and drops
// the `sort_by` comparator, both of which are constructible below.
//
// A form constructor whose seat holds the child's ARGUMENT TUPLE takes an
// array there — `ir.matchArm.withComma({ pattern, content: [expr] })`. A bare
// value in that position is a type error, and the runtime diagnostic it
// produces when the types are bypassed is opaque ("seated is not iterable",
// "Spread syntax requires ...iterable"), which is worth fixing on its own.
// Open issues on this surface: docs/factory-surface-issues.md

const id = (text: string) => ir.identifier(text);
const ns = (path: string, name: string) => ir.scopedIdentifier.strict({ path: id(path), name: id(name) });
const scopedTy = (path: Parameters<typeof ir.scopedTypeIdentifier.strict>[0]['path'], name: string) =>
	ir.scopedTypeIdentifier.strict({ path, name: id(name) });

/** `use crate::types::Edit;` */
export function useEditStrict() {
	return ir.useDeclaration.strict({
		argument: ir.scopedIdentifier.strict({
			path: ir.scopedIdentifier.strict({ path: ir.crate(), name: id('types') }),
			name: id('Edit'),
		}),
	});
}

/**
 * `#[derive(Debug, Clone, PartialEq, Eq)]`. The attribute's argument list is
 * the `input` slot, not an `arguments` key — an unrecognised key is
 * dropped silently, which makes a wrong spelling look like a missing feature.
 */
export function deriveStrict() {
	return ir.attributeItem.strict(
		ir.attribute.strict({
			path: id('derive'),
			input: ir.attributeInput.strict({
				arguments: ir.delimTokenTree.paren({
					delimTokens: ['Debug', ',', 'Clone', ',', 'PartialEq', ',', 'Eq'],
				}),
			}),
		})
	);
}

/** `pub enum SpliceError { InvalidRange { … }, OutOfBounds { … }, NonCharBoundary { … } }` */
function variantStrict(name: string, [first, second]: readonly [readonly [string, string], readonly [string, string]]) {
	const decl = ([field, type]: readonly [string, string]) =>
		ir.fieldDeclaration.strict({ name: id(field), type: id(type) });
	// A `repeat1` list will not take a spread of a possibly-empty array, so its
	// elements are named. That is the type doing its job: `<>` is not a legal node.
	return ir.enumVariant.strict({
		name: id(name),
		body: ir.fieldDeclarationList.strict(decl(first), decl(second)),
	});
}

export function spliceErrorEnumStrict() {
	return ir.statement.enum.strict({
		visibilityModifier: ir.visibilityModifier.pub(),
		name: id('SpliceError'),
		// Issue L2 (docs/factory-surface-issues.md): the `{ delimiter }` option is
		// honored in FIRST argument position only.
		body: ir.enumVariantList.strict(
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
	return ir.matchPattern.strict({
		pattern: ir.structPattern.strict({
			type: scopedTy(id('SpliceError'), variant),
			fields: ir.structPatternElements.strict(
				ir.fieldPattern.strict({ content: id(first) }),
				ir.fieldPattern.strict({ content: id(second) })
			),
		}),
	});
}

function writeCall(format: string, args: readonly string[]) {
	return ir.macroInvocation.strict({
		macro: id('write'),
		arguments: ir.delimTokenTree.paren({
			delimTokens: ['f', ',', format, ...args.flatMap((arg) => [',', arg])],
		}),
	});
}

export function displayImplStrict() {
	return ir.statement.impl.strict({
		traitClause: ir.implItem.positiveClause(scopedTy(ns('std', 'fmt'), 'Display')),
		type: id('SpliceError'),
		content: ir.implItem.body(
			ir.declarationList.strict(
				ir.statement.function.strict({
					name: id('fmt'),
					parameters: ir.parameters.strict(
						ir.selfParameter.strict({ reference: true }),
						ir.parameter.strict({
							name: id('f'),
							type: ir.referenceType.strict({
								mutableSpecifier: true,
								type: scopedTy(ns('std', 'fmt'), 'Formatter'),
							}),
						})
					),
					returnType: scopedTy(ns('std', 'fmt'), 'Result'),
					body: ir.block.strict({
						trailingExpression: ir.matchExpression.strict({
							value: ir.self(),
							body: ir.matchBlock.strict({
								// A comma-terminated arm carrying a macro invocation: the
								// `content` seat holds the child's argument tuple.
								matchArm: [
									ir.matchArm.withComma({
										pattern: armPattern('InvalidRange', ['start', 'end'] as const),
										content: [writeCall('"invalid range"', ['start', 'end'])],
									}),
									ir.matchArm.withComma({
										pattern: armPattern('OutOfBounds', ['end', 'source_len'] as const),
										content: [writeCall('"out of bounds"', ['end', 'source_len'])],
									}),
								],
								lastArm: ir.lastMatchArm.strict({
									pattern: armPattern('NonCharBoundary', ['start', 'end'] as const),
									value: writeCall('"non-char boundary"', ['start', 'end']),
								}),
							}),
						}),
					}),
				})
			)
		),
	});
}

/** `impl std::error::Error for SpliceError {}` */
export function errorImplStrict() {
	return ir.statement.impl.strict({
		traitClause: ir.implItem.positiveClause(scopedTy(ns('std', 'error'), 'Error')),
		type: id('SpliceError'),
		content: ir.implItem.body(ir.declarationList.strict()),
	});
}

/** `pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError>` */
export function applyEditsFnStrict() {
	return ir.statement.function.strict({
		visibilityModifier: ir.visibilityModifier.pub(),
		name: id('apply_edits'),
		parameters: ir.parameters.strict(
			ir.parameter.strict({ name: id('source'), type: ir.referenceType.strict({ type: id('str') }) }),
			ir.parameter.strict({
				mutableSpecifier: true,
				name: id('edits'),
				type: ir.genericType.strict({ type: id('Vec'), typeArguments: ir.typeArguments.strict(id('Edit')) }),
			})
		),
		returnType: ir.genericType.strict({
			type: id('Result'),
			typeArguments: ir.typeArguments.strict(id('String'), id('SpliceError')),
		}),
		body: ir.block.strict({
			statements: [
				ir.statement.let.strict({
					pattern: id('source_len'),
					value: ir.callExpression.strict({
						function: ir.fieldExpression.strict({ value: id('source'), field: id('len') }),
						arguments: ir.arguments.strict(),
					}),
				}),
				ir.statement.expression.withSemi(
					ir.callExpression.strict({
						function: ir.fieldExpression.strict({ value: id('edits'), field: id('sort_by') }),
						arguments: ir.arguments.strict(
							// A config-merge form: the child block's own `body` key merges
							// into the closure's config rather than filling a `content` seat.
							ir.closureExpression.block({
								parameters: ir.closureParameters.strict(id('a'), id('b')),
								body: ir.block.strict(),
							})
						),
					})
				),
			],
		}),
	});
}

export function rebuildSpliceStrict() {
	return ir.sourceFile.strict({
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
