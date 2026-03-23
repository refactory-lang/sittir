import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AmbientDeclaration, Declaration, PropertyIdentifier, StatementBlock } from '../types.js';


class AmbientBuilder extends Builder<AmbientDeclaration> {
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

export type { AmbientBuilder };

export function ambient(...children: Builder<Declaration | PropertyIdentifier | StatementBlock>[]): AmbientBuilder {
  return new AmbientBuilder(...children);
}

export interface AmbientDeclarationOptions {
  children: Builder<Declaration | PropertyIdentifier | StatementBlock> | (Builder<Declaration | PropertyIdentifier | StatementBlock>)[];
}

export namespace ambient {
  export function from(options: AmbientDeclarationOptions): AmbientBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new AmbientBuilder(..._arr);
    return b;
  }
}
