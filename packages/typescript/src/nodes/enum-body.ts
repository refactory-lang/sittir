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
    parts.push('{');
    if (this._name.length > 0) {
      if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
      parts.push(',');
      parts.push(',');
    }
    parts.push('}');
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
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._name.length > 0) {
      for (const child of this._name) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function enum_body(): EnumBodyBuilder {
  return new EnumBodyBuilder();
}
