import { readFileSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
const dir = process.argv[2] ? process.argv[2].replace(/\/?$/, '/') : here;
const tallies = readFileSync(dir + 'out.jsonl', 'utf8').trim().split('\n').map((line) => JSON.parse(line));

const grammars = {};
function grammarOf(name) {
	if (grammars[name]) return grammars[name];
	const model = JSON.parse(readFileSync(`${dir}models/${name}.json5`, 'utf8'));
	const bodies = JSON.parse(readFileSync(`${dir}models/${name}.render-bodies.json`, 'utf8'));
	const byKind = {};
	const byText = {};
	for (const entry of model.nodes) {
		byKind[entry.kind] ??= entry;
		for (const shown of entry.shownAs ?? []) byKind[shown] ??= entry;
		if (entry.unit && entry.text !== undefined) byText[entry.text] ??= entry;
	}
	for (const entry of Object.values(byKind)) {
		let target = entry;
		for (let hops = 0; target?.modelType === 'alias' && hops < 8; hops++) target = byKind[target.slots?.[0]?.values?.[0]?.parseKind];
		entry.resolved = target ?? entry;
	}
	const external = new Set(JSON.parse(readFileSync(`${dir}models/${name}.externals.json`, 'utf8')));
	const modelKindOf = (kind) => byKind[kind]?.kind ?? kind;
	const booleanValues = {};
	for (const entry of model.nodes) for (const slot of entry.slots ?? []) if (slot.storage === 'boolean') for (const value of slot.values ?? []) {
		(booleanValues[entry.kind] ??= new Set()).add(value.value ?? value.parseKind);
		if (value.parseKind) booleanValues[entry.kind].add(value.parseKind);
	}
	const forms = {};
	for (const [parent, variants] of Object.entries(model.polymorphVariants ?? {})) forms[parent] = Object.keys(variants.childKind ?? {});
	for (const entry of model.nodes) if (entry.variantOf) (forms[entry.variantOf] ??= []).push(entry.kind);
	const textParts = {};
	const partsOf = (kind, seen = new Set()) => {
		if (textParts[kind]) return textParts[kind];
		const texts = new Set();
		const walk = (parts) => {
			for (const part of parts ?? []) {
				if (part.kind === 'text' || part.kind === 'tokenSeam') texts.add(part.text);
				if (part.kind === 'indent' || part.kind === 'dedent') texts.add(`part:${part.kind}`);
				for (const arm of part.arms ?? []) walk(arm.body);
				if (part.body) walk(part.body);
			}
		};
		walk(bodies[kind] ?? bodies[byKind[kind]?.kind]);
		seen.add(kind);
		for (const form of [...(forms[kind] ?? []), ...(forms[byKind[kind]?.kind] ?? [])]) if (!seen.has(form)) for (const text of partsOf(form, seen)) texts.add(text);
		return (textParts[kind] = texts);
	};
	const separatorChoice = new Set(model.nodes.filter((entry) => (entry.separatorCandidates ?? []).length > 1).map((entry) => entry.kind));
	return (grammars[name] = { byKind, byText, external, partsOf, bodies, modelKindOf, booleanValues, separatorChoice });
}

function entryOf(g, kind, display, named) {
	const found = g.byKind[kind] ?? g.byKind[display] ?? (named ? undefined : g.byText[display]);
	return found?.resolved ?? found;
}

function slotClass(g, kind, display, named, shape) {
	if (shape === 'has-inner') return 'node with no record';
	const entry = entryOf(g, kind, display, named);
	if (entry?.unit && (g.external.has(entry.kind) || g.external.has(kind) || g.external.has(display))) return 'unit the external scanner issues';
	if (!entry) return named ? `named, not in the model (${kind})` : 'anonymous literal, no unit entry';
	if (entry.modelType === 'pattern' || entry.modelType === 'lexedPattern') return 'variable-text leaf';
	if (entry.modelType === 'keyword') return 'keyword unit';
	if (entry.modelType === 'punctuation' || entry.modelType === 'enum') return 'punctuation or enum unit';
	return `other model type (${entry.modelType})`;
}

function textOf(g, kind, display, named) {
	if (!named) return display;
	const entry = entryOf(g, kind, display, named);
	return entry?.unit ? entry.text : undefined;
}

const report = [];
for (const t of tallies) {
	const g = grammarOf(t.grammar);
	const roles = {};
	const unexplained = {};
	const add = (key, n, words) => {
		roles[key] ??= { n: 0, words: 0 };
		roles[key].n += n;
		roles[key].words += words;
	};
	for (const [key, { n, words }] of Object.entries(t.rows)) {
		const [role, parent, place, kind, display, namedFlag, shape, width] = key.split('\t');
		const named = namedFlag === 'named';
		const suffix = width === 'wide' ? '' : ` (${width})`;
		if (role === 'slot') add(`slot content: ${slotClass(g, kind, display, named, shape)}${suffix}`, n, words);
		else if (role === 'trivia' || place === 'under-trivia-row') add('trivia', n, words);
		else if (place === 'under-slot-row') add('slot content: a token inside a slot-held node that has no record', n, words);
		else if (place === 'between-list-items' || place === 'after-last-list-item-as-a-separator') add(`template token: list separator${g.separatorChoice.has(g.modelKindOf(parent)) ? ', the list kind lists several separator candidates' : ''}${place === 'after-last-list-item-as-a-separator' ? ', trailing' : ''}${suffix}`, n, words);
		else if (g.booleanValues[g.modelKindOf(parent)]?.has(named ? kind : display) || g.booleanValues[g.modelKindOf(parent)]?.has(display)) add('slot content: the token of a boolean slot', n, words);
		else {
			const text = textOf(g, kind, display, named);
			const parts = g.partsOf(parent);
			if ((text !== undefined && parts.has(text)) || parts.has(`part:${display}`)) add(`template token${suffix}${place === 'under-unnamed-row' ? ', under a row with no record' : ''}`, n, words);
			else if (text !== undefined && [...parts].some((part) => part.includes(text))) add(`template token, inside a longer text part${suffix}`, n, words);
			else {
				add('unexplained', n, words);
				const example = `${parent} > ${kind}${display !== kind ? ` (shown as ${display})` : ''}, ${namedFlag}, ${shape}, ${width}, ${place}${g.bodies[parent] ? '' : ', no render body'}`;
				unexplained[example] = (unexplained[example] ?? 0) + n;
			}
		}
	}
	const NODE = 1, UNIT = 2, TEXT = 4;
	let cellWordsToday = 0, cellWordsOneWord = 0;
	for (const [key, { n, words }] of Object.entries(t.cell_shapes)) {
		const forms = Number(key.replace(/^item /, '').split('/')[0]);
		cellWordsToday += words;
		cellWordsOneWord += n * (forms & TEXT ? 2 : 1);
	}
	const total = t.chunk_words;
	const template = Object.entries(roles).filter(([k]) => k.startsWith('template token')).reduce((a, [, v]) => a + v.words, 0);
	const options = {
		today: 0,
		'template-token rows removed': -template,
		'one-word parsed cell': cellWordsOneWord - cellWordsToday,
		'both': cellWordsOneWord - cellWordsToday - template,
	};
	report.push({
		corpus: t.corpus,
		grammar: t.grammar,
		sources: t.sources,
		sourceBytes: t.source_bytes,
		parseErrors: t.parse_errors,
		readWords: total,
		attributedLessTotal: t.records.words + t.side_records.words + t.list_runs.words + t.token_runs.words - total,
		recordGapWords: t.record_gap_words,
		cellRows: { named: t.cell_rows_named, kindMismatch: t.cell_rows_kind_mismatch, notARow: t.cell_rows_not_a_row, pairs: Object.fromEntries(Object.entries(t.cell_row_kind_pairs ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8)) },
		records: { n: t.records.n, words: t.records.words, headerOnly: t.records_header_only, error: t.records_error, extra: t.records_extra },
		sideAt: { n: t.side_at.n, words: t.side_at.words, zeroWidth: t.side_at_zero_width, headerOnly: t.side_at_header_only, extra: t.side_at_extra },
		sideSource: t.side_source,
		sideRecords: t.side_records,
		runRecordEntries: t.run_records,
		leafCells: Object.values(t.leaf_cells).reduce((a, v) => ({ n: a.n + v.n, words: a.words + v.words }), { n: 0, words: 0 }),
		unitCells: Object.values(t.unit_cells).reduce((a, v) => ({ n: a.n + v.n, words: a.words + v.words }), { n: 0, words: 0 }),
		capturedStrings: Object.entries(t.cells).filter(([k]) => k.endsWith('text')).reduce((a, [, v]) => ({ n: a.n + v.n, words: a.words + v.words }), { n: 0, words: 0 }),
		linkRecords: t.link_records,
		rowsByRole: Object.fromEntries(Object.entries(roles).sort((a, b) => b[1].words - a[1].words).map(([k, v]) => [k, { ...v, share: +((v.words / total) * 100).toFixed(2) }])),
		unexplained: Object.fromEntries(Object.entries(unexplained).sort((a, b) => b[1] - a[1]).slice(0, 25)),
		cellWordsToday,
		stageOne: t.stage_one && { abuttingLeaves: t.stage_one.abutting_leaves, choiceLists: t.stage_one.choice_lists, choiceGaps: t.stage_one.choice_gaps, choiceOutliers: t.stage_one.choice_outliers, flankedLists: t.stage_one.flanked_lists, delimiterDisagreements: t.stage_one.delimiter_disagreements, delimiterToTrailing: t.stage_one.delimiter_to_trailing, delimiterToNone: t.stage_one.delimiter_to_none, namedFixedQueryItems: t.stage_one.named_fixed_query_items },
		options: Object.fromEntries(Object.entries(options).map(([name, delta]) => [name, { delta, total: total + delta, share: +(((total + delta) / total) * 100).toFixed(1) }])),
	});
}
console.log(JSON.stringify(report, null, 1));
