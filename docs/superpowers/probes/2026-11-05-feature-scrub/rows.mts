const WT = '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-role-arms';
const { readVocabularySource, VOCABULARY_DIR, derive, bindingGrammars } = await import(`${WT}/packages/codegen/src/bindings/index.ts`);
const { plan, under } = await import(`${WT}/packages/tools/src/vocabulary/plan.ts`);
const { loadInputs } = await import(`${WT}/packages/tools/src/inventory/index.ts`);
const source = await readVocabularySource(VOCABULARY_DIR);
const p = plan(source);
const L: Record<string, string> = { python: 'p', rust: 'r', typescript: 't' };
const per: Record<string, { claimed: Set<string>; routed: (path: string, m: string) => boolean }> = {};
for (const input of await loadInputs(bindingGrammars())) {
	const d = derive([input]);
	const claimed = new Set<string>([...d.allvocab, ...d.contentDerived.keys(), ...d.refinements.keys()]);
	per[input.grammar] = { claimed, routed: (path, m) => [...d.members].some(([v, ms]) => under(v, path) && ms.has(m)) || [...d.holes].some(([v, hs]) => under(v, path) && hs.has(m)) };
}
const gs = Object.keys(per);
const holdsK = (g: string, path: string) => [...per[g]!.claimed].some((c) => under(c, path));
const rows: unknown[] = [];
for (const [path, k] of p.kinds) rows.push({ t: 'K', path, feature: k.feature?.name ?? null, held: gs.filter((g) => holdsK(g, path)).map((g) => L[g]).join('') });
for (const [path, owned] of p.owned) for (const [m, o] of owned) rows.push({ t: 'M', path, member: m, feature: o.feature.name, held: gs.filter((g) => holdsK(g, path) && per[g]!.routed(path, m)).map((g) => L[g]).join('') });
for (const d of source.kinds) for (const m of d.members) {
	if (m.name === '$kind' || /^(operator|\$value)$/.test(m.name)) continue;
	const kh = gs.filter((g) => holdsK(g, d.path)).map((g) => L[g]).join('');
	const h = gs.filter((g) => holdsK(g, d.path) && per[g]!.routed(d.path, m.name)).map((g) => L[g]).join('');
	if (h !== kh && h !== '') rows.push({ t: 'M', path: d.path, member: m.name, feature: null, held: h });
}
console.log('@@' + JSON.stringify(rows));
