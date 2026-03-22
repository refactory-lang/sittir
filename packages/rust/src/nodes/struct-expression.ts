import type { BuilderTerminal } from '@sittir/types';
import type { StructExpression, StructExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function structExpression(config: StructExpressionConfig): StructExpression {
  return {
    kind: 'struct_expression',
    ...config,
  } as StructExpression;
}

class StructBuilder implements BuilderTerminal<StructExpression> {
  private _body: string = '';
  private _name: string = '';

  constructor(name: string) {
    this._name = name;
  }

  body(value: string): this {
    this._body = value;
    return this;
  }

  build(): StructExpression {
    return structExpression({
      body: this._body,
      name: this._name,
    } as StructExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function struct_(name: string): StructBuilder {
  return new StructBuilder(name);
}
