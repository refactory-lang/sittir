import { SOURCE } from '../../src/source-stamp.ts';
import { Source } from '../../src/source.ts';

/** A hand-written node as a builder makes one: its members, then its factory source. */
export const factoryNode = <T extends object>(node: T): T => ({ ...node, [SOURCE]: Source.Factory });
