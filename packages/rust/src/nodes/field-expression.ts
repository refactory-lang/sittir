import type { BuilderTerminal } from '@sittir/types';
import type { FieldExpression, FieldExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldExpression(config: FieldExpressionConfig): FieldExpression {
  return {
    kind: 'field_expression',
    ...config,
  } as FieldExpression;
}

class FieldBuilder implements BuilderTerminal<FieldExpression> {
  private _field: string = '';
  private _value: string = '';

  constructor(field: string) {
    this._field = field;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  build(): FieldExpression {
    return fieldExpression({
      field: this._field,
      value: this._value,
    } as FieldExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field(field: string): FieldBuilder {
  return new FieldBuilder(field);
}
