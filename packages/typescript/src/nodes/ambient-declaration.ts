import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AmbientDeclaration, Declaration, PropertyIdentifier, StatementBlock } from '../types.js';


class AmbientDeclarationBuilder extends Builder<AmbientDeclaration> {
  private _children: Builder<Declaration | PropertyIdentifier | StatementBlock>[] = [];

  constructor(...children: Builder<Declaration | PropertyIdentifier | StatementBlock>[]) {
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

  override get nodeKind(): string { return 'ambient_declaration'; }

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

export function ambient_declaration(...children: Builder<Declaration | PropertyIdentifier | StatementBlock>[]): AmbientDeclarationBuilder {
  return new AmbientDeclarationBuilder(...children);
}

export interface AmbientDeclarationOptions {
  children: Builder<Declaration | PropertyIdentifier | StatementBlock> | (Builder<Declaration | PropertyIdentifier | StatementBlock>)[];
}

export namespace ambient_declaration {
  export function from(options: AmbientDeclarationOptions): AmbientDeclarationBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new AmbientDeclarationBuilder(..._arr);
    return b;
  }
}
