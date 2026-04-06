import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeParameter } from '../types.js';


class TypeParameterBuilder extends BaseBuilder<TypeParameter> {
  private _bounds?: BaseBuilder;
  private _defaultType?: BaseBuilder;
  private _name: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  bounds(value: BaseBuilder): this {
    this._bounds = value;
    return this;
  }

  defaultType(value: BaseBuilder): this {
    this._defaultType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._defaultType) {
      parts.push('=');
      if (this._defaultType) parts.push(this.renderChild(this._defaultType, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      bounds: this._bounds ? this.renderChild(this._bounds, ctx) : undefined,
      defaultType: this._defaultType ? this.renderChild(this._defaultType, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as TypeParameter;
  }

  override get nodeKind(): string { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    if (this._defaultType) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._defaultType) parts.push({ kind: 'builder', builder: this._defaultType, fieldName: 'defaultType' });
    }
    return parts;
  }
}

export function type_parameter(name: BaseBuilder): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}
