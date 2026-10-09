import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { evaluate, type EvaluateOptions } from '../evaluate.ts';
import type { RawGrammar } from '../types.ts';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const DSL = JSON.stringify(resolve(__dirname, '../../dsl/index.ts'));

export async function evaluateSittirGrammar(
	baseModule: string,
	name: string,
	config = '',
	resolutions: ConflictResolutionsFile = EMPTY_CONFLICT_RESOLUTIONS,
	options: EvaluateOptions = {}
): Promise<RawGrammar> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-grammar-'));
	try {
		mkdirSync(join(dir, '.sittir'));
		writeFileSync(join(dir, '.sittir', 'resolutions.json'), JSON.stringify(resolutions));
		writeFileSync(
			join(dir, 'grammar.sittir.ts'),
			`import base from ${JSON.stringify(baseModule)};\nimport resolutions from './.sittir/resolutions.json' with { type: 'json' };\nimport { sittirGrammar, bindings, rename, split, field, alias, preference } from ${DSL};\nexport default sittirGrammar(base, { resolutions, name: '${name}', ${config} });\n`
		);
		return await evaluate(join(dir, 'grammar.sittir.ts'), NO_FILE_TYPES, options);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
