import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldDeclarationList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FieldDeclarationListBuilder extends BaseBuilder<FieldDeclarationList> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldDeclarationList {
    return {
      kind: 'field_declaration_list',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldDeclarationList;
  }

  override get nodeKind(): string { return 'field_declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function field_declaration_list(): FieldDeclarationListBuilder {
  return new FieldDeclarationListBuilder();
}
