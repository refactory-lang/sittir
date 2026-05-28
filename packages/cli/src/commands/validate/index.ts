import type { Command } from 'commander';
import type { CommandModule } from '../../framework/command-module.ts';
import { registerNamespace } from '../../framework/command-module.ts';
import { counts } from './counts.ts';
import { probeFactory } from './probe-factory.ts';
import { history } from './history.ts';
import { traceRt } from './trace-rt.ts';

export const validateModules: readonly CommandModule[] = [counts, probeFactory, history, traceRt];

export function registerValidate(program: Command): void {
	registerNamespace(program, 'validate', 'Validation utilities for sittir grammar packages', validateModules);
}
