import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LexicalDeclaration } from '../types.js';


class LexicalBuilder extends BaseBuilder<LexicalDeclaration> {
  private _kind: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(kind: BaseBuilder) {
    super();
    this._kind = kind;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LexicalDeclaration {
    return {
      kind: 'lexical_declaration',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LexicalDeclaration;
  }

  override get nodeKind(): string { return 'lexical_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._kind) parts.push({ kind: 'builder', builder: this._kind, fieldName: 'kind' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function lexical(kind: BaseBuilder): LexicalBuilder {
  return new LexicalBuilder(kind);
}
