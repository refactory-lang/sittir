import type { Rule } from './rule.ts';
import { isLinkSymbol } from './rule.ts';

function unwrapStructuralPassthroughs(content: Rule): Rule {
	switch (content.type) {
		case 'optional':
		case 'group':
		case 'variant':
		case 'token':
		case 'terminal':
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
	if (core.type === 'choice') {
		return core.members.some((member) => fieldContentIsMultiSibling(member));
	}
	if (core.type !== 'seq') return false;
	let count = 0;
	for (const member of core.members) {
		let unwrapped: Rule = member;
		while (
			unwrapped.type === 'optional' ||
			unwrapped.type === 'variant' ||
			unwrapped.type === 'group' ||
			unwrapped.type === 'token' ||
			unwrapped.type === 'terminal'
		) {
			unwrapped = (unwrapped as { content: Rule }).content;
		}
		switch (unwrapped.type) {
			case 'symbol':
				if (isLinkSymbol(unwrapped)) break;
				count++;
				if (count >= 2) return true;
				break;
			case 'supertype':
			case 'alias':
			case 'field':
			case 'repeat':
			case 'repeat1':
				count++;
				if (count >= 2) return true;
				break;
			default:
				break;
		}
	}
	return false;
}
