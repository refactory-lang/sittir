import type { BuilderTerminal } from '@sittir/types';
import type { ExpressionStatement, ExpressionStatementConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function expressionStatement(config: ExpressionStatementConfig): ExpressionStatement {
  return {
    kind: 'expression_statement',
    ...config,
  } as ExpressionStatement;
}

class ExpressionBuilder implements BuilderTerminal<ExpressionStatement> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): ExpressionStatement {
    return expressionStatement({
      children: this._children,
    } as ExpressionStatementConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function expression(children: string): ExpressionBuilder {
  return new ExpressionBuilder(children);
}
