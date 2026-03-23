import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StructItem } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class StructBuilder extends BaseBuilder<StructItem> {
  private _body?: Child;
  private _name: Child;
  private _typeParameters?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  body(value: Child): this {
    this._body = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('struct');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StructItem {
    return {
      kind: 'struct_item',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as StructItem;
  }

  override get nodeKind(): string { return 'struct_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'struct', type: 'struct' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function struct_(name: Child): StructBuilder {
  return new StructBuilder(name);
}
