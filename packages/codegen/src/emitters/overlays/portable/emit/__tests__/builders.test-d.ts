import type { PinnedBuilders } from '../engine.ts';

declare const t: PinnedBuilders;
const value = t.stringSingle('x');
const returned = t.returnStatement(t.identifier('y'));
export const written = t.switchCase({ value, bodies: [returned] });
// @ts-expect-error
export const misspelled = t.switchCase({ value, body: [returned] });
