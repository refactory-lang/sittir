import type { BuilderTerminal } from '@sittir/types';
import type { ContinueExpression, ContinueExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function continueExpression(config: ContinueExpressionConfig): ContinueExpression {
  return {
    kind: 'continue_expression',
    ...config,
  } as ContinueExpression;
}

class ContinueBuilder implements BuilderTerminal<ContinueExpression> {
  private _children?: string;

  constructor() {}

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ContinueExpression {
    return continueExpression({
      children: this._children,
    } as ContinueExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function continue_(): ContinueBuilder {
  return new ContinueBuilder();
}
