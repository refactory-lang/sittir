import { Delimiter, ir } from '@sittir/rust';

// Rebuilds rust/crates/sittir-core/src/splice.rs with the construction
// surface alone: one function per top-level item, in file order, calling the
// `ir.*` API directly — no local wrappers, so the surface's own ergonomics
// are what the example shows.
//
// This module uses the COERCION surface: each `ir.<kind>` bundle IS its
// coercer, so a loose call is a direct call. `17-dogfood-rust-strict.ts`
// rebuilds the same items through `.strict` alone, so a coercion failure is
// never mistaken for a factory one.
//
// Every gap marker names the layer that fails:
//   (exposure) the factory builds the shape correctly, but no public
//              constructor reaches it — no `ir` entry, and `build*` is not
//              exported from the package.
//   (coercion) the factory accepts the shape; the coercer will not resolve
//              the loose input into it.
//   (factory)  the builder itself cannot produce the shape.
//
// GAP B (whole file): the emitted `Loose` types are far narrower than what the
// coercers accept at runtime — they reject `{ kind: … }` discriminated configs,
// string shorthands outside leaf slots, and arrays for list slots, and they
// admit the interface's ACCESSOR signatures (`() => Identifier`) as if those
// were config values. Every shape below runs; 72 of them do not type-check, so
// this module is excluded from `type-check:examples` until the projection is
// fixed. That exclusion is the marker — no casts are used to hide it.
//
// GAP B (whole file): the `kind:` discriminant accepts only raw grammar
// strings. `TSKindId.StructPattern` — the stamped kind enum the package
// exports for exactly this purpose — is rejected, so every config below has to
// re-spell a name the enum already holds.

/** `//! …` module docs + `use crate::types::Edit;` */
export function useEdit() {
	return ir
		.useDeclaration({
			argument: {
				kind: 'scoped_identifier',
				path: { kind: 'scoped_identifier', path: 'crate', name: 'types' },
				name: 'Edit',
			},
		})
		.$trivia({
			leading: [
				ir.lineComment.docInner(' Byte-level `apply_edits` on a source string.'),
				ir.lineComment.docInner(''),
				ir.lineComment.docInner(' Sorts edits by `start_pos` descending, applies each as a raw byte'),
				ir.lineComment.docInner(' splice on a `String`. Descending order guarantees earlier edits'),
				ir.lineComment.docInner(" aren't shifted by later ones, so consumers can produce edits in any"),
				ir.lineComment.docInner(' order and let us canonicalize.'),
				ir.lineComment.docInner(''),
				ir.lineComment.docInner(' # Overlap handling'),
				ir.lineComment.docInner(''),
				ir.lineComment.docInner(" Overlap detection is **explicitly** the consumer's responsibility —"),
				ir.lineComment.docInner(' see contracts/napi-api.md `applyEdits` contract. This function does'),
				ir.lineComment.docInner(' NOT validate that edits are disjoint; overlapping edits fall through'),
				ir.lineComment.docInner(' to last-wins behavior (after sort-descending, the edit with the'),
				ir.lineComment.docInner(' greatest `start_pos` applies first, and subsequent edits whose'),
				ir.lineComment.docInner(' ranges still reference valid offsets within the intermediate string'),
				ir.lineComment.docInner(' apply afterward).'),
				ir.lineComment.docInner(''),
				ir.lineComment.docInner(' # Validation'),
				ir.lineComment.docInner(''),
				ir.lineComment.docInner(' Per-edit validation: `start_pos <= end_pos <= source.len()` (bytes).'),
				ir.lineComment.docInner(' Violations return `Err` rather than panic so the napi wrapper can'),
				ir.lineComment.docInner(' surface a typed error to JS. UTF-8 boundary correctness is also'),
				ir.lineComment.docInner(' checked on the splice (via `String::replace_range`) — non-char-'),
				ir.lineComment.docInner(' boundary ranges produce a `Result::Err` instead of panicking.'),
			],
		});
}

/** `/// Error returned …` + `#[derive(…)]` — an attribute is its own
 *  statement in `source_file`, so the doc comment leads it. */
export function spliceErrorDerive() {
	return (
		ir
			// GAP A: `#[derive(Debug, Clone, PartialEq, Eq)]` — the `(…)` lives in
			// `_attribute_arm`, a hidden group with a factory but no ir entry, no
			// from() form and no wrap-table row. `#[derive]` is the closest shape.
			.attributeItem({ attribute: { path: 'derive' } })
			.$trivia({
				leading: [ir.lineComment.docOuter(' Error returned from [`apply_edits`] when an edit is invalid.')],
			})
	);
}

/** `pub enum SpliceError { InvalidRange { … }, OutOfBounds { … }, NonCharBoundary { … } }` */
export function spliceErrorEnum() {
	return ir.statement.enum({
		visibilityModifier: 'pub',
		name: 'SpliceError',
		// GAP C: the `{ delimiter }` option is honored only as the FIRST argument;
		// in last position — where the signature also admits it — the list builder
		// wraps it as an element and the native transport rejects it.
		body: ir.enumVariantList.strict(
			{ delimiter: Delimiter.Trailing },
			ir
				.enumVariant({
					name: 'InvalidRange',
					// GAP B: a two-branch list slot (`field_declaration_list |
					// ordered_field_declaration_list`) takes no array through the
					// coercer; only the strict variadic list builder does.
					body: ir.fieldDeclarationList.strict(
						ir.fieldDeclaration({ name: 'start', type: 'u32' }),
						ir.fieldDeclaration({ name: 'end', type: 'u32' })
					),
				})
				.$trivia({ leading: [ir.lineComment.docOuter(' `end_pos < start_pos` — the edit range is reversed.')] }),
			ir
				.enumVariant({
					name: 'OutOfBounds',
					body: ir.fieldDeclarationList.strict(
						ir.fieldDeclaration({ name: 'end', type: 'u32' }),
						ir.fieldDeclaration({ name: 'source_len', type: 'usize' })
					),
				})
				.$trivia({ leading: [ir.lineComment.docOuter(' `end_pos > source.len()` — edit reaches past end of source.')] }),
			ir
				.enumVariant({
					name: 'NonCharBoundary',
					body: ir.fieldDeclarationList.strict(
						ir.fieldDeclaration({ name: 'start', type: 'u32' }),
						ir.fieldDeclaration({ name: 'end', type: 'u32' })
					),
				})
				.$trivia({ leading: [ir.lineComment.docOuter(" `start_pos` or `end_pos` isn't a UTF-8 char boundary.")] })
		),
	});
}

/** `impl std::fmt::Display for SpliceError { fn fmt(…) … }` */
export function displayImpl() {
	return ir.statement.impl({
		// GAP B: `_impl_item_positive_clause` is a two-arm hidden choice, so the
		// coercer takes neither a string nor a `{ kind }` config for it. The string
		// falls through UNRESOLVED into the slot and renders verbatim, silently
		// dropping the `for` the clause template writes — wrong output, not an error.
		traitClause: 'std::fmt::Display',
		type: 'SpliceError',
		content: ir.declarationList.strict(
			ir.statement.function({
				name: 'fmt',
				parameters: ir.parameters.strict(
					ir.selfParameter({ reference: true }),
					ir.parameter({
						name: 'f',
						type: ir.referenceType({
							mutableSpecifier: true,
							type: {
								kind: 'generic_type',
								type: {
									kind: 'scoped_type_identifier',
									path: { kind: 'scoped_identifier', path: 'std', name: 'fmt' },
									name: 'Formatter',
								},
								typeArguments: ["'_"],
							},
						}),
					})
				),
				returnType: {
					kind: 'scoped_type_identifier',
					path: { kind: 'scoped_identifier', path: 'std', name: 'fmt' },
					name: 'Result',
				},
				body: ir.block.strict({
					trailingExpression: ir.matchExpression({
						value: 'self',
						// GAP B: `match_block` rejects the `{ matchArm, lastArm }` config
						// its own arms rule requires (`_match_block_arms` is hidden and
						// absent from the from map); only the strict builder accepts it.
						body: ir.matchBlock.strict({
							matchArm: [
								ir.matchArm({
									// GAP B: `match_arm.pattern` is a `match_pattern` whose own
									// required slot is also called `pattern`, and the coercer
									// takes no bare pattern for it — every arm spells the wrapper.
									pattern: {
										pattern: {
											kind: 'struct_pattern',
											type: { kind: 'scoped_type_identifier', path: 'SpliceError', name: 'InvalidRange' },
											fields: [{ content: 'start' }, { content: 'end' }],
										},
									},
									// GAP A: `write!(f, "…")` — the macro's `delim_token_tree` slot
									// has no constructor: `ir.tokenTree.delimTokenTreeParen` builds
									// a `token_tree` paren variant, which the delim slot rejects
									// (unknown kind id 168).
									// GAP A: `_match_arm_with_comma` (the `pattern => expr,` arm) is
									// hidden and absent from the from map, so a comma-terminated arm
									// cannot be built either. A bare block is the closest shape.
									content: ir.block.strict(),
								}),
								ir.matchArm({
									pattern: {
										pattern: {
											kind: 'struct_pattern',
											type: { kind: 'scoped_type_identifier', path: 'SpliceError', name: 'OutOfBounds' },
											fields: [{ content: 'end' }, { content: 'source_len' }],
										},
									},
									content: ir.block.strict(),
								}),
							],
							lastArm: ir.lastMatchArm({
								pattern: {
									pattern: {
										kind: 'struct_pattern',
										type: { kind: 'scoped_type_identifier', path: 'SpliceError', name: 'NonCharBoundary' },
										fields: [{ content: 'start' }, { content: 'end' }],
									},
								},
								value: ir.block.strict(),
							}),
						}),
					}),
				}),
			})
		),
	});
}

/** `impl std::error::Error for SpliceError {}` */
export function errorImpl() {
	// GAP B: same unresolved two-arm trait clause as displayImpl.
	return ir.statement.impl({
		traitClause: 'std::error::Error',
		type: 'SpliceError',
		content: ir.declarationList.strict(),
	});
}

/** `pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError>` */
export function applyEditsFn() {
	return ir
		.functionItem({
			visibilityModifier: 'pub',
			name: 'apply_edits',
			parameters: ir.parameters.strict(
				ir.parameter({ name: 'source', type: ir.referenceType({ type: 'str' }) }),
				// GAP B: `mut edits: Vec<Edit>` — `parameter.mutableSpecifier` takes the
				// boolean, but the pattern slot has no loose form that keeps the `mut`
				// next to the name.
				ir.parameter({
					mutableSpecifier: true,
					name: 'edits',
					type: { kind: 'generic_type', type: 'Vec', typeArguments: ['Edit'] },
				})
			),
			returnType: {
				kind: 'generic_type',
				type: 'Result',
				typeArguments: ['String', 'SpliceError'],
			},
			body: ir.block.strict({
				statements: [
					ir.letDeclaration({
						pattern: 'source_len',
						value: ir.callExpression({
							function: ir.fieldExpression({ value: 'source', field: 'len' }),
							arguments: [],
						}),
					}),
					// GAP A: `edits.sort_by(|a, b| …)` — a closure body is a
					// `_closure_expression_block` arm; the hidden arm is absent from the
					// from map and a bare block is rejected (unknown kind id 294), so the
					// sort call below carries no comparator.
					ir.statement.expression.withSemi({
						expression: ir.callExpression({
							function: ir.fieldExpression({ value: 'edits', field: 'sort_by' }),
							arguments: [],
						}),
					}),
					ir.statement.expression(
						ir.forExpression({
							pattern: 'e',
							value: ir.referenceExpression({ value: 'edits' }),
							body: ir.block.strict(),
						})
					),
					ir.letDeclaration({
						mutableSpecifier: true,
						pattern: 'buf',
						value: ir.callExpression({
							function: { kind: 'scoped_identifier', path: 'String', name: 'from' },
							arguments: ['source'],
						}),
					}),
				],
				trailingExpression: ir.callExpression({ function: 'Ok', arguments: ['buf'] }),
			}),
		})
		.$trivia({
			leading: [
				ir.lineComment.docOuter(' Apply a batch of edits to a source string, returning the modified'),
				ir.lineComment.docOuter(' source. See module docs for the sort-descending strategy and the'),
				ir.lineComment.docOuter(' consumer-owned overlap contract.'),
			],
		});
}

export function rebuildSplice() {
	return ir.sourceFile({
		statements: [useEdit(), spliceErrorDerive(), spliceErrorEnum(), displayImpl(), errorImpl(), applyEditsFn()],
	});
}
