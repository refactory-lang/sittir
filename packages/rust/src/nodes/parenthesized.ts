import type { BuilderTerminal } from '@sittir/types';
import type { ParenthesizedExpression, ParenthesizedExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function parenthesizedExpression(config: ParenthesizedExpressionConfig): ParenthesizedExpression {
  return {
    kind: 'parenthesized_expression',
    ...config,
  } as ParenthesizedExpression;
}

class ParenthesizedBuilder implements BuilderTerminal<ParenthesizedExpression> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): ParenthesizedExpression {
    return parenthesizedExpression({
      children: this._children,
    } as ParenthesizedExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function parenthesized(children: string): ParenthesizedBuilder {
  return new ParenthesizedBuilder(children);
}
