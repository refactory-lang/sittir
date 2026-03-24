import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LexicalDeclaration, VariableDeclarator } from '../types.js';
import { variable_declarator } from './variable-declarator.js';
import type { VariableDeclaratorOptions } from './variable-declarator.js';


class LexicalDeclarationBuilder extends Builder<LexicalDeclaration> {
  private _kind: Builder;
  private _children: Builder<VariableDeclarator>[] = [];

  constructor(kind: Builder) {
    super();
    this._kind = kind;
  }

  children(...value: Builder<VariableDeclarator>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LexicalDeclaration {
    return {
      kind: 'lexical_declaration',
      children: this._children.map(c => c.build(ctx)),
    } as LexicalDeclaration;
  }

  override get nodeKind(): 'lexical_declaration' { return 'lexical_declaration'; }

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

export type { LexicalDeclarationBuilder };

export function lexical_declaration(kind: Builder): LexicalDeclarationBuilder {
  return new LexicalDeclarationBuilder(kind);
}

export interface LexicalDeclarationOptions {
  nodeKind: 'lexical_declaration';
  kind: Builder;
  children?: Builder<VariableDeclarator> | Omit<VariableDeclaratorOptions, 'nodeKind'> | (Builder<VariableDeclarator> | Omit<VariableDeclaratorOptions, 'nodeKind'>)[];
}

export namespace lexical_declaration {
  export function from(options: Omit<LexicalDeclarationOptions, 'nodeKind'>): LexicalDeclarationBuilder {
    const b = new LexicalDeclarationBuilder(options.kind);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : variable_declarator.from(_x)));
    }
    return b;
  }
}
