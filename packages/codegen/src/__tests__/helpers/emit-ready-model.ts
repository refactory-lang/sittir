import { compileGrammar } from '../../compiler/compile.ts';
import { computeNodeSCC } from '../../compiler/scc.ts';
import { resolveRenderRules, whitespaceTextOf } from '../../compiler/model/render-rules.ts';
import { collectSitePreferences } from '../../compiler/model/site-preferences.ts';
import { collectKindEntries } from '../../emitters/kind-discriminant.ts';
import { stampStaticSpacing } from '../../emitters/templates.ts';
import { grammarPackage } from '../../grammars.ts';

export async function emitReadyModel(grammar: string) {
	const { raw, nodeMap, generatedIdTables } = await compileGrammar({ package: grammarPackage(grammar) });
	nodeMap.scc = computeNodeSCC(nodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const rulesConfig = { nodeMap, kindEntries, options: raw.options, whitespaceText: whitespaceTextOf(raw.renderAs, nodeMap) };
	const renderRules = resolveRenderRules(rulesConfig, (spaced) => stampStaticSpacing(nodeMap, grammar, spaced, kindEntries)).seamed;
	collectSitePreferences({ nodeMap, kindEntries, renderRules, options: raw.options });
	return { raw, nodeMap, kindEntries, generatedIdTables, renderRules };
}
