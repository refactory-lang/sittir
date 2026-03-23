import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportClause, ExportSpecifier } from '../types.js';
import { export_specifier } from './export-specifier.js';
import type { ExportSpecifierOptions } from './export-specifier.js';


class ExportClauseBuilder extends Builder<ExportClause> {
  private _children: Builder<ExportSpecifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<ExportSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportClause {
    return {
      kind: 'export_clause',
      children: this._children.map(c => c.build(ctx)),
    } as ExportClause;
  }

  override get nodeKind(): string { return 'export_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ExportClauseBuilder };

export function export_clause(): ExportClauseBuilder {
  return new ExportClauseBuilder();
}

export interface ExportClauseOptions {
  children?: Builder<ExportSpecifier> | ExportSpecifierOptions | (Builder<ExportSpecifier> | ExportSpecifierOptions)[];
}

export namespace export_clause {
  export function from(options: ExportClauseOptions): ExportClauseBuilder {
    const b = new ExportClauseBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : export_specifier.from(_x as ExportSpecifierOptions)));
    }
    return b;
  }
}
