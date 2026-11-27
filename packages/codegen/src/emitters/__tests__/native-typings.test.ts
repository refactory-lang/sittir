import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const RECORD_CODEC = ['ARENA_CHUNK_SHIFT', 'CELL_BLANK_UNIT', 'CELL_FORM_BLANK', 'CELL_FORM_NODE', 'CELL_FORM_TEXT', 'CELL_FORM_UNIT', 'CELL_TAG_ABSENT', 'CELL_TAG_NODE', 'CELL_TAG_TEXT', 'CELL_TAG_UNIT', 'COUNT_OWNED', 'COUNT_SATURATED', 'HELD_DROPPED', 'HELD_RECORD', 'HELD_RUN', 'HELD_SIDE', 'HELD_TEXT', 'KIND_BITS', 'LINK_RECORD_WORDS', 'NODE_ID_HOLDER_BITS', 'NODE_ID_ITEM_BITS', 'NODE_ID_WORD_BITS', 'RECORD_FLAG_BITS', 'RECORD_FLAG_LINK', 'RECORD_HEADER_WORDS', 'SIDE_FIELD_AT', 'SIDE_FIELD_CHANGED_LEADING', 'SIDE_FIELD_CHANGED_TRAILING', 'SIDE_FIELD_DELIMITER', 'SIDE_FIELD_EDGES', 'SIDE_FIELD_INNER', 'SIDE_FIELD_LEADING', 'SIDE_FIELD_NEXT', 'SIDE_FIELD_SEPARATOR_KIND', 'SIDE_FIELD_SIDES', 'SIDE_FIELD_SITES', 'SIDE_FIELD_SPAN', 'SIDE_FIELD_TRAILING', 'SIDE_WORDS_AT', 'SIDE_WORDS_EDGES', 'SIDE_WORDS_SIDES', 'SIDE_WORDS_SITE', 'SIDE_WORDS_SPAN'];
const ADDON_TYPES = ['BackerParityRead', 'ChildPosition', 'EngineOptions', 'EngineStamp', 'LayoutWork', 'NativeParseOptions', 'NodeIndex', 'SittirEngine', 'TreeId', 'TreeMemory', '__napiBindingTarget'];
const ADDON_FUNCTIONS = ['backerParity', 'builtBump', 'builtBytes', 'builtLeafSide', 'builtMemory', 'builtTriviaSide', 'builtUnitSides', 'builtWords', 'copyBuiltSites', 'descendants', 'disposeTree', 'editedWithin', 'engineStamp', 'externalBuffers', 'framedSpan', 'isEmpty', 'layoutWork', 'lineStartsInsideTokens', 'liveTreeCount', 'parseRecords', 'planHolds', 'read', 'readDescendants', 'readIsEmpty', 'readPlanHolds', 'readRenderAt', 'readSides', 'readSlotLayouts', 'readSlotSeparator', 'readSnapshotLayouts', 'readSources', 'readStoredLayout', 'readText', 'readTriviaSide', 'readUnitSides', 'readWords', 'releaseBuilt', 'render', 'renderAt', 'renderBuilt', 'renderBuiltLeaf', 'renderBuiltLeafToFile', 'renderBuiltSides', 'renderBuiltToFile', 'renderToFile', 'slotLayouts', 'slotSeparator', 'snapshotLayouts', 'storedLayout', 'text', 'treeMemory', 'triviaSide', 'unitSides', 'writeBuiltLeafSide', 'writeBuiltTriviaSide', 'writeBuiltUnitSides', 'writeReadTriviaSide', 'writeText', 'writeTriviaSide'];
const ADDON_API = [...RECORD_CODEC, ...ADDON_TYPES, ...ADDON_FUNCTIONS].sort();

describe("each grammar's native typings", () => {
	it.each(GRAMMARS)('%s declares the addon API alone', (grammar) => {
		const dts = readFileSync(new URL(`../../../../${grammar}/native/index.d.ts`, import.meta.url), 'utf8');
		const declared = [...dts.matchAll(/^export (?:declare )?(?:class|function|interface|type|const|enum) (\w+)/gm)].map((m) => m[1]).sort();
		expect(declared).toEqual(ADDON_API);
	});
});
