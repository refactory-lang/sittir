import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import type { RawGrammar } from '../types.ts';
import { EMPTY_CONFLICT_RESOLUTIONS, type ConflictResolutionsFile } from '../../dsl/conflict-resolutions.ts';
import { BINDINGS_MODULE, GRAMMAR_ENTRY, layerPath, type GrammarLayer } from '../../grammars.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const DSL = JSON.stringify(resolve(__dirname, '../../dsl/index.ts'));

export interface FixtureLayers {
	readonly bindings?: string;
	readonly renames?: Readonly<Record<string, string>>;
	readonly layer?: GrammarLayer;
}

export function writeSittirGrammarPackage(
	dir: string,
	baseModule: string,
	name: string,
	config = '',
	resolutions: ConflictResolutionsFile = EMPTY_CONFLICT_RESOLUTIONS,
	{ bindings, renames = {} }: Omit<FixtureLayers, 'layer'> = {}
): void {
	mkdirSync(join(dir, '.sittir'), { recursive: true });
	writeFileSync(join(dir, '.sittir', 'resolutions.json'), JSON.stringify(resolutions));
	writeFileSync(
		join(dir, GRAMMAR_ENTRY),
		`import base from ${JSON.stringify(baseModule)};\nimport resolutions from './.sittir/resolutions.json' with { type: 'json' };\nimport { enrich, wire, edit, field, alias, preference } from ${DSL};\nexport default grammar(enrich(base), wire({ resolutions, name: '${name}', ${config} }));\n`
	);
	if (bindings !== undefined)
		writeFileSync(
			join(dir, BINDINGS_MODULE),
			`import sittir from './${GRAMMAR_ENTRY}';\nimport { enrich, wire, edit, field, alias, lead, match } from ${DSL};\nexport const renames = ${JSON.stringify(renames)};\nexport default grammar(enrich(sittir), wire({ ${bindings} }));\n`
		);
}

export async function evaluateSittirGrammar(
	baseModule: string,
	name: string,
	config = '',
	resolutions: ConflictResolutionsFile = EMPTY_CONFLICT_RESOLUTIONS,
	{ layer = 'top', ...layers }: FixtureLayers = {}
): Promise<RawGrammar> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-grammar-'));
	try {
		writeSittirGrammarPackage(dir, baseModule, name, config, resolutions, layers);
		return await evaluate(layerPath({ dir }, layer), NO_FILE_TYPES);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
