import type { BuilderTerminal } from '@sittir/types';
import type { UnaryExpression, UnaryExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function unaryExpression(config: UnaryExpressionConfig): UnaryExpression {
  return {
    kind: 'unary_expression',
    ...config,
  } as UnaryExpression;
}

class UnaryBuilder implements BuilderTerminal<UnaryExpression> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): UnaryExpression {
    return unaryExpression({
      children: this._children,
    } as UnaryExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function unary(children: string): UnaryBuilder {
  return new UnaryBuilder(children);
}
