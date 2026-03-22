import type { BuilderTerminal } from '@sittir/types';
import type { BreakExpression, BreakExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function breakExpression(config: BreakExpressionConfig): BreakExpression {
  return {
    kind: 'break_expression',
    ...config,
  } as BreakExpression;
}

class BreakBuilder implements BuilderTerminal<BreakExpression> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): BreakExpression {
    return breakExpression({
      children: this._children,
    } as BreakExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function break_(): BreakBuilder {
  return new BreakBuilder();
}
