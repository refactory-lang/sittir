const fs = require('fs');
const path = require('path');
const [root, outFile] = process.argv.slice(2);
const RULES = {
	rust: { expression: '_expression', type: '_type', pattern: '_pattern', statement: '_statement' },
	typescript: { expression: 'expression', type: 'type', pattern: 'pattern', statement: 'statement' },
	python: { expression: 'expression', pattern: 'pattern', statement: '_statement' }
};
const pascal = (name) => name.replace(/^_+/, '').split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

function portableIds(lang) {
	const text = fs.readFileSync(path.join(root, 'packages', lang, 'src/portable/index.ts'), 'utf8');
	const block = text.slice(text.indexOf('export interface PortableIds {'), text.indexOf('\n}\n', text.indexOf('export interface PortableIds {')));
	const byPath = new Map();
	for (const m of block.matchAll(/^\t'?([a-z_.]+)'?:([^;]*);/gm)) byPath.set(m[1], [...m[2].matchAll(/TSKindId\.(\w+)/g)].map((x) => x[1]));
	const byKind = new Map();
	for (const [p, kinds] of byPath) for (const k of kinds) (byKind.get(k) ?? byKind.set(k, new Set()).get(k)).add(p);
	const leaves = new Map();
	for (const [k, ps] of byKind) leaves.set(k, [...ps].filter((p) => ![...ps].some((q) => q !== p && q.startsWith(`${p}.`))));
	return leaves;
}

const out = {};
for (const [lang, rules] of Object.entries(RULES)) {
	const dir = path.join(root, 'packages', lang, '.sittir');
	const types = JSON.parse(fs.readFileSync(path.join(dir, 'src/node-types.json'), 'utf8'));
	const model = JSON.parse(fs.readFileSync(path.join(dir, 'node-model-portable.json5'), 'utf8'));
	const reads = portableIds(lang);
	const byType = new Map(types.map((t) => [t.type, t]));
	const supers = new Map(types.filter((t) => t.subtypes).map((t) => [t.type, t.subtypes.filter((s) => s.named).map((s) => s.type)]));
	const expand = (kind, via, seen) => {
		if (seen.has(kind)) return [];
		seen.add(kind);
		const subs = supers.get(kind);
		if (subs !== undefined) return subs.flatMap((s) => expand(s, [...via, kind], seen));
		const claimed = reads.get(pascal(kind));
		if (claimed !== undefined) return claimed.map((read) => ({ kind, read, via }));
		const container = model.kinds[kind]?.container;
		if (container !== undefined && (!container.list || /_elements$/.test(kind))) return container.kinds.flatMap((c) => expand(c, [...via, `${kind}{}`], seen));
		const node = byType.get(kind);
		const children = node?.children?.types?.filter((t) => t.named).map((t) => t.type) ?? [];
		const fieldTypes = Object.values(node?.fields ?? {}).flatMap((x) => x.types.filter((y) => y.named).map((y) => y.type));
		if (children.length > 0 && fieldTypes.length === 0) return children.flatMap((c) => expand(c, [...via, `${kind}()`], seen));
		if (fieldTypes.length > 0 && fieldTypes.every((y) => /_elements$/.test(y))) return fieldTypes.flatMap((c) => expand(c, [...via, `${kind}[]`], seen));
		return [{ kind, read: '(unclaimed)', via }];
	};
	out[lang] = {};
	for (const [ns, rule] of Object.entries(rules)) {
		const rows = (supers.get(rule) ?? []).flatMap((s) => expand(s, [], new Set([rule])));
		const native = rows.filter((r) => r.read === ns || r.read.startsWith(`${ns}.`));
		const foreign = rows.filter((r) => !native.includes(r));
		out[lang][ns] = { rule, native: [...new Set(native.map((r) => r.read))].sort(), foreign };
	}
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
const short = (p) => p.replace(/\.(private|protected|public(\.(internal|parent|restricted))?)$/, "");
for (const [lang, byNs] of Object.entries(out))
	for (const [ns, r] of Object.entries(byNs)) {
		const by = {};
		for (const f of r.foreign) (by[f.read.split(".")[0]] ??= new Set()).add(f.read === "(unclaimed)" ? `(unclaimed ${f.kind})` : short(f.read));
		console.log(`${lang} ${ns} (${r.rule}): ${r.native.length} paths beneath ${ns}; from elsewhere:`);
		for (const [root, set] of Object.entries(by)) console.log(`  ${root} [${set.size}]: ${[...set].sort().join(" ")}`);
	}
