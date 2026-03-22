import type { BuilderTerminal } from '@sittir/types';
import type { ReferenceType, ReferenceTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function referenceType(config: ReferenceTypeConfig): ReferenceType {
  return {
    kind: 'reference_type',
    ...config,
  } as ReferenceType;
}

class ReferenceTypeBuilder implements BuilderTerminal<ReferenceType> {
  private _type: string = '';
  private _children: string[] = [];

  constructor(type_: string) {
    this._type = type_;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): ReferenceType {
    return referenceType({
      type: this._type,
      children: this._children,
    } as ReferenceTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function reference_type(type_: string): ReferenceTypeBuilder {
  return new ReferenceTypeBuilder(type_);
}
