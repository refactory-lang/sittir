import type { BuilderTerminal } from '@sittir/types';
import type { WhereClause, WhereClauseConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function whereClause(config: WhereClauseConfig): WhereClause {
  return {
    kind: 'where_clause',
    ...config,
  } as WhereClause;
}

class WhereClauseBuilder implements BuilderTerminal<WhereClause> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): WhereClause {
    return whereClause({
      children: this._children,
    } as WhereClauseConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function where_clause(children: string[]): WhereClauseBuilder {
  return new WhereClauseBuilder(children);
}
