import type { BuilderTerminal } from '@sittir/types';
import type { ImplItem, ImplItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function implItem(config: ImplItemConfig): ImplItem {
  return {
    kind: 'impl_item',
    ...config,
  } as ImplItem;
}

class ImplBuilder implements BuilderTerminal<ImplItem> {
  private _body?: string;
  private _trait?: string;
  private _type: string = '';
  private _typeParameters?: string;
  private _children?: string;

  constructor(type_: string) {
    this._type = type_;
  }

  body(value: string): this {
    this._body = value;
    return this;
  }

  trait(value: string): this {
    this._trait = value;
    return this;
  }

  typeParameters(value: string): this {
    this._typeParameters = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ImplItem {
    return implItem({
      body: this._body,
      trait: this._trait,
      type: this._type,
      typeParameters: this._typeParameters,
      children: this._children,
    } as ImplItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function impl(type_: string): ImplBuilder {
  return new ImplBuilder(type_);
}
