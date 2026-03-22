import type { BuilderTerminal } from '@sittir/types';
import type { UseAsClause, UseAsClauseConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function useAsClause(config: UseAsClauseConfig): UseAsClause {
  return {
    kind: 'use_as_clause',
    ...config,
  } as UseAsClause;
}

class UseAsClauseBuilder implements BuilderTerminal<UseAsClause> {
  private _alias: string = '';
  private _path: string = '';

  constructor(alias: string) {
    this._alias = alias;
  }

  path(value: string): this {
    this._path = value;
    return this;
  }

  build(): UseAsClause {
    return useAsClause({
      alias: this._alias,
      path: this._path,
    } as UseAsClauseConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function use_as_clause(alias: string): UseAsClauseBuilder {
  return new UseAsClauseBuilder(alias);
}
