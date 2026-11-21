import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { PortableBuildTable, PortableSpelling } from '@sittir/types';
import { describe, expect, it } from 'vitest';
import { build as pythonTable } from '../../../python/src/portable/table.ts';
import { build as rustTable } from '../../../rust/src/portable/table.ts';
import { build as typescriptTable } from '../../../typescript/src/portable/table.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../../codegen/src/__tests__/helpers/timeouts.ts';
import { resolveRoutes } from '../../../codegen/src/bindings/routes.ts';
import type { Body } from '../../../codegen/src/emitters/render-body.ts';
import { portableSpellingOf } from '../../../codegen/src/emitters/overlays/portable/spelled-facts.ts';
import { loadInputs } from '../../src/inventory/index.ts';
import { languageByName } from '../../src/languages.ts';
import { loadRenderBodies } from '../../src/validate/render-bodies.ts';

interface Spelled {
	readonly path: string;
	readonly fact: string;
	readonly spelling: PortableSpelling;
}

const spellingsOf = (table: PortableBuildTable): readonly Spelled[] =>
	Object.entries(table.paths).flatMap(([path, row]) => row.arms.flatMap((arm) => (arm.facts ?? []).flatMap((fact) => fact.spellings.map((spelling) => ({ path, fact: fact.name, spelling })))));

describe("a spelled fact's stamped text", () => {
	it('is the spelling the reader records at the fact, split where its holes sit, for every python spelling', async () => {
		using engine = await createEngine(await languageByName('python'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const readAt = (path: string, fact: string, text: string): unknown => {
			const def = path.includes('getter') ? 'def x(self) -> int:' : 'def f(self):';
			const read = runtime.read(engine.parse(`class A:\n    @${text}\n    ${def}\n        pass\n`)) as { readonly statements: readonly { readonly members: readonly { readonly $at?: Readonly<Record<string, { readonly spelling?: string }>> }[] }[] };
			return read.statements[0]!.members[0]!.$at?.[fact]?.spelling;
		};
		const spelled = spellingsOf(pythonTable);
		expect(spelled.filter(({ spelling }) => spelling.text.length !== 1 + Object.keys(spelling.holes ?? {}).length).map(({ path, fact }) => `${path} ${fact}`)).toEqual([]);
		expect(spelled.filter(({ spelling }) => spelling.holes !== undefined).map(({ path, fact, spelling }) => [path, fact, spelling.text])).toEqual([['declaration.property.setter', 'setter', ['', '.setter']]]);
		const texts = spelled.flatMap(({ path, fact, spelling }) => (spelling.holes === undefined ? [[path, fact, spelling.text[0]!] as const] : []));
		expect(texts.map(([path, fact, text]) => [path, fact, text, readAt(path, fact, text)]).filter(([, , text, read]) => read !== text)).toEqual([]);
		expect(texts.map(([, fact, text]) => `${fact} ${text}`)).toEqual([
			'static staticmethod',
			'override override',
			'override typing.override',
			'static staticmethod',
			'override override',
			'override typing.override',
			'getter property',
			'override override',
			'override typing.override',
			'override override',
			'override typing.override'
		]);
	});

	it(
		'is refused where its render body would run two words together or leave a slot its item states unplaced',
		async () => {
			const [input] = await loadInputs(['python']);
			const routes = resolveRoutes(input!);
			const entry = routes.readEntries
				.get('method_declaration')!
				.find((candidate) => candidate.claim.predicates.some((predicate) => predicate.arguments.some((argument) => 'text' in argument && argument.text === 'typing')))!;
			const bodies = loadRenderBodies('python');
			const attribute = bodies.get('attribute')!;
			const spell = (body: Body) => portableSpellingOf(entry, input!.model, routes, new Map([...bodies, ['attribute', body]]));
			expect(spell(attribute).text).toEqual(['typing.override']);
			expect(() => spell(attribute.filter((part) => part.kind !== 'text'))).toThrow('attribute spells "typing" and "override" with no gap between them');
			expect(() => spell(attribute.filter((part) => part.kind !== 'slot' || part.name !== 'property'))).toThrow("attribute's render body places no property");
		},
		FULL_PIPELINE_TIMEOUT
	);

	it.each([
		['rust', rustTable],
		['typescript', typescriptTable]
	] as const)('%s spells no fact, so it stamps no text', (_, table) => {
		expect(spellingsOf(table)).toEqual([]);
	});
});
