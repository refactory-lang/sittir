const WT = '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-role-arms';
const { readVocabularySource, VOCABULARY_DIR, derive } = await import(`${WT}/packages/codegen/src/bindings/index.ts`);
const { plan, under } = await import(`${WT}/packages/tools/src/vocabulary/plan.ts`);
const { loadInputs } = await import(`${WT}/packages/tools/src/inventory/index.ts`);
const grammars = process.argv.slice(2);
const source = await readVocabularySource(VOCABULARY_DIR);
const p = plan(source);
const out: Record<string, { kinds: string[]; members: string[]; unmapped: number; claims: number }> = {};
for (const input of await loadInputs(grammars)) {
	const d = derive([input]);
	const claimed = new Set<string>([...d.allvocab, ...d.contentDerived.keys(), ...d.refinements.keys()]);
	const kinds = [...p.kinds.keys()].filter((path) => [...claimed].some((c) => under(c, path)));
	const members: string[] = [];
	for (const [v, ms] of d.members) for (const m of ms.keys()) members.push(`${v}.${m}`);
	for (const [v, hs] of d.holes) for (const m of hs.keys()) members.push(`${v}.${m}`);
	const unknown = [...d.allvocab].filter((v) => !p.kinds.has(v));
	out[input.grammar] = { kinds, members, unmapped: [...d.unmapped.values()].reduce((a, b) => a + b, 0), claims: d.allvocab.size };
	console.error(input.grammar, 'claims', d.allvocab.size, 'kinds held', kinds.length, 'members', members.length, 'not vocabulary paths', unknown.join(' '));
}
console.log('@@' + JSON.stringify(out));
