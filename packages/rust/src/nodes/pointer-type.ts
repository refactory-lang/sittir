import type { BuilderTerminal } from '@sittir/types';
import type { PointerType, PointerTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function pointerType(config: PointerTypeConfig): PointerType {
  return {
    kind: 'pointer_type',
    ...config,
  } as PointerType;
}

class PointerTypeBuilder implements BuilderTerminal<PointerType> {
  private _type: string = '';
  private _children?: string;

  constructor(type_: string) {
    this._type = type_;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): PointerType {
    return pointerType({
      type: this._type,
      children: this._children,
    } as PointerTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function pointer_type(type_: string): PointerTypeBuilder {
  return new PointerTypeBuilder(type_);
}
