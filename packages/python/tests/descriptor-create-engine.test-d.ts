import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import python, { type PythonAPI } from '@sittir/python';

// The descriptor's createEngine takes exactly what createEngine(python, …) takes.
const viaDescriptor: Promise<Engine<PythonAPI>> = python.createEngine();
const viaFunction: Promise<Engine<PythonAPI>> = createEngine(python);
void [viaDescriptor, viaFunction];
// @ts-expect-error a key the grammar's render options do not have
void python.createEngine({ render: { indnet: '\t' } });
// @ts-expect-error the function form refuses it the same way
void createEngine(python, { render: { indnet: '\t' } });
