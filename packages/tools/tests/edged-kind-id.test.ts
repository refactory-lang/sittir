import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;

const transportOf = (grammar: string): string | undefined => {
	const path = new URL(`../../../rust/crates/sittir-${grammar}/src/render/transport.rs`, import.meta.url);
	return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
};

export function edgedKindIdMismatches(source: string): string[] {
	const edged = new Map(
		[...source.matchAll(/impl ::sittir_core::options::Edged for (\w+) \{\s*fn kind_id\(&self\) -> ::sittir_core::types::KindId \{ ::sittir_core::types::KindId\((\d+)\) \}/g)].map(
			(m) => [m[1]!, Number(m[2])] as const
		)
	);
	const kindOf = new Map(
		[...source.matchAll(/impl ::sittir_core::view::KindOf for (\w+) \{\s*fn kind_in\([^)]*\) -> bool \{\s*\[([^\]]*)\]/g)].map(
			(m) => [m[1]!, [...m[2]!.matchAll(/KindId\((\d+)\)/g)].map((id) => Number(id[1]))] as const
		)
	);
	return [...edged].flatMap(([struct, id]) => {
		const ids = kindOf.get(struct);
		return ids === undefined || ids.includes(id) ? [] : [`${struct}: Edged ${id}, KindOf [${ids.join(', ')}]`];
	});
}

describe('a transport\'s edge kind id', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: is one of the kind ids its KindOf reports`, () => {
			const source = transportOf(grammar);
			if (source === undefined) return;
			expect(edgedKindIdMismatches(source)).toEqual([]);
		});
	}
});
