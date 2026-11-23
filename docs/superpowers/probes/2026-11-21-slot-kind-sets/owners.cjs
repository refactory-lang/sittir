const fs = require('fs'), path = require('path');
const root = process.argv[2];
const owners = {};
const walk = (d) => {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (p.endsWith('.ts') && !/augment\.ts$|features\/index\.ts$/.test(p)) {
			const t = fs.readFileSync(p, 'utf8');
			const decls = [...t.matchAll(/interface [A-Za-z]+<G extends GrammarMap, K extends Under<'([a-z_.]+)'>\s*=\s*'\1'>/g)];
			decls.forEach((m, n) => {
				const body = t.slice(m.index, n + 1 < decls.length ? decls[n + 1].index : t.length);
				if (!/readonly \$path: K;/.test(body)) return;
				const rel = path.relative(root, path.dirname(p));
				owners[m[1]] = rel === '' ? 'base' : rel.replace(/^features\//, '');
			});
		}
	}
};
walk(root);
fs.writeFileSync(process.argv[3], JSON.stringify(owners, null, 1));
for (const k of process.argv.slice(4)) console.log(k.padEnd(32), owners[k] ?? '?');
