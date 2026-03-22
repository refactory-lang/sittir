import type { BuilderTerminal } from '@sittir/types';
import type { ReturnExpression, ReturnExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function returnExpression(config: ReturnExpressionConfig): ReturnExpression {
  return {
    kind: 'return_expression',
    ...config,
  } as ReturnExpression;
}

class ReturnBuilder implements BuilderTerminal<ReturnExpression> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ReturnExpression {
    return returnExpression({
      children: this._children,
    } as ReturnExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function return_(): ReturnBuilder {
  return new ReturnBuilder();
}
