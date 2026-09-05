
export interface DefectHistogramOptions {
	grammar: string;
}

/**
 * Collapse a validator failure message to its defect signature.
 *
 * The strict entry gate cascades: one broken nested slot fails every entry
 * whose render includes it, so raw failure counts over-represent single
 * mechanisms. Render/transport errors carry an inner→outer frame chain
 * (`... on XTransport._slot on YTransport._slot ...`); the DEEPEST frame
 * (the first `on` clause) names the defect, so the signature keeps the
 * error head plus that frame and drops the enclosing path. Re-parse and
 * offset-lookup errors carry no chain — they collapse to their error
 * class keyed by the failing kind.
 */
export function defectSignature(kind: string, message: string): string {
	const msg = message
		.replace(/^render:\s*/, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (msg.startsWith('re-parse error')) {
		// Cause marker from firstParseDefect (read-render-parse) — the broken
		// construct in the re-parsed tree. Bucketing by entry kind instead
		// would just measure blast radius (root kinds absorb every nested
		// defect); only fall back to it when no defect was located.
		const cause = /^re-parse error \[(.+?)\]/.exec(msg)?.[1];
		return cause !== undefined && cause !== 'unlocated' ? `re-parse: ${cause}` : `re-parse error @ ${kind}`;
	}
	if (msg.startsWith('kind not found in re-parse')) return `kind not found in re-parse @ ${kind}`;
	if (msg.startsWith('kind not found at rendered offset')) {
		// Leading-whitespace renders shift the first token off the expected
		// offset — one render mechanism regardless of which kind reports it.
		if (msg.includes('[leading-whitespace render]')) return 'leading-whitespace render';
		return `kind not found at rendered offset @ ${kind}`;
	}
	const frames = msg.split(' on ');
	return frames.length >= 2 ? `${frames[0]} on ${frames[1]}` : frames[0]!;
}

/** Extract the per-kind suffix from an rt error label (`Entry name [kind]`). */
function kindOfLabel(label: string): string {
	const m = /\[([^\]]+)\]$/.exec(label);
	return m?.[1] ?? '?';
}

/**
 * Group read-render-parse failures by defect signature and print a
 * histogram (count-descending) with sample entries. The strict entry
 * counts remain the pass/fail gate; this view answers "how many DISTINCT
 * defects, and which entries does each one take down".
 */
export async function run(opts: DefectHistogramOptions): Promise<number> {
	const { validateReadRenderParse } = await import('./read-render-parse.ts');
	const r = await validateReadRenderParse(opts.grammar, { backend: 'native' });
	const groups = new Map<string, { count: number; entries: Set<string> }>();
	for (const e of r.errors) {
		const sig = defectSignature(kindOfLabel(e.name), e.message);
		const g = groups.get(sig) ?? { count: 0, entries: new Set<string>() };
		g.count++;
		g.entries.add(e.name.replace(/\s*\[[^\]]+\]$/, ''));
		groups.set(sig, g);
	}

	console.log(
		`\n=== DEFECT HISTOGRAM read-render-parse ${opts.grammar} ` +
			`(${r.pass}/${r.total} pass, ${r.errors.length} failures, ${groups.size} distinct defects) ===`
	);
	const rows = [...groups.entries()].sort((a, b) => b[1].entries.size - a[1].entries.size);
	for (const [sig, g] of rows) {
		const sample = [...g.entries].slice(0, 3).join(' | ');
		const more = g.entries.size > 3 ? ` (+${g.entries.size - 3} more)` : '';
		console.log(`  ${String(g.entries.size).padStart(3)} entries  ${sig}`);
		console.log(`             ↳ ${sample}${more}`);
	}
	return 0;
}
