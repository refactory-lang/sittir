import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import regex, { type RegexAPI, type RegexNode } from '@sittir/regex';

declare const rx: Engine<RegexAPI>;
declare const node: RegexNode;

void createEngine(regex);
// @ts-expect-error no indent character is admitted
void createEngine(regex, { render: { layout: { indent: '\t' } } });
// @ts-expect-error per-call options have no indent either
rx.render(node, { layout: { indent: '\t' } });
// @ts-expect-error indent stays refused beside an admitted newline
void createEngine(regex, { render: { layout: { indent: '\t', newline: '\n' } } });
// @ts-expect-error per call too
rx.render(node, { layout: { indent: '\t', newline: '\n' } });
void createEngine(regex, { render: { layout: { newline: '\r\n' } } });
