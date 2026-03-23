import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LifetimeParameter } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LifetimeParameterBuilder extends BaseBuilder<LifetimeParameter> {
  private _bounds?: Child;
  private _name: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  bounds(value: Child): this {
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
      bounds: this._bounds ? this.renderChild(this._bounds, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as LifetimeParameter;
  }

  override get nodeKind(): string { return 'lifetime_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    return parts;
  }
}

export function lifetime_parameter(name: Child): LifetimeParameterBuilder {
  return new LifetimeParameterBuilder(name);
}
