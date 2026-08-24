import { Delimiter, ir } from '@sittir/rust';

// Rebuilds rust/crates/sittir-core/src/splice.rs with the construction
// surface alone: one helper per top-level item, in file order. Each `ir.<kind>`
// bundle IS its coercer, so the loose form is a direct call; `.strict` is the
// explicit-node builder.
//
// GAP B (whole file): the emitted `Loose` types are far narrower than what the
// coercers accept at runtime — they reject `{ kind: … }` discriminated configs,
// string shorthands outside leaf slots, and arrays for list slots, and they
// admit the interface's ACCESSOR signatures (`() => Identifier`) as if those
// were config values. Every shape below runs; 38 of them do not type-check, so
// this module is excluded from `type-check:examples` until the projection is
// fixed. That exclusion is the marker — no casts are used to hide it.

/** The `//!` module doc block — one inner doc comment per line, attached as
 *  leading trivia of the first item. Text is verbatim after the `//!`. */
const moduleDoc = [
	' Byte-level `apply_edits` on a source string. Spec 012 T024.',
	'',
	' Sorts edits by `start_pos` descending, applies each as a raw byte',
	' splice on a `String`. Descending order guarantees earlier edits',
	" aren't shifted by later ones, so consumers can produce edits in any",
	' order and let us canonicalize.',
	'',
	' # Overlap handling',
	'',
	" Overlap detection is **explicitly** the consumer's responsibility —",
	' see contracts/napi-api.md `applyEdits` contract. This function does',
	' NOT validate that edits are disjoint; overlapping edits fall through',
	' to last-wins behavior (after sort-descending, the edit with the',
	' greatest `start_pos` applies first, and subsequent edits whose',
	' ranges still reference valid offsets within the intermediate string',
	' apply afterward).',
	'',
	' # Validation',
	'',
	' Per-edit validation: `start_pos <= end_pos <= source.len()` (bytes).',
	' Violations return `Err` rather than panic so the napi wrapper can',
	' surface a typed error to JS. UTF-8 boundary correctness is also',
	' checked on the splice (via `String::replace_range`) — non-char-',
	' boundary ranges produce a `Result::Err` instead of panicking.',
];

// GAP A: `//!` and `///` are `_line_comment_doc` — a factory exists
// (buildLineCommentDoc) but the kind has no ir entry, no from() form and no
// wrap-table row, so the doc marker cannot be constructed. A plain `//`
// comment carrying the marker as text is the closest legal shape.
const innerDoc = (doc: string) => ir.lineComment(`!${doc}`);
const outerDoc = (doc: string) => ir.lineComment(`/${doc}`);

const u32 = () => ir.from.type('u32');

function useEdit() {
	return ir.useDeclaration
		.from({
			argument: {
				kind: 'scoped_identifier',
				path: { kind: 'scoped_identifier', path: 'crate', name: 'types' },
				name: 'Edit',
			},
		})
		.$trivia({ leading: moduleDoc.map(innerDoc) });
}

/** `/// Error returned …` + `#[derive(…)]` — an attribute is its own
 *  statement in `source_file`, so the doc comment leads it. */
function spliceErrorDerive() {
	return (
		ir.attributeItem
			// GAP A: `#[derive(Debug, Clone, PartialEq, Eq)]` — the `(…)` lives in
			// `_attribute_arm`, a hidden group with a factory but no ir entry, no
			// from() form and no wrap-table row. `#[derive]` is the closest shape.
			.from({ attribute: { path: 'derive' } })
			.$trivia({ leading: [outerDoc(' Error returned from [`apply_edits`] when an edit is invalid.')] })
	);
}

function spliceErrorEnum() {
	// GAP B: a two-branch list slot (`field_declaration_list |
	// ordered_field_declaration_list`) takes no array through from(); only the
	// strict variadic list builder does.
	const structBody = (fields: [string, unknown][]) =>
		ir.fieldDeclarationList.strict(
			...fields.map(([fieldName, type]) => ir.fieldDeclaration({ name: fieldName, type }))
		);
	const variant = (doc: string, name: string, fields: [string, unknown][]) =>
		ir.enumVariant({ name, body: structBody(fields) }).$trivia({ leading: [outerDoc(doc)] });
	return ir.enumItem({
		visibilityModifier: 'pub',
		name: 'SpliceError',
		// GAP C: the `{ delimiter }` option is honored only as the FIRST
		// argument; in last position — where the signature also admits it — the
		// list builder wraps it as an element and the native transport rejects it.
		body: ir.enumVariantList.strict(
			{ delimiter: Delimiter.Trailing },
			variant(' `end_pos < start_pos` — the edit range is reversed.', 'InvalidRange', [
				['start', u32()],
				['end', u32()],
			]),
			variant(' `end_pos > source.len()` — edit reaches past end of source.', 'OutOfBounds', [
				['end', u32()],
				['source_len', ir.from.type('usize')],
			]),
			variant(" `start_pos` or `end_pos` isn't a UTF-8 char boundary.", 'NonCharBoundary', [
				['start', u32()],
				['end', u32()],
			])
		),
	});
}

/** `impl std::fmt::Display for SpliceError { fn fmt(…) … }` */
function displayImpl() {
	return ir.implItem({
		// GAP B: `_impl_item_positive_clause` is a two-arm hidden choice, so
		// _resolveOne takes neither a string nor a `{ kind }` config for it. The
		// string falls through UNRESOLVED into the slot and renders verbatim,
		// silently dropping the `for` the clause template writes — wrong output
		// rather than an error.
		traitClause: 'std::fmt::Display',
		type: 'SpliceError',
		content: ir.declarationList.strict(fmtFn()),
	});
}

function fmtFn() {
	return ir.functionItem({
		name: 'fmt',
		parameters: ir.parameters.strict(
			ir.selfParameter({ reference: true }),
			ir.parameter({
				name: 'f',
				type: ir.referenceType({
					mutableSpecifier: true,
					type: {
						kind: 'generic_type',
						type: { kind: 'scoped_type_identifier', path: { kind: 'scoped_identifier', path: 'std', name: 'fmt' }, name: 'Formatter' },
						typeArguments: ["'_"],
					},
				}),
			})
		),
		returnType: { kind: 'scoped_type_identifier', path: { kind: 'scoped_identifier', path: 'std', name: 'fmt' }, name: 'Result' },
		body: ir.block.strict({ trailingExpression: matchSelf() }),
	});
}

function matchSelf() {
	// GAP B: `match_arm.pattern` is a `match_pattern` whose own required slot
	// is also called `pattern`, and from() takes no bare pattern for it — every
	// arm has to spell the wrapper. Written as the wrapper config below.
	const arm = (variant: string, fields: string[], message: string) =>
		ir.matchArm({
			pattern: {
				pattern: {
					kind: 'struct_pattern',
					type: { kind: 'scoped_type_identifier', path: 'SpliceError', name: variant },
					fields,
				},
			},
			// GAP A: `write!(f, "…")` — the macro's `delim_token_tree` slot has no
			// constructor: `ir.tokenTree.delimTokenTreeParen` builds a `token_tree`
			// paren variant, which the delim slot rejects (unknown kind id 168).
			// GAP A: `_match_arm_with_comma` (the `pattern => expr,` arm) is
			// hidden and absent from the from map, so a comma-terminated arm
			// cannot be built either. A bare block body is the closest legal shape.
			content: ir.block.strict(),
		});
	const lastArm = (variant: string, fields: string[]) =>
		ir.lastMatchArm({
			pattern: {
				pattern: {
					kind: 'struct_pattern',
					type: { kind: 'scoped_type_identifier', path: 'SpliceError', name: variant },
					fields,
				},
			},
			value: ir.block.strict(),
		});
	return ir.matchExpression({
		value: 'self',
		// GAP B: `match_block.from()` rejects the `{ matchArm, lastArm }` config
		// its own arms rule requires (`_match_block_arms` is hidden and absent
		// from the from map); only the strict builder accepts it.
		body: ir.matchBlock.strict({
			matchArm: [
				arm('InvalidRange', ['start', 'end'], 'invalid edit range'),
				arm('OutOfBounds', ['end', 'source_len'], 'edit out of bounds'),
			],
			lastArm: lastArm('NonCharBoundary', ['start', 'end']),
		}),
	});
}

/** `impl std::error::Error for SpliceError {}` */
function errorImpl() {
	// GAP B: same unresolved two-arm trait clause as displayImpl.
	return ir.implItem({
		traitClause: 'std::error::Error',
		type: 'SpliceError',
		content: ir.declarationList.strict(),
	});
}

/** `pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError>` */
function applyEditsFn() {
	const validationLoop = ir.forExpression({
		pattern: 'e',
		value: ir.referenceExpression({ value: 'edits' }),
		body: ir.block.strict(),
	});
	return ir.functionItem
		.from({
			visibilityModifier: 'pub',
			name: 'apply_edits',
			parameters: ir.parameters.strict(
				ir.parameter({ name: 'source', type: ir.referenceType({ type: ir.from.type('str') }) }),
				// GAP B: `mut edits: Vec<Edit>` — `parameter.mutableSpecifier` takes
				// the boolean, but the pattern slot has no loose form that keeps the
				// `mut` next to the name.
				ir.parameter({
					mutableSpecifier: true,
					name: 'edits',
					type: { kind: 'generic_type', type: 'Vec', typeArguments: [ir.from.type('Edit')] },
				})
			),
			returnType: { kind: 'generic_type', type: 'Result', typeArguments: [ir.from.type('String'), ir.from.type('SpliceError')] },
			body: ir.block.strict({
				statements: [
					ir.letDeclaration({
						pattern: 'source_len',
						value: ir.callExpression({ function: ir.fieldExpression({ value: 'source', field: 'len' }), arguments: [] }),
					}),
					ir.expressionStatement(validationLoop),
					// GAP A: a `call();` statement needs the hidden
					// `_expression_statement_with_semi` arm — absent from the from map,
					// and a bare call_expression is rejected by the content slot
					// (unknown kind id 257). The calls below are elided.
					// GAP A: `edits.sort_by(|a, b| …)` — a closure body is a
					// `_closure_expression_block` arm; the hidden arm is absent from
					// the from map and a bare block is rejected by the content slot
					// (unknown kind id 294).
					ir.letDeclaration({
						mutableSpecifier: true,
						pattern: 'buf',
						value: ir.callExpression({ function: { kind: 'scoped_identifier', path: 'String', name: 'from' }, arguments: ['source'] }),
					}),
				],
				trailingExpression: ir.callExpression({ function: 'Ok', arguments: ['buf'] }),
			}),
		})
		.$trivia({
			leading: [
				outerDoc(' Apply a batch of edits to a source string, returning the modified'),
				outerDoc(' source. See module docs for the sort-descending strategy and the'),
				outerDoc(' consumer-owned overlap contract.'),
			],
		});
}

export function rebuildSplice() {
	return ir.sourceFile({
		statements: [useEdit(), spliceErrorDerive(), spliceErrorEnum(), displayImpl(), errorImpl(), applyEditsFn()],
	});
}
