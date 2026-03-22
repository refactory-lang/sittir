import type { BuilderTerminal } from '@sittir/types';
import type { ForExpression, ForExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function forExpression(config: ForExpressionConfig): ForExpression {
  return {
    kind: 'for_expression',
    ...config,
  } as ForExpression;
}

class ForBuilder implements BuilderTerminal<ForExpression> {
  private _body: string = '';
  private _pattern: string = '';
  private _value: string = '';
  private _children?: string;

  constructor(body: string) {
    this._body = body;
  }

  pattern(value: string): this {
    this._pattern = value;
    return this;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ForExpression {
    return forExpression({
      body: this._body,
      pattern: this._pattern,
      value: this._value,
      children: this._children,
    } as ForExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function for_(body: string): ForBuilder {
  return new ForBuilder(body);
}
