// The report's measurement tables, from one run of the measurement
// workflow: one `measure-<platform>/` directory per runner, each holding
// `variants/<variant>/build.json`, `core-share/core-share.json` and
// `measure/measure.json`. Prints Markdown, every table or the named ones.
//
//   node tables.mjs <run dir> [--only sizes,images,build,memory,throughput,shape-b]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({ options: { only: { type: 'string' } }, allowPositionals: true });
const dir = positionals[0];
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

const ROLES = { addon: (f) => f.endsWith('.node'), engine: (f) => f.includes('sittir_engine'), std: (f) => /^(lib)?std-/.test(f) };

/** A packaged grammar's image of one role (sections.mjs bytes), or undefined. */
const image = (build, grammar, role) => Object.entries(build.images[grammar]).find(([file]) => ROLES[role](file))?.[1];

/** A packaged grammar's file bytes by role, and the package's total. */
function files(build, grammar) {
	const [addon, engine, std] = Object.keys(ROLES).map((role) => image(build, grammar, role)?.file ?? 0);
	return { addon, engine, std, total: addon + engine + std };
}

const medians = (p, key) => p.measure.medians[key];
const parts = (b) => (b ? `${mib(b.code)} / ${mib(b.metadata)} / ${mib(b.symbols)} / ${mib(b.rest)}` : '');
const caption = (text) => `**${text}**`;

const SECTIONS = {
	sizes: () => [
		caption('Package sizes, release profile (stripped, MiB)'),
		'',
		
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
	)
	],
	images: () => [
		caption('What the images hold, release profile (MiB: code / Rust crate metadata / symbol tables / rest)'),
		'',
		table(header('image'), [
		...['rust', 'regex'].flatMap((g) => [
			[`\`sittir-${g}.node\`, today`, ...platforms.map((p) => parts(image(p.variants['today-release'], g, 'addon')))],
			[`\`sittir-${g}.node\`, dylib`, ...platforms.map((p) => parts(image(p.variants['dylib-release'], g, 'addon')))]
		]),
		['engine copy', ...platforms.map((p) => parts(image(p.variants['dylib-release'], 'rust', 'engine')))],
		['std copy', ...platforms.map((p) => parts(image(p.variants['dylib-release'], 'rust', 'std')))],
		['sittir-core without napi (shape B)', ...platforms.map((p) => parts(p.core.bytes))]
	])
	],
	build: () => [
		caption('Clean build of the five grammars (seconds, wall / CPU)'),
		'',
		table(
		header('variant'),
		VARIANTS.map((v) => [v, ...platforms.map((p) => {
			const t = p.variants[v].time;
			return `${t.real.toFixed(0)} / ${(t.user + t.sys).toFixed(0)}`;
		})])
	)
	],
	memory: () => [
		caption('Memory after loading and a small workload (median of the rounds, MiB over the process before loading)'),
		'',
		table(header(''), [['memory:1', 'rust alone'], ['memory:5', 'all five']].flatMap(([cell, label]) => VARIANTS.map((v) => [
			`${label}, ${v}`,
			...platforms.map((p) => {
				const m = medians(p, `${cell}:${v}`);
				const footprint = Number.isFinite(m.workedFootprint) ? `, footprint ${signedMib(m.workedFootprint)}` : '';
				return `RSS ${signedMib(m.workedRss)} (loaded ${signedMib(m.loadedRss)}), heap ${signedMib(m.workedHeapUsed)}${footprint}`;
			})
		])))
	],
	throughput: () => [
		caption('Parse + read + render over the corpus (ms per pass: median of the rounds, change from today, spread across rounds; parse / read / render)'),
		'',
		table(header(''), ['rust', 'python'].flatMap((grammar) => VARIANTS.map((v) => [
			`${grammar}, ${v}`,
			...platforms.map((p) => {
				const key = `throughput:${grammar}`;
				const t = medians(p, `${key}:${v}`);
				const base = medians(p, `${key}:${v.replace('dylib', 'today')}`);
				const delta = v.startsWith('dylib') ? ` (${pct(t.medianMs, base.medianMs)})` : '';
				const rounds = p.measure.runs.filter((r) => r.cell === key && r.variant === v && r.result.exit === undefined).map((r) => r.result.medianMs);
				const spread = `${((Math.max(...rounds) / Math.min(...rounds) - 1) * 100).toFixed(0)}%`;
				return `${t.medianMs.toFixed(2)}${delta}, spread ${spread}; ${t.parseMs.toFixed(2)} / ${t.readMs.toFixed(2)} / ${t.renderMs.toFixed(2)}`;
			})
		]))),
		'',
		`Sources timed per pass: ${platforms.map((p) => `${p.name}: rust ${medians(p, 'throughput:rust:today-release').sources}, python ${medians(p, 'throughput:python:today-release').sources}`).join('; ')}. Failed runs: ${platforms.map((p) => `${p.name} ${p.measure.failures.length}`).join(', ')}.`
	],
	'shape-b': () => {
		const perExtra = (p, v) => (medians(p, `memory:5:${v}`).workedRss - medians(p, `memory:1:${v}`).workedRss) / 4;
		return [
			caption('sittir-core without napi, as a dylib (stripped), against the RSS each extra grammar costs'),
			'',
			table(header(''), [
				['file', ...platforms.map((p) => `${mib(p.core.bytes.file)} MiB`)],
				['of which code', ...platforms.map((p) => `${mib(p.core.bytes.code)} MiB`)],
				['of which Rust crate metadata', ...platforms.map((p) => `${mib(p.core.bytes.metadata)} MiB`)],
				['RSS per extra grammar, today (all five minus rust alone, over four)', ...platforms.map((p) => `${mib(perExtra(p, 'today-release'))} MiB`)],
				['RSS per extra grammar, shape A', ...platforms.map((p) => `${mib(perExtra(p, 'dylib-release'))} MiB`)]
			])
		];
	}
};

const names = values.only?.split(',') ?? Object.keys(SECTIONS);
console.log(names.map((name) => SECTIONS[name]().join('\n')).join('\n\n'));
