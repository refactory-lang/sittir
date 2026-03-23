import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariableDeclaration, VariableDeclarator } from '../types.js';
import { variable_declarator } from './variable-declarator.js';
import type { VariableDeclaratorOptions } from './variable-declarator.js';


class VariableDeclarationBuilder extends Builder<VariableDeclaration> {
  private _children: Builder<VariableDeclarator>[] = [];

  constructor(...children: Builder<VariableDeclarator>[]) {
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
      children: this._children.map(c => c.build(ctx)),
    } as VariableDeclaration;
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

export type { VariableDeclarationBuilder };

export function variable_declaration(...children: Builder<VariableDeclarator>[]): VariableDeclarationBuilder {
  return new VariableDeclarationBuilder(...children);
}

export interface VariableDeclarationOptions {
  children?: Builder<VariableDeclarator> | VariableDeclaratorOptions | (Builder<VariableDeclarator> | VariableDeclaratorOptions)[];
}

export namespace variable_declaration {
  export function from(options: VariableDeclarationOptions): VariableDeclarationBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new VariableDeclarationBuilder(..._arr.map(_v => _v instanceof Builder ? _v : variable_declarator.from(_v as VariableDeclaratorOptions)));
    return b;
  }
}
