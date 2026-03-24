import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AmbientDeclaration, Declaration, PropertyIdentifier, StatementBlock, Type } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class AmbientDeclarationBuilder extends Builder<AmbientDeclaration> {
  private _children: Builder<Declaration | StatementBlock | PropertyIdentifier | Type>[] = [];

  constructor(...children: Builder<Declaration | StatementBlock | PropertyIdentifier | Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('declare');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AmbientDeclaration {
    return {
      kind: 'ambient_declaration',
      children: this._children.map(c => c.build(ctx)),
    } as AmbientDeclaration;
  }

  override get nodeKind(): 'ambient_declaration' { return 'ambient_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'declare', type: 'declare' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AmbientDeclarationBuilder };

export function ambient_declaration(...children: Builder<Declaration | StatementBlock | PropertyIdentifier | Type>[]): AmbientDeclarationBuilder {
  return new AmbientDeclarationBuilder(...children);
}

export interface AmbientDeclarationOptions {
  nodeKind: 'ambient_declaration';
  children?: Builder<Declaration | StatementBlock | PropertyIdentifier | Type> | Omit<StatementBlockOptions, 'nodeKind'> | (Builder<Declaration | StatementBlock | PropertyIdentifier | Type> | Omit<StatementBlockOptions, 'nodeKind'>)[];
}

export namespace ambient_declaration {
  export function from(input: Omit<AmbientDeclarationOptions, 'nodeKind'> | Builder<Declaration | StatementBlock | PropertyIdentifier | Type> | Omit<StatementBlockOptions, 'nodeKind'> | (Builder<Declaration | StatementBlock | PropertyIdentifier | Type> | Omit<StatementBlockOptions, 'nodeKind'>)[]): AmbientDeclarationBuilder {
    const options: Omit<AmbientDeclarationOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AmbientDeclarationOptions, 'nodeKind'>
      : { children: input } as Omit<AmbientDeclarationOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new AmbientDeclarationBuilder(..._arr.map(_v => _v instanceof Builder ? _v : statement_block.from(_v)));
    return b;
  }
}
