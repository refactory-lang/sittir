/**
 * Writes locked/, a stand-in for the authored vocabulary the binding generator presumes: today's
 * emitted vocabulary with spec §3.4's kind rule applied, so a level's `kind` admits every path
 * beneath it ('type' | `type.${string}`) and a refinement is assignable where its parent is.
 * Nothing else changes. The real vocabulary under packages/types is never touched.
 *
 *   SITTIR_ROOT=<checkout> pnpm exec tsx lock-vocabulary.mts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.SITTIR_ROOT ?? join(HERE, '..', '..', '..', '..');
const FROM = join(ROOT, 'packages/types/src/vocabulary');
const TO = join(HERE, 'locked');

mkdirSync(TO, { recursive: true });
let kinds = 0;
for (const file of readdirSync(FROM).filter((f) => f.endsWith('.ts'))) {
	const text = readFileSync(join(FROM, file), 'utf8')
		.replace(/^import type \{ Simplify \} from 'type-fest';$/m, 'type Simplify<T> = { [K in keyof T]: T[K] } & {};')
		.replace(/readonly \$kind: '([a-z_.]+)';/g, (_, path: string) => {
			kinds++;
			return `readonly $kind: '${path}' | \`${path}.\${string}\`;`;
		});
	writeFileSync(join(TO, file), text);
}
console.log(`wrote ${TO}: ${kinds} kinds widened to admit the paths beneath them`);
