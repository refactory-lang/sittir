import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import scm, { type ScmAPI } from '@sittir/scm';

// The descriptor's createEngine takes exactly what createEngine(scm, …) takes.
const viaDescriptor: Promise<Engine<ScmAPI>> = scm.createEngine();
const viaFunction: Promise<Engine<ScmAPI>> = createEngine(scm);
void [viaDescriptor, viaFunction];
// @ts-expect-error a key the grammar's render options do not have
void scm.createEngine({ render: { indnet: '\t' } });
// @ts-expect-error the function form refuses it the same way
void createEngine(scm, { render: { indnet: '\t' } });
