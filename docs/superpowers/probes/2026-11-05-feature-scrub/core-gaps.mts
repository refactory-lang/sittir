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
const groups: Record<string, string[]> = {};
const vocab = source.kinds;
for (const [path, k] of p.kinds) {
	if (k.feature !== undefined) continue;
	const h = gs.filter((g) => [...per[g]!.claimed].some((c) => under(c, path))).map((g) => L[g]).join('') || '-';
	(groups[h] ??= []).push(`K ${path}`);
}
for (const d of vocab) {
	for (const m of d.members) {
		if (m.name === '$kind') continue;
		const h = gs.filter((g) => [...per[g]!.claimed].some((c) => under(c, d.path)) && per[g]!.routed(d.path, m.name)).map((g) => L[g]).join('') || '-';
		const kh = gs.filter((g) => [...per[g]!.claimed].some((c) => under(c, d.path))).map((g) => L[g]).join('');
		if (h !== kh) (groups[`M:${h}/kind:${kh}`] ??= []).push(`M ${d.path}.${m.name}`);
	}
}
console.log('@@' + JSON.stringify(groups));
