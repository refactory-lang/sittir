import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariableDeclaration, VariableDeclarator } from '../types.js';


class VariableBuilder extends Builder<VariableDeclaration> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('var');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariableDeclaration {
    return {
      kind: 'variable_declaration',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as VariableDeclaration;
  }

  override get nodeKind(): string { return 'variable_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'var', type: 'var' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { VariableBuilder };

export function variable(...children: Builder[]): VariableBuilder {
  return new VariableBuilder(...children);
}

export interface VariableDeclarationOptions {
  children: Builder<VariableDeclarator> | (Builder<VariableDeclarator>)[];
}

export namespace variable {
  export function from(options: VariableDeclarationOptions): VariableBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new VariableBuilder(..._arr);
    return b;
  }
}
