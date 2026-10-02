import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import typescript, { type TypescriptAPI } from '@sittir/typescript';

// The descriptor's createEngine takes exactly what createEngine(typescript, …) takes.
const viaDescriptor: Promise<Engine<TypescriptAPI>> = typescript.createEngine();
const viaFunction: Promise<Engine<TypescriptAPI>> = createEngine(typescript);
void [viaDescriptor, viaFunction];
// @ts-expect-error a key the grammar's render options do not have
void typescript.createEngine({ render: { indnet: '\t' } });
// @ts-expect-error the function form refuses it the same way
void createEngine(typescript, { render: { indnet: '\t' } });
