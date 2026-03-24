import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NamespaceExport, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


class NamespaceExportBuilder extends Builder<NamespaceExport> {
  private _children: Builder<Identifier | String>[] = [];

  constructor(children: Builder<Identifier | String>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    parts.push('as');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamespaceExport {
    return {
      kind: 'namespace_export',
      children: this._children[0]!.build(ctx),
    } as NamespaceExport;
  }

  override get nodeKind(): 'namespace_export' { return 'namespace_export'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { NamespaceExportBuilder };

export function namespace_export(children: Builder<Identifier | String>): NamespaceExportBuilder {
  return new NamespaceExportBuilder(children);
}

export interface NamespaceExportOptions {
  nodeKind: 'namespace_export';
  children: Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'> | (Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'>)[];
}

export namespace namespace_export {
  export function from(input: Omit<NamespaceExportOptions, 'nodeKind'> | Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'> | (Builder<Identifier | String> | string | Omit<StringOptions, 'nodeKind'>)[]): NamespaceExportBuilder {
    const options: Omit<NamespaceExportOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<NamespaceExportOptions, 'nodeKind'>
      : { children: input } as Omit<NamespaceExportOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NamespaceExportBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : string.from(_ctor));
    return b;
  }
}
