import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import regex, { type RegexAPI, type RegexNode } from '@sittir/regex';

declare const rx: Engine<RegexAPI>;
declare const node: RegexNode;

void createEngine(regex);
// @ts-expect-error no indent character is admitted
void createEngine(regex, { render: { indent: '\t' } });
// @ts-expect-error per-call options have no indent either
rx.render(node, { indent: '\t' });
