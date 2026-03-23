import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldInitializerList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FieldInitializerListBuilder extends BaseBuilder<FieldInitializerList> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldInitializerList {
    return {
      kind: 'field_initializer_list',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldInitializerList;
  }

  override get nodeKind(): string { return 'field_initializer_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function field_initializer_list(): FieldInitializerListBuilder {
  return new FieldInitializerListBuilder();
}
