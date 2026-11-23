const slots = require(process.argv[2]);
const owners = require(process.argv[3]);
const isAny = (a) => /^[A-Z][a-zA-Z]*\.Any$/.test(a);
const pathOf = (arm) => arm.replace(/\.Any$/, '').split('.').map((s) => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()).join('.');
const ownerOf = (arm) => (arm === 'string' ? 'text' : owners[pathOf(arm)] ?? (isAny(arm) ? 'level' : '?'));
const has = (s, a) => s.arms.includes(a);
const kindSetOf = (s) => {
	const ns = s.owner.split('.')[0];
	if (has(s, 'Statement.Any') && (has(s, 'Declaration.Any') || /statements|members/.test(s.slot))) return ['Statement', ['Statement.Any', 'Declaration.Any', 'Expression.Any', 'Identifier.Any', 'Literal.Any']];
	if (has(s, 'Type.Any') && !has(s, 'Expression.Any')) return ['Type', ['Type.Any', 'Identifier.Any']];
	if (has(s, 'Pattern.Any') && ns === 'pattern') return ['Pattern', ['Pattern.Any', 'Identifier.Any', 'Expression.Any', 'Literal.Any']];
	if (has(s, 'Expression.Any')) return ['Expression', ['Expression.Any', 'Identifier.Any', 'Literal.Any']];
	if (has(s, 'Pattern.Any')) return ['Pattern', ['Pattern.Any', 'Identifier.Any']];
	if (has(s, 'Identifier.Any')) return ['Identifier', ['Identifier.Any']];
	const levels = new Set(s.arms.filter((a) => a !== 'string').map((a) => a.split('.').slice(0, 2).join('.')));
	if (levels.size === 1) return [`${[...levels][0]} (level)`, s.arms.filter((a) => a.split('.').length <= 3)];
	return ['exception', []];
};
const out = new Map();
for (const s of slots.filter((x) => x.arms.length > 1)) {
	const [set, base] = kindSetOf(s);
	const extras = s.arms.filter((a) => !base.includes(a));
	const g = out.get(set) ?? out.set(set, { slots: 0, unions: new Set(), extras: new Map(), exceptions: [] }).get(set);
	g.slots++; g.unions.add(s.arms.join('|'));
	for (const e of extras) { const k = `${e} (${ownerOf(e)})`; g.extras.set(k, (g.extras.get(k) ?? 0) + 1); }
	if (set === 'exception') g.exceptions.push(`${s.owner}.${s.slot}: ${s.arms.join(' | ')}`);
}
for (const [set, g] of [...out].sort((a, b) => b[1].slots - a[1].slots)) {
	console.log(`## ${set}: ${g.slots} slots, ${g.unions.size} unions`);
	for (const [e, n] of [...g.extras].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  + ${e}`);
	for (const x of g.exceptions) console.log(`   ! ${x}`);
}
