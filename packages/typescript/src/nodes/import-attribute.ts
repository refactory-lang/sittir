import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportAttribute, Object } from '../types.js';
import { object } from './object.js';
import type { ObjectOptions } from './object.js';


class ImportAttributeBuilder extends Builder<ImportAttribute> {
  private _children: Builder<Object>[] = [];

  constructor(children: Builder<Object>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('with');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportAttribute {
    return {
      kind: 'import_attribute',
      children: this._children[0]!.build(ctx),
    } as ImportAttribute;
  }

  override get nodeKind(): 'import_attribute' { return 'import_attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'with', type: 'with' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ImportAttributeBuilder };

export function import_attribute(children: Builder<Object>): ImportAttributeBuilder {
  return new ImportAttributeBuilder(children);
}

export interface ImportAttributeOptions {
  nodeKind: 'import_attribute';
  children: Builder<Object> | Omit<ObjectOptions, 'nodeKind'> | (Builder<Object> | Omit<ObjectOptions, 'nodeKind'>)[];
}

export namespace import_attribute {
  export function from(input: Omit<ImportAttributeOptions, 'nodeKind'> | Builder<Object> | Omit<ObjectOptions, 'nodeKind'> | (Builder<Object> | Omit<ObjectOptions, 'nodeKind'>)[]): ImportAttributeBuilder {
    const options: Omit<ImportAttributeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ImportAttributeOptions, 'nodeKind'>
      : { children: input } as Omit<ImportAttributeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ImportAttributeBuilder(_ctor instanceof Builder ? _ctor : object.from(_ctor));
    return b;
  }
}
