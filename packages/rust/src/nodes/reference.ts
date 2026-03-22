import type { BuilderTerminal } from '@sittir/types';
import type { ReferenceExpression, ReferenceExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function referenceExpression(config: ReferenceExpressionConfig): ReferenceExpression {
  return {
    kind: 'reference_expression',
    ...config,
  } as ReferenceExpression;
}

class ReferenceBuilder implements BuilderTerminal<ReferenceExpression> {
  private _value: string = '';
  private _children?: string;

  constructor(value: string) {
    this._value = value;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ReferenceExpression {
    return referenceExpression({
      value: this._value,
      children: this._children,
    } as ReferenceExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function reference(value: string): ReferenceBuilder {
  return new ReferenceBuilder(value);
}
