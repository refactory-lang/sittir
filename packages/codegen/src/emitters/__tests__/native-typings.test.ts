import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const RECORD_CODEC = ['ARENA_CHUNK_SHIFT', 'CELL_BLANK_UNIT', 'CELL_FORM_BLANK', 'CELL_FORM_INLINE', 'CELL_FORM_NODE', 'CELL_FORM_TEXT', 'CELL_FORM_UNIT', 'CELL_LEAF_BIT', 'CELL_TAG_ABSENT', 'CELL_TAG_INLINE', 'CELL_TAG_NODE', 'CELL_TAG_TEXT', 'CELL_TAG_UNIT', 'COUNT_OWNED', 'COUNT_SATURATED', 'HELD_RECORD', 'HELD_RUN', 'HELD_SIDE', 'HELD_TEXT', 'KIND_BITS', 'LINK_RECORD_WORDS', 'RECORD_FLAG_LINK', 'SIDE_FIELD_AT', 'SIDE_FIELD_CHANGED_LEADING', 'SIDE_FIELD_CHANGED_TRAILING', 'SIDE_FIELD_DELIMITER', 'SIDE_FIELD_EDGES', 'SIDE_FIELD_SEPARATOR', 'SIDE_FIELD_SEPARATOR_KIND', 'SIDE_FIELD_SIDES', 'SIDE_FIELD_SPAN', 'SIDE_WORDS_AT', 'SIDE_WORDS_EDGES', 'SIDE_WORDS_SEPARATOR', 'SIDE_WORDS_SIDES', 'SIDE_WORDS_SPAN'];
const ADDON_TYPES = ['BaselineRun', 'ChildPosition', 'EngineOptions', 'NodeIndex', 'SittirEngine', 'TreeId', '__napiBindingTarget'];
const ADDON_FUNCTIONS = ['builtBump', 'builtBytes', 'builtLeafSide', 'builtMemory', 'builtTriviaSide', 'builtUnitSides', 'builtWords', 'chunk', 'coordinate', 'copyBuiltSites', 'descendants', 'disposeTree', 'editedWithin', 'externalBuffers', 'framedSpan', 'hydrateRecord', 'isEmpty', 'layoutBaseline', 'layoutWork', 'lineStartsInsideTokens', 'liveTreeCount', 'planHolds', 'read', 'readCell', 'readMany', 'readRecord', 'recordCandidates', 'releaseBuilt', 'render', 'renderBuilt', 'renderBuiltLeaf', 'renderCandidate', 'renderRecord', 'renderToFile', 'separatorBefore', 'siblings', 'slotLayouts', 'slotSeparator', 'snapshot', 'storedLayout', 'text', 'triviaSide', 'unitSides', 'writeBuiltLeafSide', 'writeBuiltTriviaSide', 'writeBuiltUnitSides', 'writeTriviaSide'];
const ADDON_API = [...RECORD_CODEC, ...ADDON_TYPES, ...ADDON_FUNCTIONS].sort();

describe("each grammar's native typings", () => {
	it.each(GRAMMARS)('%s declares the addon API alone', (grammar) => {
		const dts = readFileSync(new URL(`../../../../${grammar}/native/index.d.ts`, import.meta.url), 'utf8');
		const declared = [...dts.matchAll(/^export (?:declare )?(?:class|function|interface|type|const|enum) (\w+)/gm)].map((m) => m[1]).sort();
		expect(declared).toEqual(ADDON_API);
	});
});
