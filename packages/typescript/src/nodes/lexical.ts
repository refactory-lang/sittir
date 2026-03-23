import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LexicalDeclaration, VariableDeclarator } from '../types.js';


class LexicalBuilder extends Builder<LexicalDeclaration> {
  private _kind: Builder;
  private _children: Builder[] = [];

  constructor(kind: Builder) {
    super();
    this._kind = kind;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
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
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { LexicalBuilder };

export function lexical(kind: Builder): LexicalBuilder {
  return new LexicalBuilder(kind);
}

export interface LexicalDeclarationOptions {
  kind: Builder;
  children?: Builder<VariableDeclarator> | (Builder<VariableDeclarator>)[];
}

export namespace lexical {
  export function from(options: LexicalDeclarationOptions): LexicalBuilder {
    const b = new LexicalBuilder(options.kind);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
