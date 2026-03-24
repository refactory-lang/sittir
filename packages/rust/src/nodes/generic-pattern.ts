import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericPattern, Identifier, ScopedIdentifier, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';


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
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as GenericPattern;
  }

  override get nodeKind(): 'generic_pattern' { return 'generic_pattern'; }

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
  nodeKind: 'generic_pattern';
  typeArguments: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
  children?: Builder<Identifier | ScopedIdentifier> | string | Omit<ScopedIdentifierOptions, 'nodeKind'> | (Builder<Identifier | ScopedIdentifier> | string | Omit<ScopedIdentifierOptions, 'nodeKind'>)[];
}

export namespace generic_pattern {
  export function from(options: Omit<GenericPatternOptions, 'nodeKind'>): GenericPatternBuilder {
    const _ctor = options.typeArguments;
    const b = new GenericPatternBuilder(_ctor instanceof Builder ? _ctor : type_arguments.from(_ctor));
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('identifier', _x) : _x instanceof Builder ? _x : scoped_identifier.from(_x)));
    }
    return b;
  }
}
