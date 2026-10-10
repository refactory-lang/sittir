// Classifies every automatic variant label (enrich's `stampRuleVariants`) per grammar, to size what stopping
// automatic naming would cost. Read-only. Usage: tsx automatic-variants.mts <checkout> [out-dir]
// Group 1: labels on supertype members. Group 2: labels on arms of non-supertype choices.
// Also: link's per-label provenance (`VariantChild.definedBy`, 'enrich' for an automatic label) against the
// minted split master's `ir` used for flattened routes (child named `<parent>_<variant>` and only reachable through
// that parent), and which automatically named parser kinds a bindings claim names.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const [root, outDir] = process.argv.slice(2);
if (root === undefined) throw new Error('usage: tsx automatic-variants.mts <checkout> [out-dir]');
const src = `${root}/packages/codegen/src`;
const { evaluatePackage } = await import(`${src}/compiler/evaluate-package.ts`);
const { grammarPackage } = await import(`${src}/grammars.ts`);
const { link, collapseRenamedRules } = await import(`${src}/compiler/link.ts`);
const { normalizeGrammar } = await import(`${src}/compiler/normalize.ts`);
const { assemble, AssembleCtx, hydrateSlotRefs } = await import(`${src}/compiler/assemble.ts`);
const { loadGeneratedIdTables } = await import(`${src}/compiler/generated-metadata.ts`);
const { kindCatalogOf, stampVisibleExternals } = await import(`${src}/dsl/symbol-table.ts`);
const { polymorphVisibleName } = await import(`${src}/dsl/arm-names.ts`);
const subFactoriesPath = [`${src}/compiler/model/sub-factories.ts`, `${src}/emitters/overlays/sub-factories.ts`].find(existsSync)!;
const { subFactoriesOf } = await import(subFactoriesPath);
const N = await import(`${src}/compiler/model/node-map.ts`);
const { variantChildrenOf } = await import(`${src}/compiler/variant-structural.ts`);
const camel = (s: string): string => s.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

interface Label { owner: string; variant: string; ref: string; refKind: 'symbol' | 'alias' | 'literal' }
function parseKey(key: string): Label {
	const [owner, variant, ...ref] = key.split('\u0000');
	if (ref.length === 2) return { owner: owner!, variant: variant!, ref: ref[0]!, refKind: 'alias' };
	const r = ref[0]!;
	return { owner: owner!, variant: variant!, ref: r, refKind: /^["\d-]/.test(r) ? 'literal' : 'symbol' };
}

const log = console.log;
console.log = () => {};
console.warn = () => {};
const summary: string[] = [];
for (const g of ['rust', 'typescript', 'python', 'scm', 'regex']) {
	const raw = await evaluatePackage(grammarPackage(g), {});
	const ids = await loadGeneratedIdTables(g);
	const collapsed = collapseRenamedRules(raw, { kindEntries: kindCatalogOf(stampVisibleExternals(ids, raw), raw) });
	const record = collapsed.automaticVariants ?? { keys: new Set<string>(), supertypeOwners: new Set<string>() };
	const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw, undefined)), ids));
	hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline) });
	const { ir } = (await import(`${root}/packages/${g}/src/ir.ts`)) as { ir: Record<string, unknown> };
	const sittir = readFileSync(`${root}/packages/${g}/grammar.sittir.ts`, 'utf8');
	const nodeOf = (name: string) => nodeMap.nodes.get(name) ?? nodeMap.nodes.get(`_${name}`);
	const flatKeyOf = (name: string): string | undefined => {
		const node = nodeOf(name);
		const key = node?.irKey ?? camel(name);
		return key in ir ? key : undefined;
	};
	const authoredSite = (owner: string): string =>
		new RegExp(`(^|[\\s{,'"])${owner}['"]?\\s*:`, 'm').test(sittir) ? 'grammar.sittir.ts (rule has an entry)' : 'upstream rule (needs a patches: entry)';
	const labels = [...record.keys].map(parseKey);
	const g1 = labels.filter((l) => record.supertypeOwners.has(l.owner));
	const g2 = labels.filter((l) => !record.supertypeOwners.has(l.owner));
	const g1Live = g1.filter((l) => nodeOf(l.owner) !== undefined);
	const g1Flat = g1Live.filter((l) => flatKeyOf(l.ref) !== undefined);
	const rows: string[] = [];
	const counts = { live: 0, named: 0, route: 0, valueArm: 0, onlyViaLabel: 0, unnamed: 0, upstream: 0 };
	for (const l of g2) {
		const owner = nodeOf(l.owner);
		if (owner === undefined) continue;
		counts.live++;
		if (l.variant === '') counts.unnamed++;
		const name = camel(l.variant);
		const entry = l.variant === '' ? undefined : subFactoriesOf(owner, nodeMap).entries.find((e: { name: string }) => e.name === name);
		const named = l.refKind !== 'literal' && l.variant !== '' && l.ref === polymorphVisibleName(l.owner, l.variant);
		const flat = l.refKind === 'literal' ? undefined : flatKeyOf(l.ref);
		const via = entry === undefined ? 'no arm route' : entry.arm.via === 'value' ? 'value arm' : 'node arm';
		const only = entry !== undefined && (entry.arm.via === 'value' || flat === undefined);
		const site = authoredSite(l.owner);
		if (named) counts.named++;
		if (entry !== undefined) counts.route++;
		if (entry?.arm.via === 'value') counts.valueArm++;
		if (only) counts.onlyViaLabel++;
		if (site.startsWith('upstream')) counts.upstream++;
		rows.push(`| ${l.owner} | ${l.variant || '(none)'} | ${l.refKind} ${l.ref} | ${named ? 'yes' : 'no'} | ${via} | ${flat ?? '—'} | ${only ? 'yes' : 'no'} | ${site} |`);
	}
	const linked = link(raw, undefined);
	const referrers = new Map<string, Set<string>>();
	const refer = (child: string, parent: string) => { const s = referrers.get(child) ?? new Set<string>(); s.add(parent); referrers.set(child, s); };
	for (const [kind, node] of nodeMap.nodes) {
		if (node instanceof N.AssembledSupertype) for (const sub of node.subtypeNames) refer(sub, kind);
		if (node instanceof N.AbstractAssembledCompound) for (const slot of node.slots) for (const v of slot.values) if (N.isNodeRef(v)) refer(N.storageKindOfRef(v.node), kind);
	}
	const provenance: string[] = [];
	let flatRoutes = 0, provenanceDiffs = 0;
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof N.AssembledSupertype) || node.variantSubtypes === undefined) continue;
		const definedBy = new Map(variantChildrenOf(kind, linked.rules[kind] ?? { type: 'BLANK' }, collapsed.automaticVariants).map((c: { kind: string; definedBy: string }) => [c.kind, c.definedBy]));
		let minted = 0, authored = 0;
		for (const ref of node.variantSubtypes) {
			const child = N.storageKindOfRef(ref.node);
			const refs = referrers.get(child);
			const isMinted = child === polymorphVisibleName(kind, ref.variant) && refs?.size === 1 && refs.has(kind);
			const isAuthored = definedBy.get(child) === 'override';
			flatRoutes++; if (isMinted) minted++; if (isAuthored) authored++;
			if (isMinted !== isAuthored) { provenanceDiffs++; provenance.push(`| ${kind} | ${child} | ${ref.variant} | ${isMinted ? 'yes' : 'no'} | ${definedBy.get(child) ?? '(not listed)'} |`); }
		}
		if (minted > 0 && minted < node.variantSubtypes.length) provenance.push(`| ${kind} (mixed: ${minted} minted, ${authored} authored, of ${node.variantSubtypes.length}) | | | | |`);
	}
	const grammarJson = JSON.parse(readFileSync(`${root}/packages/${g}/.sittir/src/grammar.json`, 'utf8')) as { rules: Record<string, unknown> };
	const bindingsText = ['bindings.scm', 'bindings.seed.scm'].map((f) => `${root}/packages/${g}/${f}`).filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n');
	const namedKinds = [...new Set(g2.filter((l) => l.refKind !== 'literal' && l.variant !== '' && l.ref === polymorphVisibleName(l.owner, l.variant)).map((l) => l.ref))];
	const parserNamed = namedKinds.filter((k) => k in grammarJson.rules);
	const claimed = parserNamed.filter((k) => new RegExp(`[(\s]${k}[\s)]`).test(bindingsText));
	const line = `${g}: labels ${labels.length}; group 1 (supertype members) ${g1.length}, live ${g1Live.length}, member has its own flat key ${g1Flat.length}; group 2 (non-supertype arms) ${g2.length}, live ${counts.live}, unnamed ${counts.unnamed}, names a kind ${counts.named}, has an arm route ${counts.route} (value arms ${counts.valueArm}), buildable only through the label ${counts.onlyViaLabel}, owner is an upstream rule ${counts.upstream}; flattened routes ${flatRoutes}, definedBy ≠ minted ${provenanceDiffs}; automatically named parser kinds ${parserNamed.length}, named by a bindings claim ${claimed.length}${claimed.length > 0 ? ` [${claimed.join(', ')}]` : ''}`;
	log(line);
	summary.push(line);
	if (outDir !== undefined) {
		mkdirSync(outDir, { recursive: true });
		const g1Rows = g1Live.map((l) => `| ${l.owner} | ${l.variant || '(none)'} | ${l.ref} | ${flatKeyOf(l.ref) ?? '—'} |`);
		writeFileSync(
			`${outDir}/${g}.md`,
			[
				`# ${g}`,
				'',
				line,
				'',
				'## Group 2: labels on arms of non-supertype choices',
				'',
				'| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |',
				'| --- | --- | --- | --- | --- | --- | --- | --- |',
				...rows,
				'',
				'## Flattened routes: link provenance (definedBy) vs the minted split',
				'',
				'| parent | child | label | minted | definedBy |',
				'| --- | --- | --- | --- | --- |',
				...provenance,
				'',
				`## Automatically named parser kinds: ${parserNamed.join(', ') || '(none)'}`,
				'',
				`Named by a bindings claim: ${claimed.join(', ') || '(none)'}`,
				'',
				'## Group 1: labels on supertype members',
				'',
				'| supertype | label | member | own flat key |',
				'| --- | --- | --- | --- |',
				...g1Rows,
				''
			].join('\n')
		);
	}
}
if (outDir !== undefined) writeFileSync(`${outDir}/summary.txt`, summary.join('\n') + '\n');
