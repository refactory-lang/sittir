import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../compiler/compile.ts';
import { JOIN_SEAMS_FILE, printJoinSeams } from '../compiler/model/join-seams/file.ts';
import { deriveJoinSeams, joinSeamInputOf } from '../compiler/model/join-seams/index.ts';
import { allGrammars, grammarPackage, sittirDirOf } from '../grammars.ts';
import { JOIN_DERIVATION_TIMEOUT } from './helpers/timeouts.ts';

describe('the committed join seams', () => {
	for (const grammar of allGrammars()) {
		it(
			`${grammar}: are what the derivation gives from its parser now`,
			async () => {
				const pkg = grammarPackage(grammar);
				const { nodeMap, evaluated, generatedIdTables } = await compileGrammar({ package: pkg });
				if (generatedIdTables.parser === null) throw new Error(`${grammar} has no built parser`);
				const derived = printJoinSeams(
					deriveJoinSeams(joinSeamInputOf(nodeMap, evaluated.rules, generatedIdTables.parser))
				);
				expect(
					derived,
					`${grammar}: delete packages/${grammar}/.sittir/${JOIN_SEAMS_FILE} and regenerate ${grammar}`
				).toBe(readFileSync(join(sittirDirOf(pkg), JOIN_SEAMS_FILE), 'utf8'));
			},
			JOIN_DERIVATION_TIMEOUT
		);
	}
});
