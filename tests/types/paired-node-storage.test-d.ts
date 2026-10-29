import type { NodeStorageOptions } from '@sittir/types';

const objects: NodeStorageOptions = { nodeStorage: 'object' };
const records: NodeStorageOptions = { nodeStorage: 'arena' };
const objectAlias: NodeStorageOptions = { nodeStorage: 'object', nodeConstruction: 'object' };
const recordAlias: NodeStorageOptions = { nodeStorage: 'arena', nodeConstruction: 'record' };
// @ts-expect-error Parsed arena storage cannot build objects.
const hybrid: NodeStorageOptions = { nodeStorage: 'arena', nodeConstruction: 'object' };
// @ts-expect-error An object construction hint cannot select the default arena backend.
const constructionOnly: NodeStorageOptions = { nodeConstruction: 'object' };
// @ts-expect-error Records require the arena backend.
const inverted: NodeStorageOptions = { nodeStorage: 'object', nodeConstruction: 'record' };
void [objects, records, objectAlias, recordAlias, hybrid, constructionOnly, inverted];
