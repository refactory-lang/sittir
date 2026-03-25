// @generated-header: false (hand-written core — preserved across regeneration)

/**
 * Validation in the new architecture is mostly handled at compile time:
 * - TypeScript types enforce correct fields, kinds, and multiplicity
 * - Template literal types validate terminal text patterns
 * - Render rules are grammar-derived data — if rules are correct, output is valid
 *
 * validateFull exists for end-to-end regression testing of render rules
 * (confirming the codegen produced correct rules for a grammar).
 * It is NOT needed for user-facing validation in normal workflows.
 */

/**
 * Full validation via tree-sitter parse.
 * Used for regression testing render rules against the grammar.
 */
export async function validateFull(
	source: string,
	parser: unknown,
): Promise<string> {
	const p = parser as
		| { parse(source: string): { rootNode: { hasError: boolean } } | null }
		| undefined;
	if (!p) {
		throw new Error(
			'Full validation requires a tree-sitter Parser instance',
		);
	}
	const tree = p.parse(source);
	if (!tree) throw new Error('tree-sitter parse returned null');
	if (tree.rootNode.hasError) {
		throw new Error(`Invalid source (tree-sitter):\n${source}`);
	}
	return source;
}
