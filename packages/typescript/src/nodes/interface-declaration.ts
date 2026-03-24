import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsTypeClause, InterfaceBody, InterfaceDeclaration, TypeIdentifier, TypeParameters } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { interface_body } from './interface-body.js';
import type { InterfaceBodyOptions } from './interface-body.js';
import { extends_type_clause } from './extends-type-clause.js';
import type { ExtendsTypeClauseOptions } from './extends-type-clause.js';


class InterfaceDeclarationBuilder extends Builder<InterfaceDeclaration> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _body!: Builder<InterfaceBody>;
  private _children: Builder<ExtendsTypeClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  body(value: Builder<InterfaceBody>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<ExtendsTypeClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('interface');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InterfaceDeclaration {
    return {
      kind: 'interface_declaration',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as InterfaceDeclaration;
  }

  override get nodeKind(): 'interface_declaration' { return 'interface_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'interface', type: 'interface' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { InterfaceDeclarationBuilder };

export function interface_declaration(name: Builder<TypeIdentifier>): InterfaceDeclarationBuilder {
  return new InterfaceDeclarationBuilder(name);
}

export interface InterfaceDeclarationOptions {
  nodeKind: 'interface_declaration';
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  body: Builder<InterfaceBody> | Omit<InterfaceBodyOptions, 'nodeKind'>;
  children?: Builder<ExtendsTypeClause> | Omit<ExtendsTypeClauseOptions, 'nodeKind'> | (Builder<ExtendsTypeClause> | Omit<ExtendsTypeClauseOptions, 'nodeKind'>)[];
}

export namespace interface_declaration {
  export function from(options: Omit<InterfaceDeclarationOptions, 'nodeKind'>): InterfaceDeclarationBuilder {
    const _ctor = options.name;
    const b = new InterfaceDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : interface_body.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : extends_type_clause.from(_x)));
    }
    return b;
  }
}
