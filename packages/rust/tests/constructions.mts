// The engines the side tests render through, one per construction.
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import arena from '../src/arena.ts';
import rust from '../src/index.ts';

export const objects = await createEngine(rust);
export type Engine = typeof objects;
export const records = (await arena.createEngine()) as Engine;
useRecordConstruction(records, await import('../src/factories/records.ts'));
export const constructions: readonly [string, Engine][] = [
	['objects', objects],
	['arena objects', (await arena.createEngine()) as Engine],
	['records', records]
];
