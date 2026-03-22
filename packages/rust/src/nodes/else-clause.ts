import type { BuilderTerminal } from '@sittir/types';
import type { ElseClause, ElseClauseConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function elseClause(config: ElseClauseConfig): ElseClause {
  return {
    kind: 'else_clause',
    ...config,
  } as ElseClause;
}

class ElseClauseBuilder implements BuilderTerminal<ElseClause> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): ElseClause {
    return elseClause({
      children: this._children,
    } as ElseClauseConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function else_clause(children: string): ElseClauseBuilder {
  return new ElseClauseBuilder(children);
}
