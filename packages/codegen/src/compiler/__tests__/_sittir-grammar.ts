import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import type { RawGrammar } from '../types.ts';

const DSL = JSON.stringify(resolve(__dirname, '../../dsl/index.ts'));

export async function evaluateSittirGrammar(baseModule: string, name: string, config = ''): Promise<RawGrammar> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-grammar-'));
	try {
		writeFileSync(
			join(dir, 'grammar.sittir.ts'),
			`import base from ${JSON.stringify(baseModule)};\nimport { sittirGrammar } from ${DSL};\nexport default sittirGrammar(base, { name: '${name}', ${config} });\n`
		);
		return await evaluate(join(dir, 'grammar.sittir.ts'));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
