import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericPattern, Identifier, ScopedIdentifier, TypeArguments } from '../types.js';


class GenericPatternBuilder extends Builder<GenericPattern> {
  private _typeArguments: Builder<TypeArguments>;
  private _children: Builder<Identifier | ScopedIdentifier>[] = [];

  constructor(typeArguments: Builder<TypeArguments>) {
    super();
    this._typeArguments = typeArguments;
  }

  children(...value: Builder<Identifier | ScopedIdentifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('::');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericPattern {
    return {
      kind: 'generic_pattern',
      typeArguments: this._typeArguments.build(ctx),
      children: this._children[0]?.build(ctx),
    } as GenericPattern;
  }

  override get nodeKind(): string { return 'generic_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericPatternBuilder };

export function generic_pattern(typeArguments: Builder<TypeArguments>): GenericPatternBuilder {
  return new GenericPatternBuilder(typeArguments);
}

export interface GenericPatternOptions {
  typeArguments: Builder<TypeArguments>;
  children?: Builder<Identifier | ScopedIdentifier> | (Builder<Identifier | ScopedIdentifier>)[];
}

export namespace generic_pattern {
  export function from(options: GenericPatternOptions): GenericPatternBuilder {
    const b = new GenericPatternBuilder(options.typeArguments);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
