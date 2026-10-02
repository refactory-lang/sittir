import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import regex, { type RegexAPI } from '@sittir/regex';

// The descriptor's createEngine takes exactly what createEngine(regex, …) takes.
const viaDescriptor: Promise<Engine<RegexAPI>> = regex.createEngine();
const viaFunction: Promise<Engine<RegexAPI>> = createEngine(regex);
void [viaDescriptor, viaFunction];
// @ts-expect-error a key the grammar's render options do not have
void regex.createEngine({ render: { indnet: '\t' } });
// @ts-expect-error the function form refuses it the same way
void createEngine(regex, { render: { indnet: '\t' } });
