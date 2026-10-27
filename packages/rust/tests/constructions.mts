// The engines the side tests render through, one per construction.
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

export const objects = await createEngine(rust, { nodeStorage: 'object' });
export type Engine = typeof objects;
export const records = await createEngine(rust);
export const constructions: readonly [string, Engine][] = [
	['objects', objects],
	['arena objects', await createEngine(rust, { nodeConstruction: 'object' })],
	['records', records]
];
