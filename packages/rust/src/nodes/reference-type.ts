import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReferenceType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ReferenceTypeBuilder extends BaseBuilder<ReferenceType> {
  private _type: Child;
  private _children: Child[] = [];

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferenceType {
    return {
      kind: 'reference_type',
      type: this.renderChild(this._type, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReferenceType;
  }

  override get nodeKind(): string { return 'reference_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function reference_type(type_: Child): ReferenceTypeBuilder {
  return new ReferenceTypeBuilder(type_);
}
