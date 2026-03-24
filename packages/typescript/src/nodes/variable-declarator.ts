import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, Identifier, ObjectPattern, TypeAnnotation, VariableDeclarator } from '../types.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class VariableDeclaratorBuilder extends Builder<VariableDeclarator> {
  private _name: Builder<ObjectPattern | ArrayPattern | Identifier>;
  private _type?: Builder<TypeAnnotation>;
  private _value?: Builder<Expression>;

  constructor(name: Builder<ObjectPattern | ArrayPattern | Identifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) {
      parts.push('!');
      if (this._type) parts.push(this.renderChild(this._type, ctx));
    }
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariableDeclarator {
    return {
      kind: 'variable_declarator',
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
    } as VariableDeclarator;
  }

  override get nodeKind(): 'variable_declarator' { return 'variable_declarator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) {
      parts.push({ kind: 'token', text: '!', type: '!' });
      if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    }
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { VariableDeclaratorBuilder };

export function variable_declarator(name: Builder<ObjectPattern | ArrayPattern | Identifier>): VariableDeclaratorBuilder {
  return new VariableDeclaratorBuilder(name);
}

export interface VariableDeclaratorOptions {
  nodeKind: 'variable_declarator';
  name: Builder<ObjectPattern | ArrayPattern | Identifier> | string | ObjectPatternOptions | ArrayPatternOptions;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  value?: Builder<Expression>;
}

export namespace variable_declarator {
  export function from(options: Omit<VariableDeclaratorOptions, 'nodeKind'>): VariableDeclaratorBuilder {
    const _raw = options.name;
    let _ctor: Builder<ObjectPattern | ArrayPattern | Identifier>;
    if (typeof _raw === 'string') {
      _ctor = new LeafBuilder('identifier', _raw);
    } else if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'object_pattern': _ctor = object_pattern.from(_raw); break;
        case 'array_pattern': _ctor = array_pattern.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new VariableDeclaratorBuilder(_ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
