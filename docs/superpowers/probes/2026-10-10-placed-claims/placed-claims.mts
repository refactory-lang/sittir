// The placed claims of each grammar's bindings: tsx placed-claims.mts <worktree> > placed.jsonl
//
// A placed claim is one the bindings reader marks `toplevel: false`: its node is not its pattern's
// top, so an ancestor decides it. Each pattern is read on its own through the codegen reader
// (`@sittir/codegen/bindings`, the pinned reader in its child process), so each claim keeps its
// pattern's line and source. The last line per grammar counts its claims and placed claims.
import { readFileSync } from 'node:fs';

const wt = process.argv[2];
const { bindingPatterns, readBindings } = await import(`${wt}/packages/codegen/src/bindings/index.ts`);
for (const g of ['python', 'rust', 'typescript']) {
	const text = readFileSync(`${wt}/packages/${g}/bindings.scm`, 'utf8');
	let claims = 0;
	let placed = 0;
	for (const p of await bindingPatterns(text)) {
		for (const c of (await readBindings(p.source)).claims) {
			claims++;
			if (c.toplevel) continue;
			placed++;
			const preds = c.predicates.map((x: { operator: string; capture: string | null; subject: { up: number } | null }) => ({ op: x.operator, cap: x.capture, up: x.subject?.up ?? null }));
			console.log(JSON.stringify({ g, line: p.line, vocab: c.vocab, kind: c.kind, field: c.field, within: c.within, preds, src: p.source }));
		}
	}
	console.log(JSON.stringify({ g, claims, placed }));
}
