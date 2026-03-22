import type { BuilderTerminal } from '@sittir/types';
import type { TypeCastExpression, TypeCastExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function typeCastExpression(config: TypeCastExpressionConfig): TypeCastExpression {
  return {
    kind: 'type_cast_expression',
    ...config,
  } as TypeCastExpression;
}

class TypeCastBuilder implements BuilderTerminal<TypeCastExpression> {
  private _type: string = '';
  private _value: string = '';

  constructor(type_: string) {
    this._type = type_;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  build(): TypeCastExpression {
    return typeCastExpression({
      type: this._type,
      value: this._value,
    } as TypeCastExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function type_cast(type_: string): TypeCastBuilder {
  return new TypeCastBuilder(type_);
}
