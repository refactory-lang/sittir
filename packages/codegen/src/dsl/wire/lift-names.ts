import { getEnrichMints, type GrammarResult } from '../enrich.ts';
import { collectSymbolRefs } from '../../util/reachable-rules.ts';
import { renameNameList, renameRule } from './symbol-renames.ts';
import { liftRenames, type WiredOpts } from './wire.ts';

type WiredGrammar = GrammarResult['grammar'];

const NAME_LISTS = ['inline', 'supertypes', 'conflicts', 'precedences', 'extras', 'externals'] as const;

export function resolveLiftNames(grammar: WiredGrammar, enriched: unknown, opts: WiredOpts): void {
	const liftNames = opts.__wireContext__?.liftNames;
	if (liftNames === undefined || liftNames.size === 0) return;
	const mints = getEnrichMints(enriched);
	for (const liftName of liftNames.keys()) {
		if (!mints.has(liftName)) throw new Error(`resolveLiftNames: '${liftName}' carries a variant name but is not a rule enrich minted`);
	}
	for (const [ruleName, body] of Object.entries(grammar.rules)) {
		const refs = new Set<string>();
		collectSymbolRefs(body, refs);
		for (const ref of refs) {
			if (liftNames.get(ref)?.hoisted === true && ref !== ruleName) {
				throw new Error(
					`variant(): the lift '${ref}' was hoisted into '${liftNames.get(ref)!.name}', whose body is not the lift's, but '${ruleName}' still references it; naming that reference '${liftNames.get(ref)!.name}' would change what '${ruleName}' matches`
				);
			}
		}
	}
	const renames = liftRenames(opts.__wireContext__);
	const ruleOrder = Object.keys(grammar.rules).join('\n');
	for (const [ruleName, body] of Object.entries(grammar.rules)) grammar.rules[ruleName] = renameRule(body, renames) as typeof body;
	if (Object.keys(grammar.rules).join('\n') !== ruleOrder) throw new Error('resolveLiftNames: renaming changed the rule order');
	for (const key of NAME_LISTS) {
		if (grammar[key] !== undefined) grammar[key] = renameNameList(grammar[key], renames);
	}
	if (typeof grammar.word === 'string') grammar.word = renameNameList(grammar.word, renames);
}
