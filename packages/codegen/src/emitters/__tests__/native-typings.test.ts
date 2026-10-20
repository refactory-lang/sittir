import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const RECORD_CODEC = ['ARENA_CHUNK_SHIFT', 'CELL_TAG_ABSENT', 'CELL_TAG_BUILT_LEAF', 'CELL_TAG_CHILD', 'CELL_TAG_COORDINATE', 'CELL_TAG_PARSED_LEAF', 'CELL_TAG_UNIT', 'SIDE_FIELD_AT', 'SIDE_FIELD_DELIMITER', 'SIDE_FIELD_EDGES', 'SIDE_FIELD_SEPARATOR', 'SIDE_FIELD_SIDES', 'SIDE_FIELD_SPAN', 'SIDE_WORDS_AT', 'SIDE_WORDS_EDGES', 'SIDE_WORDS_SEPARATOR', 'SIDE_WORDS_SIDES', 'SIDE_WORDS_SPAN'];
const ADDON_API = [...RECORD_CODEC, 'BaselineRun', 'ChildPosition', 'EngineOptions', 'NodeIndex', 'SittirEngine', 'TreeId', 'disposeTree', 'liveTreeCount'].sort();

describe("each grammar's native typings", () => {
	it.each(GRAMMARS)('%s declares the addon API alone', (grammar) => {
		const dts = readFileSync(new URL(`../../../../${grammar}/native/index.d.ts`, import.meta.url), 'utf8');
		const declared = [...dts.matchAll(/^export (?:declare )?(?:class|function|interface|type|const|enum) (\w+)/gm)].map((m) => m[1]).sort();
		expect(declared).toEqual(ADDON_API);
	});
});
