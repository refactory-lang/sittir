// The report's measurement tables, from the measurement workflow's
// artifacts: one `measure-<platform>/` directory per runner, each holding
// `variants/<variant>/build.json`, `core-share/core-share.json` and
// `measure/measure.json`. Prints Markdown.
//
//   node tables.mjs <evidence dir>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const read = (...path) => JSON.parse(readFileSync(join(dir, ...path), 'utf8'));
const platforms = readdirSync(dir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && entry.name.startsWith('measure-'))
	.map((entry) => {
		const root = entry.name;
		const variants = Object.fromEntries(
			readdirSync(join(dir, root, 'variants'), { withFileTypes: true })
				.filter((v) => v.isDirectory())
				.map((v) => [v.name, read(root, 'variants', v.name, 'build.json')])
		);
		return { name: root.slice('measure-'.length), variants, core: read(root, 'core-share', 'core-share.json'), measure: read(root, 'measure', 'measure.json') };
	});

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'];
const VARIANTS = ['today-release', 'dylib-release', 'today-gate', 'dylib-gate'];
const mib = (bytes) => (bytes / (1 << 20)).toFixed(2);
const signedMib = (bytes) => `${bytes >= 0 ? '+' : '−'}${mib(Math.abs(bytes))}`;
const pct = (now, was) => `${now >= was ? '+' : '−'}${((Math.abs(now - was) / was) * 100).toFixed(1)}%`;
const row = (cells) => `| ${cells.join(' | ')} |`;
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const header = (first) => [first, ...platforms.map((p) => p.name)];

/** A packaged grammar's files by role: the addon, the engine copy, the std copy. */
function files(build, grammar) {
	const sizes = build.sizes[grammar];
	const by = (test) => Object.entries(sizes).filter(([file]) => test(file)).reduce((sum, [, bytes]) => sum + bytes, 0);
	const addon = by((f) => f.endsWith('.node'));
	const engine = by((f) => f.includes('sittir_engine'));
	const std = by((f) => /^(lib)?std-/.test(f));
	return { addon, engine, std, total: addon + engine + std };
}

const out = [];
out.push('#### Package sizes, release profile (stripped, MiB)', '');
out.push(
	table(
		['', ...platforms.flatMap((p) => [`${p.name} today`, `${p.name} dylib`])],
		[
			...GRAMMARS.map((g) => [`\`sittir-${g}.node\``, ...platforms.flatMap((p) => [mib(files(p.variants['today-release'], g).addon), mib(files(p.variants['dylib-release'], g).addon)])]),
			['engine copy', ...platforms.flatMap((p) => ['', mib(files(p.variants['dylib-release'], 'rust').engine)])],
			['std copy', ...platforms.flatMap((p) => ['', mib(files(p.variants['dylib-release'], 'rust').std)])],
			['one package (rust)', ...platforms.flatMap((p) => [mib(files(p.variants['today-release'], 'rust').total), mib(files(p.variants['dylib-release'], 'rust').total)])],
			['one package (regex)', ...platforms.flatMap((p) => [mib(files(p.variants['today-release'], 'regex').total), mib(files(p.variants['dylib-release'], 'regex').total)])],
			[
				'all five packages',
				...platforms.flatMap((p) => [
					mib(GRAMMARS.reduce((sum, g) => sum + files(p.variants['today-release'], g).total, 0)),
					mib(GRAMMARS.reduce((sum, g) => sum + files(p.variants['dylib-release'], g).total, 0))
				])
			]
		]
	),
	''
);

out.push('#### Clean build of the five grammars (seconds, wall / CPU)', '');
out.push(
	table(
		header('variant'),
		VARIANTS.map((v) => [v, ...platforms.map((p) => {
			const t = p.variants[v].time;
			return `${t.real.toFixed(0)} / ${(t.user + t.sys).toFixed(0)}`;
		})])
	),
	''
);

const medians = (p, key) => p.measure.medians[key];
out.push('#### Memory after loading and a small workload (median of the rounds, MiB over the process before loading)', '');
const memoryRows = [];
for (const [cell, label] of [['memory:1', 'rust alone'], ['memory:5', 'all five']]) {
	for (const v of VARIANTS) {
		memoryRows.push([
			`${label}, ${v}`,
			...platforms.map((p) => {
				const m = medians(p, `${cell}:${v}`);
				const footprint = Number.isFinite(m.workedFootprint) ? `, footprint ${signedMib(m.workedFootprint)}` : '';
				return `RSS ${signedMib(m.workedRss)} (loaded ${signedMib(m.loadedRss)}), heap ${signedMib(m.workedHeapUsed)}${footprint}`;
			})
		]);
	}
}
out.push(table(header(''), memoryRows), '');

out.push('#### Parse + read + render over the corpus (median pass, ms; parse / read / render)', '');
const throughputRows = [];
for (const grammar of ['rust', 'python']) {
	for (const v of VARIANTS) {
		throughputRows.push([
			`${grammar}, ${v}`,
			...platforms.map((p) => {
				const t = medians(p, `throughput:${grammar}:${v}`);
				const base = medians(p, `throughput:${grammar}:${v.replace('dylib', 'today')}`);
				const delta = v.startsWith('dylib') ? ` (${pct(t.medianMs, base.medianMs)})` : '';
				return `${t.medianMs.toFixed(2)}${delta}; ${t.parseMs.toFixed(2)} / ${t.readMs.toFixed(2)} / ${t.renderMs.toFixed(2)}`;
			})
		]);
	}
}
out.push(table(header(''), throughputRows), '');
const sources = platforms.map((p) => `${p.name}: rust ${medians(p, 'throughput:rust:today-release').sources}, python ${medians(p, 'throughput:python:today-release').sources}`);
out.push(`Sources timed per pass: ${sources.join('; ')}. Failed runs: ${platforms.map((p) => `${p.name} ${p.measure.failures.length}`).join(', ')}.`, '');

out.push('#### Shape B: sittir-core without napi, as a dylib (stripped)', '');
out.push(
	table(header(''), [
		['file', ...platforms.map((p) => `${mib(p.core.fileBytes)} MiB`)],
		['code (text section)', ...platforms.map((p) => `${mib(p.core.textBytes)} MiB`)],
		[
			'measured RSS per extra grammar under A (all five minus rust alone, over four)',
			...platforms.map((p) => `${mib((medians(p, 'memory:5:dylib-release').workedRss - medians(p, 'memory:1:dylib-release').workedRss) / 4)} MiB`)
		]
	]),
	''
);

console.log(out.join('\n'));
