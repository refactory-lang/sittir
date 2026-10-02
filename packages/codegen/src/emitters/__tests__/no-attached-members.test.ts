import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { allGrammars } from '../../grammars.ts';

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const ATTACHERS = /\b(?:withMethods|withAccessors|withListView|withListSlots|withGroupSeat|withElementsSeat|bindEngine)\(/;
const PER_NODE_DEFINITIONS = /Object\.defineProperty|^\s*(?:get|set)\s+[\w[\]'"]+\s*\(|\bget:\s*(?:function|\()/m;

describe('no node has a member attached after it is built', () => {
	for (const grammar of allGrammars()) {
		for (const file of ['factories/raw.ts', 'wrap.ts']) {
			it(`${grammar}/${file}: every member is written in the node's literal`, () => {
				const source = read(grammar, file);
				expect(source).not.toMatch(ATTACHERS);
				expect(source).not.toMatch(PER_NODE_DEFINITIONS);
			});
		}
	}
});
