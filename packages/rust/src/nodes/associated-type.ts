import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssociatedType } from '../types.js';


class AssociatedTypeBuilder extends BaseBuilder<AssociatedType> {
  private _bounds?: BaseBuilder;
  private _name: BaseBuilder;
  private _typeParameters?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  bounds(value: BaseBuilder): this {
    this._bounds = value;
    return this;
  }

  typeParameters(value: BaseBuilder): this {
    this._typeParameters = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssociatedType {
    return {
      kind: 'associated_type',
      bounds: this._bounds ? this.renderChild(this._bounds, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AssociatedType;
  }

  override get nodeKind(): string { return 'associated_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'type', type: 'type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function associated_type(name: BaseBuilder): AssociatedTypeBuilder {
  return new AssociatedTypeBuilder(name);
}
