import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
	BINDING_FACTS_VERSION,
	StaleBindingFactsError,
	WRITE_FACTS_COMMAND,
	bindingsHash,
	bindingsPath,
	readBindingFacts,
	verifiedBindingFacts
} from '../bindings/index.ts';
import { allGrammars } from '../grammars.ts';

const withBindings = allGrammars().filter((g) => existsSync(bindingsPath(g)));

describe('readBindingFacts', () => {
	it.each(withBindings)('reads the committed facts of %s, derived from its current bindings.scm', (grammar) => {
		expect(readBindingFacts(grammar).claims.length).toBeGreaterThan(0);
	});

	it('refuses facts read from another bindings.scm, naming the command that regenerates them', () => {
		const text = '(identifier) @identifier';
		const artifact = { bindingsHash: bindingsHash(text), facts: { claims: [], members: [], containers: [], templates: [], unclaimed: [] } };
		expect(verifiedBindingFacts('rust', artifact, text)).toBe(artifact.facts);
		expect(() => verifiedBindingFacts('rust', artifact, `${text}\n(type_identifier) @identifier.type`)).toThrow(StaleBindingFactsError);
		expect(() => verifiedBindingFacts('rust', artifact, `${text}\n`)).toThrow(WRITE_FACTS_COMMAND);
	});

	it('refuses facts written by an older derivation of the same bindings.scm', () => {
		const text = readFileSync(bindingsPath('rust'), 'utf8');
		const facts = { claims: [], members: [], containers: [], templates: [], unclaimed: [] };
		const older = { bindingsHash: bindingsHash(text, BINDING_FACTS_VERSION - 1), facts };
		expect(() => verifiedBindingFacts('rust', older, text)).toThrow(StaleBindingFactsError);
	});
});
