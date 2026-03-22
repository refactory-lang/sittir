import type { BuilderTerminal } from '@sittir/types';
import type { QualifiedType, QualifiedTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function qualifiedType(config: QualifiedTypeConfig): QualifiedType {
  return {
    kind: 'qualified_type',
    ...config,
  } as QualifiedType;
}

class QualifiedTypeBuilder implements BuilderTerminal<QualifiedType> {
  private _alias: string = '';
  private _type: string = '';

  constructor(alias: string) {
    this._alias = alias;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  build(): QualifiedType {
    return qualifiedType({
      alias: this._alias,
      type: this._type,
    } as QualifiedTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function qualified_type(alias: string): QualifiedTypeBuilder {
  return new QualifiedTypeBuilder(alias);
}
