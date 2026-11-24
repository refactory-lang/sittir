import { afterAll, describe, expect, it } from 'vitest';
import { disposeNativeEngines } from '../common.ts';
import { RoundtripProfile } from '../roundtrip-profile.ts';
import { validateReadRenderParse, type ParityFixture } from '../read-render-parse.ts';

type Candidate = { readonly entry: string; readonly kind: string; readonly start: number; readonly end: number };
const keyOf = ({ entry, kind, start, end }: Candidate): string => JSON.stringify([entry, kind, start, end]);

class CandidateLog extends RoundtripProfile {
	readonly candidates: Candidate[] = [];
	current: string | undefined;
	override candidate(entry: string, source: string, kind: string, start: number, end: number): void {
		const candidate = { entry, kind, start, end };
		this.candidates.push(candidate);
		this.current = keyOf(candidate);
		super.candidate(entry, source, kind, start, end);
	}
}

describe('read-render-parse accounts for every candidate', () => {
	afterAll(() => disposeNativeEngines());

	it('ends each candidate past the neutral skips as exactly one of a fixture, an AST row, a folded row or an error', async () => {
		const profile = new CandidateLog();
		const fixtures = new Map<string, number>();
		const result = await validateReadRenderParse('typescript', {
			backend: 'native',
			recursive: true,
			profile,
			onFixture: (fx: ParityFixture) => {
				if (fx.kind !== 'render') return;
				const key = profile.current!;
				fixtures.set(key, (fixtures.get(key) ?? 0) + 1);
			}
		});

		const count = (rows: { entry?: string; kind: string; start: number; end: number }[]) => {
			const out = new Map<string, number>();
			for (const r of rows) {
				const k = keyOf({ entry: r.entry!, kind: r.kind, start: r.start, end: r.end });
				out.set(k, (out.get(k) ?? 0) + 1);
			}
			return out;
		};
		const ast = count(result.astMismatches);
		const folded = count(result.foldedMismatches);

		const unexplained: string[] = [];
		const overlapping: string[] = [];
		const tally = new Map<string, number>();
		for (const candidate of profile.candidates) {
			const k = keyOf(candidate);
			const parts = (fixtures.get(k) ?? 0) + (ast.get(k) ?? 0) + (folded.get(k) ?? 0);
			if (parts > 1) overlapping.push(`${candidate.entry} [${candidate.kind}] ${candidate.start}-${candidate.end}: ${parts} outcomes`);
			if (parts === 0) {
				const group = JSON.stringify([candidate.entry, candidate.kind]);
				tally.set(group, (tally.get(group) ?? 0) + 1);
			}
		}
		const errorsOf = new Map<string, number>();
		for (const e of result.errors) {
			const match = /^(.*) \[([^\]]+)\]$/.exec(e.name);
			if (match) {
				const group = JSON.stringify([match[1], match[2]]);
				errorsOf.set(group, (errorsOf.get(group) ?? 0) + 1);
			}
		}
		const excludedOf = new Map<string, number>();
		for (const e of result.excluded) {
			const group = JSON.stringify([e.entry, e.kind]);
			excludedOf.set(group, (excludedOf.get(group) ?? 0) + 1);
		}
		for (const [group, n] of tally) {
			const explained = (errorsOf.get(group) ?? 0) + (excludedOf.get(group) ?? 0);
			if (n !== explained) {
				const [entry, kind] = JSON.parse(group) as [string, string];
				unexplained.push(`${entry} [${kind}]: ${n} candidates in no outcome, ${explained} explained by errors or skips`);
			}
		}

		expect(overlapping).toEqual([]);
		expect(unexplained).toEqual([]);
		expect(profile.candidates.length).toBeGreaterThan(0);
	}, 900_000);
});
