const fs = require('fs'), path = require('path');
const root = process.argv[2];
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.ts') && !/augment\.ts$|features\/index\.ts$/.test(p)) files.push(p); } };
walk(root);
const split = (s, sep) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if ('<([{'.includes(ch)) depth++; if ('>)]}'.includes(ch)) depth--; if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()).filter((x) => x !== ''); };
const slots = [];
for (const f of files) {
	const text = fs.readFileSync(f, 'utf8');
	let i = 0;
	while ((i = text.indexOf('Slot<', i)) >= 0) {
		const before = text.slice(Math.max(0, i - 200), i);
		const member = /readonly\s+([A-Za-z$_]+)\??\s*:\s*$/.exec(before.replace(/\s+$/, ' ').trimEnd() + ' ') || /readonly\s+([A-Za-z$_]+)\??\s*:[^;]*$/.exec(before);
		let depth = 0, j = i + 4;
		for (; j < text.length; j++) { if (text[j] === '<') depth++; else if (text[j] === '>') { depth--; if (depth === 0) break; } }
		const args = split(text.slice(i + 5, j), ',');
		const list = text.slice(j + 1, j + 3) === '[]';
		if (args.length === 4) {
			const arms = split(args[3], '|').map((a) => a.replace(/<G>/g, '').replace(/^V\./, ''));
			const owner = (() => { const m = [...text.slice(0, i).matchAll(/Under<'([a-z_.]+)'>/g)]; return m.length ? m[m.length - 1][1] : '?'; })();
			slots.push({ file: path.relative(root, f), owner, slot: args[2].replace(/'/g, ''), arms: arms.sort(), list });
		}
		i = j;
	}
}
fs.writeFileSync(process.argv[3], JSON.stringify(slots, null, 1));
const unions = new Map();
for (const s of slots) { if (s.arms.length < 2) continue; const k = s.arms.join(' | '); (unions.get(k) ?? unions.set(k, []).get(k)).push(s); }
console.log('slot declarations', slots.length, 'with a written-out union', slots.filter((s) => s.arms.length > 1).length, 'distinct unions', unions.size);
