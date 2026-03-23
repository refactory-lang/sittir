import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Lifetime, LifetimeParameter, TraitBounds } from '../types.js';


class LifetimeParameterBuilder extends Builder<LifetimeParameter> {
  private _bounds?: Builder<TraitBounds>;
  private _name: Builder<Lifetime>;

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
      bounds: this._bounds?.build(ctx),
      name: this._name.build(ctx),
    } as LifetimeParameter;
  }

  override get nodeKind(): string { return 'lifetime_parameter'; }

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
  bounds?: Builder<TraitBounds>;
  name: Builder<Lifetime>;
}

export namespace lifetime_parameter {
  export function from(options: LifetimeParameterOptions): LifetimeParameterBuilder {
    const b = new LifetimeParameterBuilder(options.name);
    if (options.bounds !== undefined) b.bounds(options.bounds);
    return b;
  }
}
