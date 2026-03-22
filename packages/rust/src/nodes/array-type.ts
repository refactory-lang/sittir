import type { BuilderTerminal } from '@sittir/types';
import type { ArrayType, ArrayTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function arrayType(config: ArrayTypeConfig): ArrayType {
  return {
    kind: 'array_type',
    ...config,
  } as ArrayType;
}

class ArrayTypeBuilder implements BuilderTerminal<ArrayType> {
  private _element: string = '';
  private _length?: string;

  constructor(element: string) {
    this._element = element;
  }

  length(value: string): this {
    this._length = value;
    return this;
  }

  build(): ArrayType {
    return arrayType({
      element: this._element,
      length: this._length,
    } as ArrayTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function array_type(element: string): ArrayTypeBuilder {
  return new ArrayTypeBuilder(element);
}
