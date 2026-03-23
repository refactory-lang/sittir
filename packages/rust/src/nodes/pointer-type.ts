import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { PointerType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class PointerTypeBuilder extends BaseBuilder<PointerType> {
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
    parts.push('pointer');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PointerType {
    return {
      kind: 'pointer_type',
      type: this.renderChild(this._type, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as PointerType;
  }

  override get nodeKind(): string { return 'pointer_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'pointer' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function pointer_type(type_: Child): PointerTypeBuilder {
  return new PointerTypeBuilder(type_);
}
