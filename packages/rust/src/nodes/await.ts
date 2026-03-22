import type { BuilderTerminal } from '@sittir/types';
import type { AwaitExpression, AwaitExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function awaitExpression(config: AwaitExpressionConfig): AwaitExpression {
  return {
    kind: 'await_expression',
    ...config,
  } as AwaitExpression;
}

class AwaitBuilder implements BuilderTerminal<AwaitExpression> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): AwaitExpression {
    return awaitExpression({
      children: this._children,
    } as AwaitExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function await_(children: string): AwaitBuilder {
  return new AwaitBuilder(children);
}
