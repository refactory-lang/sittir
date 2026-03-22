import type { BuilderTerminal } from '@sittir/types';
import type { AssociatedType, AssociatedTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function associatedType(config: AssociatedTypeConfig): AssociatedType {
  return {
    kind: 'associated_type',
    ...config,
  } as AssociatedType;
}

class AssociatedTypeBuilder implements BuilderTerminal<AssociatedType> {
  private _bounds?: string;
  private _name: string = '';
  private _typeParameters?: string;
  private _children?: string;

  constructor(name: string) {
    this._name = name;
  }

  bounds(value: string): this {
    this._bounds = value;
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

  build(): AssociatedType {
    return associatedType({
      bounds: this._bounds,
      name: this._name,
      typeParameters: this._typeParameters,
      children: this._children,
    } as AssociatedTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function associated_type(name: string): AssociatedTypeBuilder {
  return new AssociatedTypeBuilder(name);
}
