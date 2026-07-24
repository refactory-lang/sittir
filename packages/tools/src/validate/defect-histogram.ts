import { resolve } from 'node:path';

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
	const msg = message.replace(/^render:\s*/, '').replace(/\s+/g, ' ').trim();
	if (msg.startsWith('re-parse error')) return `re-parse error @ ${kind}`;
	if (msg.startsWith('kind not found in re-parse')) return `kind not found in re-parse @ ${kind}`;
	if (msg.startsWith('kind not found at rendered offset')) return `kind not found at rendered offset @ ${kind}`;
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
	const tp = resolve(new URL('../../../..', import.meta.url).pathname, `packages/${opts.grammar}/templates`);

	const r = await validateReadRenderParse(opts.grammar, tp, { backend: 'native' });
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
