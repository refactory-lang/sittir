import { writeFileSync } from 'node:fs';
import { createEngine, snapshotOf } from '@sittir/common';
import { languageByName } from '../../../../../packages/tools/src/languages.ts';
import { loadCorpusEntries } from '../../../../../packages/tools/src/validate/common.ts';
const out: { grammar: string; entry: string; source: string; live: string; snapshot: string }[] = [];
for (const grammar of ['rust', 'typescript', 'python', 'scm', 'regex']) {
	const engine = await createEngine(await languageByName(grammar));
	for (const { name, source } of loadCorpusEntries(grammar)) {
		try {
			const root = engine.parse(source, { deep: true, depth: Infinity });
			const live = engine.render(root).toString();
			const snapshot = engine.render(snapshotOf(root)).toString();
			if (live !== snapshot) out.push({ grammar, entry: name, source, live, snapshot });
		} catch {}
	}
}
writeFileSync(process.argv[2]!, JSON.stringify(out));
console.log(out.length);
