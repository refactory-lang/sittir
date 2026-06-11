import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../types/rule.ts';
import { isLinkSymbol } from '../types/rule.ts';

function unwrapStructuralPassthroughs(content: Rule): Rule {
	switch (content.type) {
		case OPTIONAL:
		case GROUP:
		case VARIANT:
		case TOKEN:
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
			return unwrapStructuralPassthroughs(content.content);
		default:
			return content;
	}
}

/**
 * True when a field's content would have tree-sitter emit multiple children under
 * the same field name at parse time.
 */
export function fieldContentIsMultiSibling(content: Rule): boolean {
	const core = unwrapStructuralPassthroughs(content);
	if (core.type === CHOICE) {
		return core.members.some((member) => fieldContentIsMultiSibling(member));
	}
	if (core.type !== SEQ) return false;
	let count = 0;
	for (const member of core.members) {
		let unwrapped: Rule = member;
		while (
			unwrapped.type === OPTIONAL ||
			unwrapped.type === VARIANT ||
			unwrapped.type === GROUP ||
			unwrapped.type === TOKEN
			// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from Rule union.
		) {
			unwrapped = (unwrapped as { content: Rule }).content;
		}
		switch (unwrapped.type) {
			case SYMBOL:
				if (isLinkSymbol(unwrapped)) break;
				count++;
				if (count >= 2) return true;
				break;
			case SUPERTYPE:
			case ALIAS:
			case FIELD:
			case REPEAT:
			case REPEAT1:
				count++;
				if (count >= 2) return true;
				break;
			default:
				break;
		}
	}
	return false;
}
