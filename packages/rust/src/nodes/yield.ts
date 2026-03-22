import type { BuilderTerminal } from '@sittir/types';
import type { YieldExpression, YieldExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function yieldExpression(config: YieldExpressionConfig): YieldExpression {
  return {
    kind: 'yield_expression',
    ...config,
  } as YieldExpression;
}

class YieldBuilder implements BuilderTerminal<YieldExpression> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): YieldExpression {
    return yieldExpression({
      children: this._children,
    } as YieldExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function yield_(): YieldBuilder {
  return new YieldBuilder();
}
