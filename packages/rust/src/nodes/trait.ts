import type { BuilderTerminal } from '@sittir/types';
import type { TraitItem, TraitItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function traitItem(config: TraitItemConfig): TraitItem {
  return {
    kind: 'trait_item',
    ...config,
  } as TraitItem;
}

class TraitBuilder implements BuilderTerminal<TraitItem> {
  private _body: string = '';
  private _bounds?: string;
  private _name: string = '';
  private _typeParameters?: string;
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  body(value: string): this {
    this._body = value;
    return this;
  }

  bounds(value: string): this {
    this._bounds = value;
    return this;
  }

  typeParameters(value: string): this {
    this._typeParameters = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): TraitItem {
    return traitItem({
      body: this._body,
      bounds: this._bounds,
      name: this._name,
      typeParameters: this._typeParameters,
      children: this._children,
    } as TraitItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function trait(name: string): TraitBuilder {
  return new TraitBuilder(name);
}
