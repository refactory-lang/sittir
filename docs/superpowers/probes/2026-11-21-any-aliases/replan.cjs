const fs = require('fs');
const path = require('path');
const [root, slotsFile, outFile] = process.argv.slice(2);
const slots = require(slotsFile);
const LANGS = ['rust', 'typescript', 'python'];
const beneath = (p, ns) => p === ns || p.startsWith(`${ns}.`);

const ALIASES = {
	expression: {
		all: ['identifier', 'literal'],
		rust: ['statement.block', 'statement.break', 'statement.continue', 'statement.if', 'statement.loop', 'statement.match', 'statement.return'],
		python: ['pattern.rest']
	},
	pattern: { all: ['identifier', 'literal', 'expression.member', 'expression.subscript'], rust: ['expression.block.const', 'expression.call.macro'], typescript: ['expression.cast.non_null'] },
	type: { all: ['identifier'], rust: ['expression.call.macro', 'clause.bounds.removed'], python: ['@expression'] },
	statement: { all: ['declaration', '@expression'], rust: ['attribute'] },
	'declaration.parameter': { all: [], python: ['identifier', 'pattern.rest', 'pattern.tuple', 'pattern.list'] },
	'declaration.member': { all: [], rust: ['declaration.constant', 'declaration.type.type_alias', 'expression.call.macro', 'attribute'], python: ['declaration.constant', 'declaration.type'] }
};
const covered = (lang, ns, read) => {
	if (beneath(read, ns)) return true;
	const a = ALIASES[ns];
	for (const x of [...a.all, ...(a[lang] ?? [])]) {
		if (x.startsWith('@')) {
			if (covered(lang, x.slice(1), read)) return true;
		} else if (beneath(read, x)) return true;
	}
	return false;
};

function overrides(lang) {
	const lines = fs.readFileSync(path.join(root, 'packages', lang, 'src/portable/map.ts'), 'utf8').split('\n');
	const out = new Map();
	let p;
	let m;
	const start = lines.indexOf('\treadonly overrides: {');
	const end = lines.indexOf('\t};', start);
	for (const line of lines.slice(start + 1, end)) {
		let x;
		if ((x = /^\t\treadonly '?([a-z_.]+)'?: \{$/.exec(line))) {
			p = x[1];
			m = undefined;
			out.set(p, new Map());
			continue;
		}
		if ((x = /^\t\t\treadonly '?(\$?[A-Za-z_]+)'?\??:/.exec(line))) {
			m = x[1];
			out.get(p)?.set(m, new Set());
		}
		if (!p || !m || m.startsWith('$')) continue;
		const set = out.get(p)?.get(m);
		if (set === undefined) continue;
		for (const r of line.matchAll(/V\.Read<\w+, '([^']+)'>/g)) set.add(r[1]);
	}
	return out;
}
const declaring = (p, member) => {
	let best;
	for (const s of slots) if (s.slot === member && (p === s.owner || p.startsWith(`${s.owner}.`)) && (best === undefined || s.owner.length > best.owner.length)) best = s;
	return best;
};

const bySlot = new Map();
for (const lang of LANGS)
	for (const [p, members] of overrides(lang))
		for (const [member, reads] of members) {
			const d = declaring(p, member);
			if (d === undefined || reads.size === 0) continue;
			const key = `${d.owner}.${d.slot}`;
			const e = bySlot.get(key) ?? bySlot.set(key, { d, reads: {} }).get(key);
			for (const r of reads) (e.reads[lang] ??= new Set()).add(r);
		}

const rows = [];
for (const [key, { d, reads }] of bySlot) {
	const all = Object.entries(reads);
	const score = (ns) => {
		const extra = {};
		let n = 0;
		let held = 0;
		for (const [lang, set] of all) {
			const x = [...set].filter((r) => !covered(lang, ns, r));
			held += set.size - x.length;
			if (x.length) {
				extra[lang] = x;
				n += x.length;
			}
		}
		return { ns, n, held, extra };
	};
	const ORDER = ['declaration.parameter', 'declaration.member', 'pattern', 'type', 'expression', 'statement'];
	const scored = ORDER.map(score).filter((s) => s.held > 0);
	const best = scored.find((s) => s.n === 0) ?? [...scored].sort((a, b) => a.n - b.n || ORDER.indexOf(a.ns) - ORDER.indexOf(b.ns))[0];
	if (best === undefined) continue;
	rows.push({ key, file: d.file, declared: d.arms.join('|'), ns: best.ns, extra: best.extra, namesStatementAny: d.arms.includes('Statement.Any') });
}
fs.writeFileSync(outFile, JSON.stringify(rows, null, 1));
const clean = rows.filter((r) => Object.keys(r.extra).length === 0);
const dirty = rows.filter((r) => Object.keys(r.extra).length > 0);
const byNs = {};
for (const r of clean) byNs[r.ns] = (byNs[r.ns] ?? 0) + 1;
console.log(`slots read by some map: ${rows.length}; one namespace Any: ${clean.length} ${JSON.stringify(byNs)}; more than one: ${dirty.length}`);
const short = (p) => p.replace(/\.(private|protected|public(\.(internal|parent|restricted))?)$/, '');
for (const r of dirty.sort((a, b) => a.key.localeCompare(b.key)))
	console.log(`${r.key} → ${r.ns} + ${Object.entries(r.extra).map(([l, x]) => `${l}: ${[...new Set(x.map(short))].sort().join(' ')}`).join(' ; ')}`);
