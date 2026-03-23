import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AliasedImport, DottedName, FutureImportStatement } from '../types.js';


class FutureImportBuilder extends Builder<FutureImportStatement> {
  private _name: Builder<AliasedImport | DottedName>[] = [];

  constructor(...name: Builder<AliasedImport | DottedName>[]) {
    super();
    this._name = name;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('from');
    parts.push('__future__');
    parts.push('import');
    if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FutureImportStatement {
    return {
      kind: 'future_import_statement',
      name: this._name.map(c => c.build(ctx)),
    } as FutureImportStatement;
  }

  override get nodeKind(): string { return 'future_import_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    parts.push({ kind: 'token', text: '__future__', type: '__future__' });
    parts.push({ kind: 'token', text: 'import', type: 'import' });
    for (const child of this._name) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
    }
    return parts;
  }
}

export type { FutureImportBuilder };

export function future_import(...name: Builder<AliasedImport | DottedName>[]): FutureImportBuilder {
  return new FutureImportBuilder(...name);
}

export interface FutureImportStatementOptions {
  name: Builder<AliasedImport | DottedName> | (Builder<AliasedImport | DottedName>)[];
}

export namespace future_import {
  export function from(options: FutureImportStatementOptions): FutureImportBuilder {
    const _ctor = options.name;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new FutureImportBuilder(..._arr);
    return b;
  }
}
