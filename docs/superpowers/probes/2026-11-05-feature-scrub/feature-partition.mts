const WT = '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-role-arms';
const { readVocabularySource, VOCABULARY_DIR, derive, bindingGrammars } = await import(`${WT}/packages/codegen/src/bindings/index.ts`);
const { plan, closure, under } = await import(`${WT}/packages/tools/src/vocabulary/plan.ts`);
const { loadInputs } = await import(`${WT}/packages/tools/src/inventory/index.ts`);
const source = await readVocabularySource(VOCABULARY_DIR);
const p = plan(source);
const COMPOSITION: Record<string, string> = { python: 'PythonFeatures', rust: 'RustFeatures', typescript: 'TypeScriptFeatures' };
const L: Record<string, string> = { python: 'p', rust: 'r', typescript: 't' };
const expand = (n: string): string[] => (source.compositions.has(n) ? source.compositions.get(n)!.flatMap(expand) : [n]);
const per: Record<string, { has: Set<string>; claimed: Set<string>; routed: (path: string, m: string) => boolean }> = {};
for (const input of await loadInputs(bindingGrammars())) {
	const g = input.grammar;
	const d = derive([input]);
	const has = new Set<string>();
	for (const f of expand(COMPOSITION[g]!)) for (const c of closure(f, p.features)) has.add(c);
	const claimed = new Set<string>([...d.allvocab, ...d.contentDerived.keys(), ...d.refinements.keys()]);
	per[g] = { has, claimed, routed: (path, m) => [...d.members].some(([v, ms]) => under(v, path) && ms.has(m)) || [...d.holes].some(([v, hs]) => under(v, path) && hs.has(m)) };
}
const gs = Object.keys(per);
const out: Record<string, unknown> = {};
for (const [name, f] of p.features) {
	const composers = gs.filter((g) => per[g]!.has.has(name));
	const items: [string, string][] = [];
	for (const [path, k] of p.kinds) if (k.feature?.name === name) items.push([`K ${path}`, composers.filter((g) => [...per[g]!.claimed].some((c) => under(c, path))).map((g) => L[g]).join('')]);
	for (const [path, owned] of p.owned) for (const [m, o] of owned) if (o.feature.name === name) items.push([`M ${path}.${m}`, composers.filter((g) => [...per[g]!.claimed].some((c) => under(c, path)) && per[g]!.routed(path, m)).map((g) => L[g]).join('')]);
	const groups: Record<string, string[]> = {};
	for (const [item, holders] of items) (groups[holders || '-'] ??= []).push(item);
	out[name] = { dir: f.dir.replace(/.*features\//, ''), parents: f.parents, composers: composers.map((g) => L[g]).join(''), groups };
}
console.log('@@' + JSON.stringify(out));
