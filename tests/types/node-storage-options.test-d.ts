import type { NodeStorageOptions } from '@sittir/types';

const defaulted: NodeStorageOptions = {};
const arena: NodeStorageOptions = { nodeStorage: 'arena' };
const objects: NodeStorageOptions = { nodeStorage: 'object' };
// @ts-expect-error Storage is the one node backend option; how built nodes are stored follows it.
const construction: NodeStorageOptions = { nodeStorage: 'object', nodeConstruction: 'object' };
// @ts-expect-error A backend is one of the two storages.
const records: NodeStorageOptions = { nodeStorage: 'record' };
void [defaulted, arena, objects, construction, records];
