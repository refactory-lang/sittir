import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumBody } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class EnumBodyBuilder extends BaseBuilder<EnumBody> {
  private _name: Child[] = [];
  private _children: Child[] = [];

  constructor() { super(); }

  name(value: Child[]): this {
    this._name = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) {
      parts.push(this.renderChildren(this._children, ' ', ctx));
    }
    if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumBody {
    return {
      kind: 'enum_body',
      name: this._name.map(c => this.renderChild(c, ctx)),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as EnumBody;
  }

  override get nodeKind(): string { return 'enum_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    for (const child of this._name) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
    }
    return parts;
  }
}

export function enum_body(): EnumBodyBuilder {
  return new EnumBodyBuilder();
}
