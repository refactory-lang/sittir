import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from '../assemble.ts';
import { predictionRecords } from '../diagnostics/grammar-diagnostics.ts';
import type { RawGrammar } from '../types.ts';
import type { AssembledSupertype } from '../model/node-map.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

async function evaluateSource(source: string): Promise<RawGrammar> {
	const dir = mkdtempSync(resolve(tmpdir(), 'sittir-hydrate-slot-refs-'));
	const entry = resolve(dir, 'grammar.js');
	writeFileSync(entry, source, 'utf8');
	try {
		return await evaluate(entry, NO_FILE_TYPES);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const containerGrammar = (members: string) => `module.exports = grammar({
  name: "dr",
  supertypes: ($) => [$._container],
  rules: {
    root: ($) => $._container,
    _container: ($) => choice(${members}),
    visible: ($) => "v",
    other: ($) => "o"
  }
});\n`;

describe('dangling internal refs', () => {
	it('a name the grammar never defines is a prediction record, and link refuses the grammar', async () => {
		const raw = await evaluateSource(containerGrammar('$.visible, $.ghost'));
		expect(predictionRecords(raw)).toEqual([
			expect.objectContaining({ code: 'dangling-internal-ref', canProceed: false, details: { targetName: 'ghost' } })
		]);
		expect(() => link(raw)).toThrow(/no predicted symbol table/);
	});

	it('hydrate throws on a reference to a kind absent from the node map, naming it', async () => {
		const raw = await evaluateSource(containerGrammar('$.visible, $.other'));
		const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
		nodeMap.nodes.delete('other');
		expect(() => hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline), grammar: 'dr' })).toThrow(/'other'/);
	});

	it('hydrate throws on a variant whose owner is absent from the node map, naming the owner', async () => {
		const raw = await evaluateSource(containerGrammar('$.visible, $.other'));
		const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
		const container = nodeMap.nodes.get('_container') as AssembledSupertype;
		Object.assign(container.subtypes[0]!, { variant: 'seen', variantOf: 'ghost' });
		expect(() => hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline), grammar: 'dr' })).toThrow(/'ghost'/);
		expect(() => hydrateSlotRefs(nodeMap, { inline: new Set(['ghost']), grammar: 'dr' })).not.toThrow();
		expect(() => hydrateSlotRefs(nodeMap, { spliced: new Set(['ghost']), grammar: 'dr' })).not.toThrow();
	});

	it('hydrate skips a kind assemble dropped with a shape record', async () => {
		const raw = await evaluateSource(containerGrammar('$.visible, $.other'));
		const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
		nodeMap.nodes.delete('other');
		expect(() =>
			hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline), reportedAbsentNames: new Set(['other']), grammar: 'dr' })
		).not.toThrow();
	});
});
