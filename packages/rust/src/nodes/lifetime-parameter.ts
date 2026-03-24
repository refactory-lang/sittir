import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Lifetime, LifetimeParameter, TraitBounds } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';
import { trait_bounds } from './trait-bounds.js';
import type { TraitBoundsOptions } from './trait-bounds.js';


class LifetimeParameterBuilder extends Builder<LifetimeParameter> {
  private _name: Builder<Lifetime>;
  private _bounds?: Builder<TraitBounds>;

  constructor(name: Builder<Lifetime>) {
    super();
    this._name = name;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LifetimeParameter {
    return {
      kind: 'lifetime_parameter',
      name: this._name.build(ctx),
      bounds: this._bounds ? this._bounds.build(ctx) : undefined,
    } as LifetimeParameter;
  }

  override get nodeKind(): 'lifetime_parameter' { return 'lifetime_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    return parts;
  }
}

export type { LifetimeParameterBuilder };

export function lifetime_parameter(name: Builder<Lifetime>): LifetimeParameterBuilder {
  return new LifetimeParameterBuilder(name);
}

export interface LifetimeParameterOptions {
  nodeKind: 'lifetime_parameter';
  name: Builder<Lifetime> | Omit<LifetimeOptions, 'nodeKind'>;
  bounds?: Builder<TraitBounds> | Omit<TraitBoundsOptions, 'nodeKind'>;
}

export namespace lifetime_parameter {
  export function from(options: Omit<LifetimeParameterOptions, 'nodeKind'>): LifetimeParameterBuilder {
    const _ctor = options.name;
    const b = new LifetimeParameterBuilder(_ctor instanceof Builder ? _ctor : lifetime.from(_ctor));
    if (options.bounds !== undefined) {
      const _v = options.bounds;
      b.bounds(_v instanceof Builder ? _v : trait_bounds.from(_v));
    }
    return b;
  }
}
