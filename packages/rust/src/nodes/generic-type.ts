import type { BuilderTerminal } from '@sittir/types';
import type { GenericType, GenericTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function genericType(config: GenericTypeConfig): GenericType {
  return {
    kind: 'generic_type',
    ...config,
  } as GenericType;
}

class GenericTypeBuilder implements BuilderTerminal<GenericType> {
  private _type: string = '';
  private _typeArguments: string = '';

  constructor(type_: string) {
    this._type = type_;
  }

  typeArguments(value: string): this {
    this._typeArguments = value;
    return this;
  }

  build(): GenericType {
    return genericType({
      type: this._type,
      typeArguments: this._typeArguments,
    } as GenericTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function generic_type(type_: string): GenericTypeBuilder {
  return new GenericTypeBuilder(type_);
}
